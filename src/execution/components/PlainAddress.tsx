import { FC } from "react";
import { NavLink } from "react-router-dom";

interface PlainAddressProps {
  address: string;
  linkable?: boolean;
  dontOverrideColors?: boolean;
  className?: string;
  truncateLength?: number;
}

const PlainAddress: FC<PlainAddressProps> = ({
  address,
  linkable,
  dontOverrideColors,
  className,
  truncateLength
}) => {
  if (!address) return null;

  const displayAddress = truncateLength ? 
    `${address.slice(0, truncateLength)}...` : 
    address;

  const baseClasses = `${dontOverrideColors ? "" : "text-link-blue hover:text-link-blue-hover"} font-mono ${className || ''}`;

  if (linkable) {
    return (
      <NavLink
        className={baseClasses}
        to={`/address/${address}`}
        title={address}
        data-test="address-link"
      >
        {displayAddress}
      </NavLink>
    );
  }

  return (
    <span className={`font-mono ${dontOverrideColors ? "text-gray-400" : ""} ${className || ''}`} title={address}>
      {displayAddress}
    </span>
  );
};

export default PlainAddress;
