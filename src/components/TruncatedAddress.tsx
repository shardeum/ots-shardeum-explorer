import { FC } from 'react';

interface TruncatedAddressProps {
  address: string;
  startLength?: number;
  className?: string;
}

const TruncatedAddress: FC<TruncatedAddressProps> = ({
  address,
  startLength = 36, // Default to 36 characters (including 0x)
  className = ''
}) => {
  if (!address) return null;
  
  // Ensure we keep the 0x prefix and the specified number of characters after it
  const truncated = `${address.slice(0, startLength)}...`;
  
  return (
    <span className={`font-mono ${className}`} title={address}>
      {truncated}
    </span>
  );
};

export default TruncatedAddress;
