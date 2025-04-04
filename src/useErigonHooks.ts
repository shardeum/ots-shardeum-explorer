import {
  AbiCoder,
  BlockParams,
  BlockTag,
  Contract,
  JsonRpcApiProvider,
  Log,
  TransactionReceiptParams,
  TransactionResponseParams,
  ZeroAddress,
  dataSlice,
  getAddress,
  getBytes,
  isHexString,
  toNumber,
} from "ethers";
import { useEffect, useMemo, useState } from "react";
import useSWR, { Fetcher } from "swr";
import useSWRImmutable from "swr/immutable";
import erc20 from "./abi/erc20.json";
import L1Block from "./abi/optimism/L1Block.json";
import {
  getOpFeeData,
  isOptimisticChain,
} from "./execution/op-tx-calculation";
import {
  ChecksummedAddress,
  InternalOperation,
  OperationType,
  ProcessedTransaction,
  TokenMeta,
  TokenTransfer,
  TransactionData,
} from "./types";
import { formatter } from "./utils/formatter";

const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

export interface ExtendedBlock extends BlockParams {
  blockReward: bigint;
  unclesReward: bigint;
  feeReward: bigint;
  size: number;
  sha3Uncles: string;
  stateRoot: string;
  totalDifficulty: bigint;
  transactionCount: number;
  // Optimism-specific
  gasUsedDepositTx?: bigint;
}

export const readBlock = async (
  provider: JsonRpcApiProvider,
  blockNumberOrHash: string,
): Promise<ExtendedBlock | null> => {
  let blockPromise: Promise<any>;
  if (isHexString(blockNumberOrHash, 32)) {
    blockPromise = provider.send("ots_getBlockDetailsByHash", [
      blockNumberOrHash,
    ]);
  } else {
    const blockNumber = parseInt(blockNumberOrHash);
    if (isNaN(blockNumber) || blockNumber < 0) {
      return null;
    }
    blockPromise = provider.send("ots_getBlockDetails", [blockNumber]);
  }

  const response = await blockPromise;
  if (response === null || response.block === null) {
    return null;
  }

  // Format the raw block data
  const rawBlock = response.block;
  const rawIssuance = response.issuance ?? {};
  
  // First format the basic block parameters
  const blockParams = {
    hash: rawBlock.hash,
    parentHash: rawBlock.parentHash,
    number: formatter.number(rawBlock.number),
    timestamp: formatter.number(rawBlock.timestamp),
    nonce: rawBlock.nonce,
    difficulty: formatter.bigInt(rawBlock.difficulty),
    gasLimit: formatter.bigInt(rawBlock.gasLimit),
    gasUsed: formatter.bigInt(rawBlock.gasUsed),
    miner: formatter.address(rawBlock.miner),
    extraData: rawBlock.extraData,
    baseFeePerGas: null, // Add if present in your chain
    transactions: rawBlock.transactions?.map((tx: any) => tx.txHash) ?? [],
  };

  // Then create the extended block with additional fields
  const extBlock: ExtendedBlock = {
    ...blockParams,
    blockReward: formatter.bigInt(rawIssuance.blockReward ?? 0),
    unclesReward: formatter.bigInt(rawIssuance.uncleReward ?? 0),
    feeReward: formatter.bigInt(response.totalFees ?? 0),
    size: formatter.number(rawBlock.size),
    sha3Uncles: rawBlock.sha3Uncles,
    stateRoot: rawBlock.stateRoot,
    totalDifficulty: formatter.bigInt(rawBlock.totalDifficulty),
    transactionCount: formatter.number(rawBlock.transactionCount),
    gasUsedDepositTx: formatter.bigInt(response.gasUsedDepositTx ?? 0n),
  };

  return extBlock;
};

export type BlockTransactionsPage = {
  total: number;
  txs: ProcessedTransaction[];
};

const blockTransactionsFetcher: Fetcher<
  BlockTransactionsPage,
  [JsonRpcApiProvider, number, number, number]
