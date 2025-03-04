import React from "react";
import UndefinedPageButton from "./UndefinedPageButton";

type UndefinedPageControlProps = {
  isFirst?: boolean;
  isLast?: boolean;
  address: string;
  currentPage: number;
  totalPages: number;
  disabled?: boolean;
};

const UndefinedPageControl: React.FC<UndefinedPageControlProps> = ({
  address,
  currentPage = 1,
  totalPages = 1,
  disabled,
}) => {
  const isFirst = currentPage === 1;
  const isLast = currentPage === totalPages;

  return (
    <div className="flex items-baseline space-x-1 text-xs">
      <UndefinedPageButton
        address={address}
        direction="first"
        currentPage={currentPage}
        totalPages={totalPages}
        disabled={disabled || isFirst}
      >
        First
      </UndefinedPageButton>
      <UndefinedPageButton
        address={address}
        direction="prev"
        currentPage={currentPage}
        totalPages={totalPages}
        disabled={disabled || isFirst}
      >
        {"<"}
      </UndefinedPageButton>
      <span className="px-3 py-2">
        Page {currentPage} of {totalPages}
      </span>
      <UndefinedPageButton
        address={address}
        direction="next"
        currentPage={currentPage}
        totalPages={totalPages}
        disabled={disabled || isLast}
      >
        {">"}
      </UndefinedPageButton>
      <UndefinedPageButton
        address={address}
        direction="last"
        currentPage={currentPage}
        totalPages={totalPages}
        disabled={disabled || isLast}
      >
        Last
      </UndefinedPageButton>
    </div>
  );
};

export default React.memo(UndefinedPageControl);
