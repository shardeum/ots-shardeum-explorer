import React from "react";
import { useMethodSelector } from "../use4Bytes";
import { SHARDEUM_INTERNAL_TX_TYPE_LEGEND } from "../utils/shardeumUtils";

type MethodNameProps = {
  status?: number; // 0 for failed, 1 for success
  data: string;
  to?: string;
};

const MethodName: React.FC<MethodNameProps> = ({ status, data, to = undefined }) => {
  const [isSimpleTransfer, methodName, methodTitle, fromVerifiedContract] =
    useMethodSelector(data, to);

  // Check if the method name matches one of the known internal types
  const isShardeumInternal = Object.values(
    SHARDEUM_INTERNAL_TX_TYPE_LEGEND,
  ).includes(methodName);

  // Determine background based on status first, then type
  let bgColorClass;
  if (status === 0) {
    // Failed transaction
    bgColorClass =
      "bg-red-100 text-red-500 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700";
  } else if (isShardeumInternal) {
    // Successful Shardeum internal transaction
    bgColorClass =
      "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700";
  } else if (isSimpleTransfer) {
    // Successful simple transfer
    bgColorClass =
      "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700";
  } else {
    // Successful contract interaction (not Shardeum internal)
    bgColorClass =
      "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700";
  }

  return (
    <div
      className={`flex min-h-full max-w-max items-baseline rounded-lg px-3 py-1 text-xs ${bgColorClass}`}
      title={status === 0 ? `Failed: ${methodTitle}` : methodTitle} // Add 'Failed:' prefix to title if failed
    >
      <p
        className={`truncate ${
          fromVerifiedContract ? "text-verified-contract" : ""
        }`}
      >
        {methodName}
      </p>
    </div>
  );
};

export default React.memo(MethodName);