> = async ([provider, blockNumber, pageNumber, pageSize]) => {
  try {
    const txs = await provider.send("ots_getBlockTransaction", [
      blockNumber,
      pageNumber,
      pageSize,
    ]);

    if (!Array.isArray(txs)) {
      return { total: 0, txs: [] };
    }

    // Transform the response into the expected format
    const formattedTxs = txs.map(tx => {
      const receipt = tx.wrappedEVMAccount?.readableReceipt;
      if (!receipt) {
        return null;
      }

      // Helper to convert hex or decimal string to BigInt
      const toBigInt = (value: string | null | undefined, defaultValue = "0") => {
        if (!value || value === "0x") return BigInt(defaultValue);
        return BigInt(value.startsWith("0x") ? value : `0x${value}`);
      };

      // Helper to convert hex to number
      const toNumber = (value: string | null | undefined, defaultValue = 0) => {
        if (!value || value === "0x") return defaultValue;
        return parseInt(value.startsWith("0x") ? value : `0x${value}`, 16);
      };

      const gasUsed = toBigInt(receipt.gasUsed);
      const gasPrice = toBigInt(receipt.gasPrice);

      return {
        blockNumber: blockNumber,
        timestamp: Math.floor(tx.timestamp / 1000), // Convert from ms to seconds
        miner: undefined, // Will be set from block data
        idx: toNumber(receipt.transactionIndex),
        hash: tx.txHash,
        from: tx.txFrom,
        to: tx.txTo,
        createdContractAddress: receipt.contractAddress || undefined,
        value: toBigInt(receipt.value),
        type: toNumber(receipt.type),
        fee: gasUsed * gasPrice,
        gasPrice: gasPrice,
        data: receipt.data || "0x",
        status: receipt.status ?? 0,
      };
    }).filter(tx => tx !== null) as ProcessedTransaction[];

    return {
      total: formattedTxs.length,
      txs: formattedTxs
    };
  } catch (error) {
    throw error;
  }
};

export const useBlockTransactions = (
  provider: JsonRpcApiProvider | undefined,
  blockNumber: number | undefined,
  pageNumber: number,
  pageSize: number,
): { data: BlockTransactionsPage | undefined; isLoading: boolean } => {
  const { data, isLoading } = useSWRImmutable(
    provider !== undefined && blockNumber !== undefined
      ? [provider, blockNumber, pageNumber, pageSize]
      : null,
    blockTransactionsFetcher,
    { keepPreviousData: true },
  );

  return { data, isLoading };
};

const blockDataFetcher: Fetcher<
  ExtendedBlock | null,
  [JsonRpcApiProvider, string]
> = async ([provider, blockNumberOrHash]) => {
  return readBlock(provider, blockNumberOrHash);
};

// TODO: some callers may use only block headers?
export const useBlockData = (
  provider: JsonRpcApiProvider | undefined,
  blockNumberOrHash: string | undefined,
): { data: ExtendedBlock | null | undefined; isLoading: boolean } => {
  const { data, error, isLoading } = useSWRImmutable(
    provider !== undefined && blockNumberOrHash !== undefined
      ? [provider, blockNumberOrHash]
      : null,
    blockDataFetcher,
    { keepPreviousData: true },
  );
  if (error) {
    return { data: undefined, isLoading: false };
  }
  return { data, isLoading };
};

export const useBlockDataFromTransaction = (
  provider: JsonRpcApiProvider | undefined,
  txData: TransactionData | null | undefined,
): ExtendedBlock | null | undefined => {
  const { data: block } = useBlockData(
    provider,
    txData?.confirmedData
      ? txData.confirmedData.blockNumber.toString()
      : undefined,
  );
  return block;
};

