import { toUtf8String } from "ethers"; // Correct import for ethers v6

/**
 * Legend for Shardeum internal transaction types based on input data decoding.
 */
export const SHARDEUM_INTERNAL_TX_TYPE_LEGEND: { [key: number]: string } = {
  0: "Set Global Code Bytes",
  1: "Init Network",
  2: "Node Reward",
  3: "Change Config",
  4: "Apply Change Config",
  5: "Set Cert Time",
  6: "Stake",
  7: "Unstake",
  8: "Init Reward Times",
  9: "Claim Reward",
  10: "Change Network Param",
  11: "Apply Network Param",
  12: "Penalty",
  13: "Transfer From Secure Account",
};

export interface DecodedShardeumInput {
  type: number;
  details: any; // The full parsed JSON object
  typeName: string; // Human-readable type name from legend
}

/**
 * Attempts to decode hexadecimal transaction input data assuming it's
 * UTF-8 encoded JSON containing Shardeum internal transaction details.
 *
 * @param hexData The transaction input data (e.g., txData.data)
 * @returns A DecodedShardeumInput object if successful, otherwise null.
 */
export const decodeShardeumInputData = (
  hexData: string,
): DecodedShardeumInput | null => {
  if (!hexData || hexData === "0x" || hexData.length < 10) {
    return null;
  }

  try {
    // Convert hex to UTF-8 string
    const utf8String = toUtf8String(hexData);

    // Parse the string as JSON
    const parsedJson = JSON.parse(utf8String);

    // Check for the internalTXType field
    if (
      typeof parsedJson === "object" &&
      parsedJson !== null &&
      typeof parsedJson.internalTXType === "number"
    ) {
      const internalType = parsedJson.internalTXType;
      const typeName = SHARDEUM_INTERNAL_TX_TYPE_LEGEND[internalType] ?? `Unknown Internal (${internalType})`;

      return {
        type: internalType,
        details: parsedJson,
        typeName: typeName,
      };
    }
  } catch (error) {
    // Ignore errors (e.g., not valid UTF-8, not valid JSON, field missing)
    // console.debug("Failed to decode Shardeum input data:", error);
  }

  return null;
};
