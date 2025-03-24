import React from "react";
import TransactionPageButton from "./TransactionPageButton";

type TransactionPageControlProps = {
  currentPage: number;
  totalPages: number;
  disabled?: boolean;
};

const TransactionPageControl: React.FC<TransactionPageControlProps> = ({
  currentPage = 1,
  totalPages = 1,
  disabled,
}) => {
  const isFirst = currentPage === 1;
  const isLast = currentPage === totalPages;

  return (
    <div className="flex items-baseline space-x-1 text-xs">
      <TransactionPageButton
        direction="first"
        currentPage={currentPage}
        totalPages={totalPages}
        disabled={disabled || isFirst}
      >
        First
      </TransactionPageButton>
      <TransactionPageButton
        direction="prev"
        currentPage={currentPage}
        totalPages={totalPages}
        disabled={disabled || isFirst}
      >
        {"<"}
      </TransactionPageButton>
      <span className="px-3 py-2">
        Page {currentPage} of {totalPages}
      </span>
      <TransactionPageButton
        direction="next"
        currentPage={currentPage}
        totalPages={totalPages}
        disabled={disabled || isLast}
      >
        {">"}
      </TransactionPageButton>
      <TransactionPageButton
        direction="last"
        currentPage={currentPage}
        totalPages={totalPages}
        disabled={disabled || isLast}
      >
        Last
      </TransactionPageButton>
    </div>
  );
};

export default React.memo(TransactionPageControl);