export const useTxData = (
  provider: JsonRpcApiProvider | undefined,
  txhash: string,
): TransactionData | undefined | null => {
  const [txData, setTxData] = useState<TransactionData | undefined | null>();

  useEffect(() => {
    if (!provider) {
      return;
    }

    const readTxData = async () => {
      try {
        // Make all requests in parallel immediately
        const [rawTx] = await Promise.all([
          provider.send("eth_getTransactionByHash", [txhash]),
        ]);

        if (!rawTx) {
          setTxData(null);
          return;
        }

        // Helper to ensure addresses have 0x prefix
        const normalizeAddress = (addr: string | null | undefined) => {
          if (!addr) return undefined;
          return addr.startsWith('0x') ? addr : `0x${addr}`;
        };

        // Get receipt separately after normalizing the from address
        const receipt = await provider.send(
          "eth_getTransactionReceipt",
          [txhash],
        );

        let fee: bigint;
        let gasPrice: bigint;

        // Handle Optimism-specific values
        let l1GasUsed: bigint | undefined;
        let l1GasPrice: bigint | undefined;
        let l1FeeScalar: string | undefined;
        let l1Fee: bigint | undefined;
        if (isOptimisticChain(provider._network.chainId)) {
          if (rawTx.type === '0x7e') {
            fee = 0n;
            gasPrice = 0n;
          } else {
            const _rawReceipt = await provider.send(
              "eth_getTransactionReceipt",
              [txhash],
            );
            l1GasUsed = formatter.bigInt(_rawReceipt.l1GasUsed);
            l1GasPrice = formatter.bigInt(_rawReceipt.l1GasPrice);
            l1FeeScalar = _rawReceipt.l1FeeScalar;
            l1Fee = formatter.bigInt(_rawReceipt.l1Fee);
            ({ fee, gasPrice } = getOpFeeData(
              parseInt(rawTx.type || '0x0'),
              BigInt(rawTx.gasPrice || '0x0'),
              receipt ? BigInt(receipt.gasUsed || '0x0') : 0n,
              l1Fee,
            ));
          }
        } else {
          fee = BigInt(rawTx.gasPrice || '0x0') * BigInt(receipt?.gasUsed || '0x0');
          gasPrice = BigInt(rawTx.gasPrice || '0x0');
        }

        // Format receipt data
        const confirmedData = receipt ? {
          status: receipt.status === '0x1',
          blockNumber: parseInt(receipt.blockNumber),
          transactionIndex: parseInt(receipt.transactionIndex),
          confirmations: 1, // TODO: Calculate proper confirmations
          createdContractAddress: normalizeAddress(receipt.contractAddress),
          fee,
          gasUsed: BigInt(receipt.gasUsed || '0x0'),
          logs: receipt.logs || [],
          blobGasPrice: receipt.blobGasPrice ? BigInt(receipt.blobGasPrice) : undefined,
          blobGasUsed: receipt.blobGasUsed ? BigInt(receipt.blobGasUsed) : undefined,
          l1GasUsed,
          l1GasPrice,
          l1FeeScalar,
          l1Fee,
        } : undefined;

        const txDataToSet = {
          transactionHash: rawTx.hash,
          from: normalizeAddress(rawTx.from)!,
          to: normalizeAddress(rawTx.to),
          value: BigInt(rawTx.value || '0x0'),
          type: parseInt(rawTx.type || '0x0'),
          maxFeePerGas: rawTx.maxFeePerGas ? BigInt(rawTx.maxFeePerGas) : undefined,
          maxPriorityFeePerGas: rawTx.maxPriorityFeePerGas ? BigInt(rawTx.maxPriorityFeePerGas) : undefined,
          gasPrice,
          gasLimit: BigInt(rawTx.gas || '0x0'),
          nonce: BigInt(rawTx.nonce || '0x0'),
          data: rawTx.input || rawTx.data || '0x',
          maxFeePerBlobGas: rawTx.maxFeePerBlobGas ? BigInt(rawTx.maxFeePerBlobGas) : undefined,
          blobVersionedHashes: rawTx.blobVersionedHashes ?? undefined,
          timestamp: rawTx.timestamp ? Math.floor(Number(rawTx.timestamp)) / 1000 : undefined,
          confirmedData,
        };
        setTxData(txDataToSet);
      } catch (err) {
        console.error(err);
        setTxData(null);
      }
    };

    readTxData();
  }, [provider, txhash]);

  return txData;
};

