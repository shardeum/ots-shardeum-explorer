import { describe, expect, test } from "@jest/globals";
import { SearchController } from "./search.js";
import { ProcessedTransaction } from "../types.js";

describe("SearchController", () => {
  test("basic controller functionality", () => {
    const mockTxs: ProcessedTransaction[] = [
      {
        hash: "0x123",
        blockNumber: 1,
        timestamp: Math.floor(Date.now() / 1000),
        idx: 0,
        from: "0xabc",
        to: "0xdef",
        value: BigInt(100),
        type: 0,
        fee: BigInt(21000),
        gasPrice: BigInt(1000000000),
        data: "0x",
        status: 1,
      },
    ];

    const controller = new SearchController(
      "0xabc",
      mockTxs,
      true,
      true,
      1,
      0
    );

    expect(controller.getCurrentPage()).toBe(0);
    expect(controller.getTotalPages()).toBe(1);
    expect(controller.isFirst).toBe(true);
    expect(controller.isLast).toBe(true);
    expect(controller.getPage()).toEqual(mockTxs);
  });
});
