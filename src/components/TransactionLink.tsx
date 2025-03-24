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
}

const TransactionLink: FC<TransactionLinkProps> = ({
  txHash,
  fail,
  blob,
  deposit,
  className,
}) => (
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
        className={`font-hash text-link-blue hover:text-link-blue-hover ${className}`}
        to={transactionURL(txHash)}
      >
        <p className="truncate" data-test="tx-hash">
          {txHash}
        </p>
      </NavLink>
    </span>
  </span>
);

export default memo(TransactionLink);