export const findTokenTransfersInLogs = (
  logs: readonly Log[],
): TokenTransfer[] => {
  return logs
    .filter((l) => l.topics.length === 3 && l.topics[0] === TRANSFER_TOPIC)
    .map((l) => ({
      token: l.address,
      from: getAddress(dataSlice(getBytes(l.topics[1]), 12)),
      to: getAddress(dataSlice(getBytes(l.topics[2]), 12)),
      value: BigInt(l.data),
    }));
};

export const useTokenTransfers = (
  txData?: TransactionData | null,
): TokenTransfer[] | undefined => {
  const transfers = useMemo(() => {
    if (txData === undefined || txData === null) {
      return undefined;
    }
    if (!txData.confirmedData) {
      return undefined;
    }

    return findTokenTransfersInLogs(txData.confirmedData.logs);
  }, [txData]);

  return transfers;
};

export const useInternalOperations = (
  provider: JsonRpcApiProvider | undefined,
  txHash: string | undefined,
): InternalOperation[] | undefined => {
  const { data, error } = useSWRImmutable(
    provider !== undefined && txHash !== undefined
      ? ["ots_getInternalOperations", txHash]
      : null,
    providerFetcher(provider),
  );

  const _transfers = useMemo(() => {
    if (provider === undefined || error || data === undefined || !Array.isArray(data)) {
      return undefined;
    }

    const _t: InternalOperation[] = [];
    for (const t of data) {
      _t.push({
        type: t.type,
        from: formatter.address(getAddress(t.from)),
        to: formatter.address(getAddress(t.to)),
        value: formatter.bigInt(t.value),
      });
    }
    return _t;
  }, [provider, data]);
  return _transfers;
};

export const useSendsToMiner = (
  provider: JsonRpcApiProvider | undefined,
  txHash: string | undefined,
  miner: string | undefined,
): [boolean, InternalOperation[]] | [undefined, undefined] => {
  const ops = useInternalOperations(provider, txHash);
  if (ops === undefined) {
    return [undefined, undefined];
  }

  const send =
    ops.findIndex(
      (op) =>
        op.type === OperationType.TRANSFER &&
        miner !== undefined &&
        miner === getAddress(op.to),
    ) !== -1;
  return [send, ops];
};

export type StateDiffElement = {
  type: string;
  from: string | null;
  to: string | null;

  // "+": new
  // "*": modified
  // "-": removed
  storageChange: string;
};

export type StateDiffGroup = {
  title: string;
  diffs: (StateDiffElement | StateDiffGroup)[];
};

