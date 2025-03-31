import React from "react";

type ShardeumTransactionTypeProps = {
  type: number;
};

const ShardeumTransactionType: React.FC<ShardeumTransactionTypeProps> = ({ type }) => {
  const getTransactionType = (type: number) => {
    switch (type) {
      case 0:
        return "transfer";
      case 1:
        return "stake";
      case 2:
        return "unstake";
      case 3:
        return "node reward";
      default:
        return `unknown (${type})`;
    }
  };

  const getBackgroundColor = (type: number) => {
    switch (type) {
      case 0:
        return "bg-amber-100"; // transfer - same as original
      case 1:
        return "bg-blue-100"; // stake
      case 2:
        return "bg-purple-100"; // unstake
      case 3:
        return "bg-green-100"; // node reward
      default:
        return "bg-gray-100";
    }
  };

  return (
    <div
      className={`${getBackgroundColor(
        type
      )} flex min-h-full max-w-max items-baseline rounded-lg px-3 py-1 text-xs`}
    >
      <p className="truncate">{getTransactionType(type)}</p>
    </div>
  );
};

export default React.memo(ShardeumTransactionType);
