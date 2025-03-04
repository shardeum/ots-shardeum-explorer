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

  // Add required fields to match ethers.js TransactionResponse format
  const enrichedTxs = _rawRes.txs.map((tx: any) => {
    const gasLimit = tx.gas || tx.gasLimit || "0x5208";
    return {
      ...tx,
      type: tx.type ?? 0,
      chainId: provider._network.chainId,
      nonce: tx.nonce ?? 0,
      data: tx.input ?? "0x",
      gasLimit,
      maxFeePerGas: tx.maxFeePerGas ?? null,
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas ?? null,
      r: tx.r ?? "0x0000000000000000000000000000000000000000000000000000000000000000",
      s: tx.s ?? "0x0000000000000000000000000000000000000000000000000000000000000000",
      v: tx.v ?? 27,
      transactionIndex: tx.transactionIndex ?? "0x0",
      blockNumber: tx.blockNumber,
      timestamp: tx.timestamp,
      idx: tx.transactionIndex || 0,
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value,
      gasPrice: tx.gasPrice,
    };
  });

  const _res: TransactionResponse[] = enrichedTxs.map(
    (tx: any) => new TransactionResponse(formatter.transactionResponse(tx), provider)
  );

  return {
    txs: _res.map((t, i): ProcessedTransaction => {
      const _rawReceipt = _rawRes.receipts[i] || {};
      const enrichedReceipt = {
        to: _rawReceipt.to || t.to,
        from: _rawReceipt.from || t.from,
        contractAddress: _rawReceipt.contractAddress,
        transactionIndex: _rawReceipt.transactionIndex || t.index,
        gasUsed: _rawReceipt.gasUsed || t.gasLimit,
        logsBloom: _rawReceipt.logsBloom || "0x",
        blockHash: _rawReceipt.blockHash || "0x0000000000000000000000000000000000000000000000000000000000000000",
        transactionHash: t.hash,
        logs: _rawReceipt.logs || [],
        blockNumber: _rawReceipt.blockNumber || t.blockNumber,
        confirmations: _rawReceipt.confirmations || 0,
        cumulativeGasUsed: _rawReceipt.cumulativeGasUsed || _rawReceipt.gasUsed || t.gasLimit,
        effectiveGasPrice: _rawReceipt.effectiveGasPrice || t.gasPrice,
        status: _rawReceipt.status ?? 1,
        type: t.type,
        byzantium: true
      };

      const _receipt = formatter.transactionReceiptParams(enrichedReceipt);

      let fee: bigint;
      let gasPrice: bigint;
      
      if (isOptimisticChain(provider._network.chainId)) {
        const l1Fee: bigint = formatter.bigInt(_rawReceipt.l1Fee ?? 0n);
        ({ fee, gasPrice } = getOpFeeData(
          t.type,
          t.gasPrice!,
          _receipt.gasUsed,
          l1Fee
        ));
      } else {
        fee = _receipt.gasUsed * t.gasPrice!;
        gasPrice = t.gasPrice!;
      }

      return {
        blockNumber: t.blockNumber!,
        timestamp: Math.floor((enrichedTxs[i].timestamp ?? _rawReceipt.timestamp ?? 0) / 1000),
        idx: _receipt.index,
        hash: t.hash,
        type: t.type,
        from: t.from,
        to: t.to ?? null,
        createdContractAddress: _receipt.contractAddress ?? undefined,
        value: t.value,
        fee,
        gasPrice,
        data: t.data,
        status: _receipt.status!
      };
    }),
    firstPage: _rawRes.firstPage,
    lastPage: _rawRes.lastPage
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
