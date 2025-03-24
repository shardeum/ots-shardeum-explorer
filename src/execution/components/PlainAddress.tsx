import { FC } from "react";
import { NavLink } from "react-router-dom";

interface PlainAddressProps {
  address: string;
  linkable?: boolean;
  dontOverrideColors?: boolean;
  className?: string;
}

const PlainAddress: FC<PlainAddressProps> = ({
  address,
  linkable,
  dontOverrideColors,
  className
}) => {
  if (linkable) {
    return (
      <NavLink
        className={`${
          dontOverrideColors ? "" : "text-link-blue hover:text-link-blue-hover"
        } truncate font-address ${className || ''}`}
        to={`/address/${address}`}
        title={address}
      >
        {address}
      </NavLink>
    );
  }

  return (
    <span className="truncate font-address text-gray-400" title={address}>
      {address}
    </span>
  );
};

export default PlainAddress;