export const useStateDiffTrace = (
  provider: JsonRpcApiProvider | undefined,
  txHash: string,
): StateDiffGroup[] | undefined => {
  const [traceGroups, setTraceGroups] = useState<
    StateDiffGroup[] | undefined
  >();

  useEffect(() => {
    if (!provider) {
      setTraceGroups(undefined);
      return;
    }

    const stateDiffTrace = async () => {
      const results = await provider.send("trace_replayTransaction", [
        txHash,
        ["stateDiff"],
      ]);
      const entries: StateDiffGroup[] = [];
      let address: string;
      let highLevelChange: any;

      // Iterate over each address with a state change
      for ([address, highLevelChange] of Object.entries(results.stateDiff)) {
        const sdGroup: StateDiffGroup = {
          title: address,
          diffs: [],
        };
        let changeType: string;
        let changes: any;

        function addChangeType(
          changeType: string,
          changes: any,
        ): StateDiffGroup | StateDiffElement | null {
          if (changes === "=") {
            // No change
            return null;
          }

          if (changeType === "storage") {
            // Create a "storage" subgroup and a subgroup for each storage slot
            let group: StateDiffGroup = {
              title: "storage",
              diffs: [],
            };
            for (const [storageSlot, storageChange] of Object.entries(
              changes,
            )) {
              let storageGroup: StateDiffGroup = {
                title: storageSlot,
                diffs: [],
              };
              let change = addChangeType("storageChange", storageChange);
              if (change !== null) {
                storageGroup.diffs.push(change);
              }
              group.diffs.push(storageGroup);
            }
            return group;
          }

          let storageChanges = Object.keys(changes);
          if (storageChanges.length !== 1) {
            throw new Error("More than one storage change type found");
          }
          // storageChange is "*", "+", or "-"
          let storageChange = storageChanges[0];

          if (storageChange === "+") {
            // Just the new value is stored
            return {
              type: changeType,
              from: null,
              to: changes[storageChange],
              storageChange,
            };
          } else if (storageChange === "-") {
            return {
              type: changeType,
              from: changes[storageChange],
              to: null,
              storageChange,
            };
          }

          return {
            type: changeType,
            from: changes[storageChange].from,
            to: changes[storageChange].to,
            storageChange,
          };
        }

        // Add each of the state changes from this acddress
        for ([changeType, changes] of Object.entries(highLevelChange)) {
          let change = addChangeType(changeType, changes);
          if (change !== null) {
            sdGroup.diffs.push(change);
          }
        }
        entries.push(sdGroup);
      }
      setTraceGroups(entries);
    };
    stateDiffTrace();
  }, [provider, txHash]);
  return traceGroups;
};

export type TraceEntry = {
  type: string;
  depth: number;
  from: string;
  to: string;
  value: bigint;
  input: string;
  output?: string;
};

export type TraceGroup = TraceEntry & {
  children: TraceGroup[] | null;
};

export const useTraceTransaction = (
  provider: JsonRpcApiProvider | undefined,
  txHash: string,
): TraceGroup[] | undefined => {
  const [traceGroups, setTraceGroups] = useState<TraceGroup[] | undefined>();

  useEffect(() => {
    if (!provider) {
      setTraceGroups(undefined);
      return;
    }

    const traceTx = async () => {
      const results = await provider.send("ots_traceTransaction", [txHash]);

      // Implement better formatter
      for (let i = 0; i < results.length; i++) {
        results[i].from = formatter.address(results[i].from);
        results[i].to = formatter.address(results[i].to);
        results[i].value =
          results[i].value === null ? null : formatter.bigInt(results[i].value);
      }

      // Build trace tree
      const buildTraceTree = (
        flatList: TraceEntry[],
        depth: number = 0,
      ): TraceGroup[] => {
        const entries: TraceGroup[] = [];

        let children: TraceEntry[] | null = null;
        for (let i = 0; i < flatList.length; i++) {
          if (flatList[i].depth === depth) {
            if (children !== null) {
              const childrenTree = buildTraceTree(children, depth + 1);
              const prev = entries.pop();
              if (prev) {
                prev.children = childrenTree;
                entries.push(prev);
              }
            }

            entries.push({
              ...flatList[i],
              children: null,
            });
            children = null;
          } else {
            if (children === null) {
              children = [];
            }
            children.push(flatList[i]);
          }
        }
        if (children !== null) {
          const childrenTree = buildTraceTree(children, depth + 1);
          const prev = entries.pop();
          if (prev) {
            prev.children = childrenTree;
            entries.push(prev);
          }
        }

        return entries;
      };

      const traceTree = buildTraceTree(results);
      setTraceGroups(traceTree);
    };
    traceTx();
  }, [provider, txHash]);

  return traceGroups;
};

// Error(string)
const ERROR_MESSAGE_SELECTOR = "0x08c379a0";

