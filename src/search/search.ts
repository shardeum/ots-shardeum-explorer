import {
  JsonRpcApiProvider,
  TransactionReceiptParams,
  TransactionResponse,
  isAddress,
  isHexString,
} from "ethers";
import {
  ChangeEventHandler,
  FormEventHandler,
  RefObject,
  useRef,
  useState,
} from "react";
import { NavigateFunction, useNavigate } from "react-router";
import useKeyboardShortcut from "use-keyboard-shortcut";
import {
  getOpFeeData,
  isOptimisticChain,
} from "../execution/op-tx-calculation";
import { PAGE_SIZE } from "../params";
import { ProcessedTransaction, TransactionChunk } from "../types";
import { formatter } from "../utils/formatter";

export const rawToProcessed = (provider: JsonRpcApiProvider, _rawRes: any) => {
  console.log("[rawToProcessed] Raw response:", _rawRes);

  if (!_rawRes?.txs || !Array.isArray(_rawRes.txs)) {
    console.error("[rawToProcessed] Invalid response format:", _rawRes);
    return {
      txs: [],
      firstPage: true,
      lastPage: true,
      totalPages: 0,
      totalTransactions: 0
    };
  }

  // Filter out test transactions before processing
  const filteredTxs = _rawRes.txs.filter((tx: any) => {
    const isTestTransaction = 
      tx.from === "1000000000000000000000000000000000000000000000000000000000000001" &&
      tx.to === "1000000000000000000000000000000000000000000000000000000000000001";
    return !isTestTransaction;
  });

  // Filter corresponding receipts
  const filteredReceipts = (_rawRes.receipts || []).filter((_: any, i: number) => {
    const tx = _rawRes.txs[i];
    const isTestTransaction = 
      tx.from === "1000000000000000000000000000000000000000000000000000000000000001" &&
      tx.to === "1000000000000000000000000000000000000000000000000000000000000001";
    return !isTestTransaction;
  });

  const processedTxs: ProcessedTransaction[] = [];

  for (let i = 0; i < filteredTxs.length; i++) {
    const tx = filteredTxs[i];
    const receipt = filteredReceipts[i] || {};
    const timestamp = tx.timestamp ? Number(tx.timestamp) : Date.now();
    
    try {
      processedTxs.push({
        blockNumber: Number(tx.blockNumber),
        timestamp: Math.floor(timestamp / 1000), // Convert to seconds
        idx: typeof tx.transactionIndex === 'string' ? parseInt(tx.transactionIndex, 16) : (tx.transactionIndex || 0),
        hash: tx.hash,
        type: Number(tx.type || 0),
        from: tx.from,
        to: tx.to,
        createdContractAddress: receipt.contractAddress,
        value: BigInt(tx.value || '0'),
        fee: BigInt(tx.gasPrice || '0') * BigInt(tx.gas || '0x5208'),
        gasPrice: BigInt(tx.gasPrice || '0'),
        data: tx.input || '0x',
        status: receipt.status ?? 1
      });
    } catch (err) {
      console.error("[rawToProcessed] Error processing transaction:", err, tx);
      // Skip invalid transactions instead of returning null
      continue;
    }
  }

  return {
    txs: processedTxs,
    firstPage: _rawRes.firstPage,
    lastPage: _rawRes.lastPage,
    totalPages: _rawRes.totalPages,
    totalTransactions: _rawRes.totalTransactions
  };
};

export class SearchController {
  private currentPage: number;
  private totalPages: number;

  constructor(
    private address: string,
    private txs: ProcessedTransaction[],
    private isFirstPage: boolean,
    private isLastPage: boolean,
    totalPages: number,
    currentPage: number
  ) {
    this.totalPages = totalPages;
    this.currentPage = currentPage;
  }

  getCurrentPage(): number {
    return this.currentPage;
  }

  getTotalPages(): number {
    return this.totalPages;
  }

  get isFirst(): boolean {
    return this.isFirstPage;
  }

  get isLast(): boolean {
    return this.isLastPage;
  }

  getPage(): ProcessedTransaction[] {
    return this.txs;
  }

  static async getPage(
    provider: JsonRpcApiProvider,
    address: string, 
    pageNumber: number
  ): Promise<SearchController> {
    const response = await provider.send("ots_getTransactions", [
      address,
      pageNumber,
      10
    ]);

    const processed = rawToProcessed(provider, response);
    
    return new SearchController(
      address,
      processed.txs,
      pageNumber === 1,
      processed.lastPage,
      response.totalPages || 1,
      pageNumber
    );
  }
}

const doSearch = async (q: string, navigate: NavigateFunction) => {
  // Cleanup
  q = q.trim();

  let maybeAddress = q;
  let maybeIndex = "";
  const sepIndex = q.lastIndexOf(":");
  if (sepIndex !== -1) {
    maybeAddress = q.substring(0, sepIndex);
    maybeIndex = q.substring(sepIndex + 1);
  }

  // Plain address?
  if (isAddress(maybeAddress)) {
    navigate(
      `/address/${maybeAddress}${
        maybeIndex !== "" ? `?nonce=${maybeIndex}` : ""
      }`,
    );
    return;
  }

  // Tx hash?
  if (isHexString(q, 32)) {
    navigate(`/tx/${q}`);
    return;
  }

  // Block number?
  const blockNumber = parseInt(q);
  if (!isNaN(blockNumber)) {
    navigate(`/block/${blockNumber}`);
    return;
  }

  // Epoch?
  if (q.startsWith("epoch:")) {
    const mayBeEpoch = q.substring(6);
    const epoch = parseInt(mayBeEpoch);
    if (!isNaN(epoch)) {
      navigate(`/epoch/${epoch}`);
      return;
    }
  }

  // Slot?
  if (q.startsWith("slot:")) {
    const mayBeSlot = q.substring(5);
    const slot = parseInt(mayBeSlot);
    if (!isNaN(slot)) {
      navigate(`/slot/${slot}`);
      return;
    }
  }

  // Validator?
  if (q.startsWith("validator:")) {
    const mayBeValidator = q.substring(10);

    // Validator by index
    if (mayBeValidator.match(/^\d+$/)) {
      const validatorIndex = parseInt(mayBeValidator);
      navigate(`/validator/${validatorIndex}`);
      return;
    }

    // Validator by public key
    if (mayBeValidator.length === 98 && isHexString(mayBeValidator, 48)) {
      navigate(`/validator/${mayBeValidator}`);
      return;
    }
  }

  // Assume it is an ENS name
  navigate(
    `/address/${maybeAddress}${
      maybeIndex !== "" ? `?nonce=${maybeIndex}` : ""
    }`,
  );
};

export const useGenericSearch = (): [
  RefObject<HTMLInputElement>,
  ChangeEventHandler<HTMLInputElement>,
  FormEventHandler<HTMLFormElement>,
] => {
  const [searchString, setSearchString] = useState<string>("");
  const [canSubmit, setCanSubmit] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const searchTerm = e.target.value.trim();
    setCanSubmit(searchTerm.length > 0);
    setSearchString(searchTerm);
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (!canSubmit) {
      return;
    }

    if (searchRef.current) {
      searchRef.current.value = "";
    }
    doSearch(searchString, navigate);
  };

  const searchRef = useRef<HTMLInputElement>(null);
  useKeyboardShortcut(
    ["/"],
    () => {
      searchRef.current?.focus();
    },
    {
      overrideSystem: true,
    },
  );

  return [searchRef, handleChange, handleSubmit];
};
