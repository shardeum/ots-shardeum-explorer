import { FC, PropsWithChildren } from "react";
import { useSearchParams } from "react-router-dom";

type TransactionPageButtonProps = {
  direction: "first" | "last" | "prev" | "next";
  currentPage?: number;
  totalPages?: number;
  disabled?: boolean;
};

const TransactionPageButton: FC<PropsWithChildren<TransactionPageButtonProps>> = ({
  direction,
  currentPage = 1,
  totalPages = 1,
  disabled,
  children,
}) => {
  const [, setSearchParams] = useSearchParams();

  if (disabled) {
    return (
      <span className="select-none rounded-lg bg-link-blue/10 px-3 py-2 text-xs text-gray-400">
        {children}
      </span>
    );
  }

  const getPageNumber = () => {
    switch (direction) {
      case "first": return 1;
      case "prev": return currentPage - 1;
      case "next": return currentPage + 1;
      case "last": return totalPages;
      default: return currentPage;
    }
  };

  const handleClick = () => {
    const newPage = getPageNumber();
    setSearchParams({ page: newPage.toString() });
  };

  return (
    <button
      onClick={handleClick}
      className="select-none rounded-lg bg-link-blue/10 px-3 py-2 text-xs text-link-blue transition-colors hover:bg-link-blue/100 hover:text-white disabled:cursor-default disabled:bg-link-blue disabled:text-gray-400"
      data-test={`nav-${direction}`}
    >
      {children}
    </button>
  );
};

export default TransactionPageButton;