export const useTransactionError = (
  provider: JsonRpcApiProvider | undefined,
  txHash: string,
): [string | undefined, string | undefined, boolean | undefined] => {
  const [errorMsg, setErrorMsg] = useState<string | undefined>();
  const [data, setData] = useState<string | undefined>();
  const [isCustomError, setCustomError] = useState<boolean | undefined>();

  useEffect(() => {
    // Reset
    setErrorMsg(undefined);
    setData(undefined);
    setCustomError(undefined);

    if (provider === undefined) {
      return;
    }

    const readCodes = async () => {
      const result = (await provider.send("ots_getTransactionError", [
        txHash,
      ])) as string;

      // Empty or success
      if (result === "0x") {
        setErrorMsg(undefined);
        setData(result);
        setCustomError(false);
        return;
      }

      // Filter hardcoded Error(string) selector because ethers don't let us
      // construct it
      const selector = result.substr(0, 10);
      if (selector === ERROR_MESSAGE_SELECTOR) {
        const msg = AbiCoder.defaultAbiCoder().decode(
          ["string"],
          "0x" + result.substr(10),
        );
        setErrorMsg(msg[0]);
        setData(result);
        setCustomError(false);
        return;
      }

      setErrorMsg(undefined);
      setData(result);
      setCustomError(true);
    };
    readCodes();
  }, [provider, txHash]);

  return [errorMsg, data, isCustomError];
};

export const useTransactionCount = (
  provider: JsonRpcApiProvider | undefined,
  sender: ChecksummedAddress | undefined,
): bigint | undefined => {
  const { data, error } = useSWR(
    provider && sender ? { provider, sender } : null,
    async ({ provider, sender }): Promise<bigint | undefined> =>
      provider.getTransactionCount(sender).then(BigInt),
  );

  if (error) {
    return undefined;
  }
  return data;
};

type TransactionBySenderAndNonceKey = {
  network: bigint;
  sender: ChecksummedAddress;
  nonce: bigint;
};

const getTransactionBySenderAndNonceFetcher =
  (provider: JsonRpcApiProvider) =>
  async ({
    network,
    sender,
    nonce,
  }: TransactionBySenderAndNonceKey): Promise<string | null | undefined> => {
    if (nonce < 0) {
      return undefined;
    }

    const result = (await provider.send("ots_getTransactionBySenderAndNonce", [
      sender,
      toNumber(nonce),
    ])) as string;

    // Empty or success
    return result;
  };

export const useTransactionBySenderAndNonce = (
  provider: JsonRpcApiProvider | undefined,
  sender: ChecksummedAddress | undefined,
  nonce: bigint | undefined,
): string | null | undefined => {
  const { data, error } = useSWR<
    string | null | undefined,
    any,
    TransactionBySenderAndNonceKey | null
  >(
    provider && sender && nonce !== undefined
      ? {
          network: provider._network.chainId,
          sender,
          nonce,
        }
      : null,
    getTransactionBySenderAndNonceFetcher(provider!),
  );

  if (error) {
    return undefined;
  }
  return data;
};

type ContractCreatorKey = {
  type: "cc";
  network: bigint;
  address: ChecksummedAddress;
};

type ContractCreator = {
  hash: string;
  creator: ChecksummedAddress;
};

export const useContractCreator = (
  provider: JsonRpcApiProvider | undefined,
  address: ChecksummedAddress | undefined,
): ContractCreator | null | undefined => {
  // Return null to disable the feature entirely
  return null;
};

export const useAddressBalance = (
  provider: JsonRpcApiProvider | undefined,
  address: ChecksummedAddress | undefined,
): bigint | null | undefined => {
  const [balance, setBalance] = useState<bigint | undefined>();

  useEffect(() => {
    if (!provider || !address) {
      return undefined;
    }

    const readBalance = async () => {
      const _balance = await provider.getBalance(address);
      setBalance(_balance);
    };
    readBalance();
  }, [provider, address]);

  return balance;
};

/**
 * This is a generic fetch for SWR, where the key is an array, whose
 * element 0 is the JSON-RPC method, and the remaining are the method
 * arguments.
 */
