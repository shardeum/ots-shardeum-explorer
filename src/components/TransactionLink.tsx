import {
  faExclamationCircle,
  faSplotch,
  faTurnDown,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC, memo } from "react";
import { NavLink } from "react-router-dom";
import { transactionURL } from "../url";

interface TransactionLinkProps {
  txHash: string;
  fail?: boolean;
  blob?: boolean;
  deposit?: boolean;
  className?: string;
  truncateLength?: number;
}

const TransactionLink: FC<TransactionLinkProps> = ({
  txHash,
  fail,
  blob,
  deposit,
  className,
  truncateLength,
}) => {
  if (!txHash) return null;

  const displayHash = truncateLength ? 
    `${txHash.slice(0, truncateLength)}...` : 
    txHash;

  return (
    <span className="flex-no-wrap flex space-x-1">
      {fail && (
        <span className="text-red-600" title="Transaction reverted">
          <FontAwesomeIcon icon={faExclamationCircle} />
        </span>
      )}
      {blob && (
        <span className="text-rose-400" title="Blob transaction">
          <FontAwesomeIcon icon={faSplotch} />
        </span>
      )}
      {deposit && (
        <span className="text-emerald-600" title="Deposit transaction">
          <FontAwesomeIcon icon={faTurnDown} />
        </span>
      )}
      <span className="truncate">
        <NavLink
          className={`font-mono text-link-blue hover:text-link-blue-hover ${className || ''}`}
          to={transactionURL(txHash)}
          title={txHash}
        >
          <span className="truncate" data-test="tx-hash">
            {displayHash}
          </span>
        </NavLink>
      </span>
    </span>
  );
};

export default memo(TransactionLink);
