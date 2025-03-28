import React, { useContext } from "react";
import { RuntimeContext } from "./useRuntime";

const Footer: React.FC = () => {
  const { provider, config } = useContext(RuntimeContext);

  return (
    <footer
      className={`w-full border-t border-t-gray-100 px-2 py-3 text-xs ${
        provider?._network.chainId === 1n
          ? "bg-link-blue text-gray-200"
          : "bg-primary text-white"
      } text-center mt-auto`}
    >
      {provider ? (
        <>Shardeum  {config?.erigonURL}</>
      ) : (
        <>Waiting for the provider...</>
      )}
    </footer>
  );
};

export default React.memo(Footer);