export const providerFetcher =
  (
    provider: JsonRpcApiProvider | undefined,
  ): Fetcher<any | undefined, [string, ...any]> =>
  async (key) => {
    if (provider === undefined) {
      return undefined;
    }
    for (const a of key) {
      if (a === undefined) {
        return undefined;
      }
    }

    const method = key[0];
    const args = key.slice(1);
    const result = await provider.send(method, args);
    return result;
  };

export const useHasCode = (
  provider: JsonRpcApiProvider | undefined,
  address: ChecksummedAddress | undefined,
  blockTag: BlockTag = "latest",
): boolean | undefined => {
  const fetcher = providerFetcher(provider);
  const { data, error } = useSWRImmutable(
    ["ots_hasCode", address, blockTag],
    fetcher,
  );
  if (error) {
    return undefined;
  }
  return data as boolean | undefined;
};

export const useGetCode = (
  provider: JsonRpcApiProvider | undefined,
  address: ChecksummedAddress | undefined,
  blockTag: BlockTag = "latest",
): string | undefined => {
  const fetcher = providerFetcher(provider);
  const { data, error } = useSWRImmutable(
    ["eth_getCode", address, blockTag],
    fetcher,
  );
  if (error) {
    return undefined;
  }
  return data as string | undefined;
};

const ERC20_PROTOTYPE = new Contract(ZeroAddress, erc20);

const tokenMetadataFetcher =
  (
    provider: JsonRpcApiProvider | undefined,
  ): Fetcher<TokenMeta | null, ["tokenmeta", ChecksummedAddress]> =>
  async ([_, address]) => {
    if (provider === undefined) {
      return null;
    }

    // TODO: workaround for https://github.com/ethers-io/ethers.js/issues/4183
    const erc20Contract: Contract = ERC20_PROTOTYPE.connect(provider).attach(
      address,
    ) as Contract;
    try {
      const name = (await erc20Contract.name()) as string;
      if (!name.trim()) {
        return null;
      }

      const [symbol, decimals] = (await Promise.all([
        erc20Contract.symbol(),
        erc20Contract.decimals(),
      ])) as [string, number];

      // Prevent faulty tokens with empty name/symbol
      if (!symbol.trim()) {
        return null;
      }

      return {
        name,
        symbol,
        decimals: Number(decimals),
      };
    } catch (err) {
      // Ignore on purpose; this indicates the probe failed and the address
      // is not a token
      return null;
    }
  };

export const useTokenMetadata = (
  provider: JsonRpcApiProvider | undefined,
  address: ChecksummedAddress | undefined,
): TokenMeta | null | undefined => {
  const fetcher = tokenMetadataFetcher(provider);
  const { data, error } = useSWRImmutable(
    provider !== undefined && address !== undefined
      ? ["tokenmeta", address]
      : null,
    fetcher,
  );
  if (error) {
    return undefined;
  }
  return data;
};

const l1BlockContractAddress = "0x4200000000000000000000000000000000000015";
const L1BLOCK_PROTOTYPE = new Contract(l1BlockContractAddress, L1Block);
const l1EpochFetcher =
  (
    provider: JsonRpcApiProvider | undefined,
  ): Fetcher<bigint | null, ["l1epoch", BlockTag]> =>
  async ([_, blockTag]) => {
    if (provider === undefined) {
      return null;
    }

    // TODO: workaround for https://github.com/ethers-io/ethers.js/issues/4183
    const l1BlockContract: Contract = L1BLOCK_PROTOTYPE.connect(
      provider,
    ).attach(l1BlockContractAddress) as Contract;
    try {
      return l1BlockContract.number({ blockTag });
    } catch (err) {
      return null;
    }
  };

export const useL1Epoch = (
  provider: JsonRpcApiProvider | undefined,
  blockTag: BlockTag | null,
): bigint | null | undefined => {
  const fetcher = l1EpochFetcher(provider);
  const key =
    provider !== undefined && isOptimisticChain(provider._network.chainId)
      ? ["l1epoch", blockTag]
      : null;
  const { data, error } = useSWRImmutable(key, fetcher);
  return error ? undefined : data;
};
