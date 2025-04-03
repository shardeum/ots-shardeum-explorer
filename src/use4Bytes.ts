import {
  BigNumberish,
  Fragment,
  Interface,
  TransactionDescription,
} from "ethers";
import { useContext, useMemo } from "react";
import { Fetcher } from "swr";
import useSWRImmutable from "swr/immutable";
import { useSourcifyMetadata } from "./sourcify/useSourcify";
import { fourBytesURL } from "./url";
import { RuntimeContext } from "./useRuntime";

export type FourBytesEntry = {
  name: string;
  signature: string | undefined;
  fromVerifiedContract: boolean;
};

/**
 * Given a hex input data; extract the method selector
 *
 * @param rawInput Raw tx input including the "0x"
 * @returns the first 4 bytes, including the "0x" or null if the input
 * contains an invalid selector, e.g., txs with 0x00 data; simple transfers (0x)
 * return null as well as it is not a method selector
 */
export const extract4Bytes = (rawInput: string): string | null => {
  if (rawInput.length < 10) {
    return null;
  }
  return rawInput.slice(0, 10);
};

type FourBytesKey = [id: "4bytes", fourBytes: string];
type FourBytesFetcher = Fetcher<
  FourBytesEntry | null | undefined,
  FourBytesKey
>;

const fourBytesFetcher =
  (assetsURLPrefix: string): FourBytesFetcher =>
  async ([_, key]) => {
    if (key === null || key === "0x") {
      return undefined;
    }

    // Handle simple transfers with invalid selector like tx:
    // 0x8bcbdcc1589b5c34c1e55909c8269a411f0267a4fed59a73dd4348cc71addbb9,
    // which contains 0x00 as data
    if (key.length !== 10) {
      return undefined;
    }

    const fourBytes = key.slice(2);
    const signatureURL = fourBytesURL(assetsURLPrefix, fourBytes);

    try {
      const res = await fetch(signatureURL);
      if (!res.ok) {
        console.warn(`Signature does not exist in 4bytes DB: ${fourBytes}`);
        return null;
      }

      // Get the response JSON
      const response = await res.json();
      
      // Check if response is valid
      if (!response.ok || !response.result?.function?.[key]) {
        console.warn(`Invalid signature response for: ${fourBytes}`);
        return null;
      }

      // Get the first signature
      const signatures = response.result.function[key];
      if (!signatures || signatures.length === 0) {
        console.warn(`No signatures found for: ${fourBytes}`);
        return null;
      }

      const sig = signatures[0].name;
      
      // Validate signature format (should contain at least one parenthesis)
      if (!sig.includes("(")) {
        console.warn(`Invalid signature format for: ${fourBytes}`);
        return null;
      }

      const cut = sig.indexOf("(");
      const method = sig.slice(0, cut);

      const entry: FourBytesEntry = {
        name: method,
        signature: sig,
        fromVerifiedContract: false,
      };
      return entry;
    } catch (err) {
      // Network error or something wrong with URL config;
      // silence and don't try it again
      console.warn(`Error fetching signature for ${fourBytes}:`, err);
      return null;
    }
  };

/**
 * Extract 4bytes DB info
 *
 * @param rawFourBytes a hex string containing the 4bytes signature in the "0xXXXXXXXX" format.
 * @param address (optional) the address to which this four-byte selector is sent; if a
 * Sourcify match exists at this address, the contract ABI will be used to decode the selector.
 */
export const use4Bytes = (
  rawFourBytes: string | null,
  address?: string,
): FourBytesEntry | null | undefined => {
  if (rawFourBytes !== null && !rawFourBytes.startsWith("0x")) {
    throw new Error(
      `rawFourBytes must contain a bytes hex string starting with 0x; received value: "${rawFourBytes}"`,
    );
  }

  const { config, provider } = useContext(RuntimeContext);
  const sourcifyMatch = useSourcifyMetadata(
    address,
    provider?._network.chainId,
  );
  let sourcifyFourBytes: FourBytesEntry | null = null;
  if (sourcifyMatch && rawFourBytes) {
    try {
      const int = new Interface(sourcifyMatch.metadata.output.abi);
      if (int.hasFunction(rawFourBytes)) {
        const func = int.getFunction(rawFourBytes);
        if (func) {
          sourcifyFourBytes = {
            name: func.name,
            signature: func.format("sighash"),
            fromVerifiedContract: true,
          };
        }
      }
    } catch (e: any) {}
  }

  const assetsURLPrefix = config?.assetsURLPrefix;
  const fourBytesKey = assetsURLPrefix !== undefined ? rawFourBytes : null;

  const fetcher = fourBytesFetcher(assetsURLPrefix!);
  const { data, error } = useSWRImmutable(["4bytes", fourBytesKey], fetcher);
  return sourcifyFourBytes ? sourcifyFourBytes : error ? undefined : data;
};

export const useMethodSelector = (
  data: string,
  to?: string,
): [boolean, string, string, boolean] => {
  const rawFourBytes = extract4Bytes(data);
  let fourBytesEntry = use4Bytes(rawFourBytes, to);
  const isSimpleTransfer = data === "0x";
  const methodName = isSimpleTransfer
    ? "transfer"
    : fourBytesEntry?.name ?? "shardeum_internal_tx";
  const methodTitle = isSimpleTransfer
    ? "SHM Transfer"
    : fourBytesEntry?.name ?? "shardeum_internal_tx";

  const fromVerifiedContract = fourBytesEntry
    ? fourBytesEntry.fromVerifiedContract
    : false;
  return [isSimpleTransfer, methodName, methodTitle, fromVerifiedContract];
};

export const useTransactionDescription = (
  fourBytesEntry: FourBytesEntry | null | undefined,
  data: string | undefined,
  value: BigNumberish | undefined,
): TransactionDescription | null | undefined => {
  const txDesc = useMemo(() => {
    if (!fourBytesEntry) {
      return fourBytesEntry;
    }
    if (
      !fourBytesEntry.signature ||
      data === undefined ||
      value === undefined
    ) {
      return undefined;
    }

    const sig = fourBytesEntry?.signature;
    const functionFragment = Fragment.from(`function ${sig}`);
    const intf = new Interface([functionFragment]);
    try {
      return intf.parseTransaction({ data, value });
    } catch {
      return undefined;
    }
  }, [fourBytesEntry, data, value]);

  return txDesc;
};
