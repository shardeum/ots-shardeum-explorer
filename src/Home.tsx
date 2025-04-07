import { faQrcode, faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC, lazy, memo, useContext, useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import Logo from "./Logo";
import ContentFrame from "./components/ContentFrame";
import StandardScrollableTable from "./components/StandardScrollableTable";
import StandardTBody from "./components/StandardTBody";
import StandardTHead from "./components/StandardTHead";
import { useGenericSearch } from "./search/search";
import { blockURL, slotURL } from "./url";
import { useFinalizedSlotNumber, useSlotTimestamp } from "./useConsensus";
import { useLatestBlockHeader } from "./useLatestBlock";
import { RuntimeContext } from "./useRuntime";
import { usePageTitle } from "./useTitle";
import { commify } from "./utils/utils";
import Timestamp from "./components/Timestamp";
import BlockLink from "./components/BlockLink";
import TransactionLink from "./components/TransactionLink";
import TransactionAddress from "./execution/components/TransactionAddress";
import NativeTokenAmount from "./components/NativeTokenAmount";
import TimestampAge from "./components/TimestampAge";
import StandardSelectionBoundary from "./selection/StandardSelectionBoundary";
import PlainAddress from "./execution/components/PlainAddress";
import useSWR from "swr";
import { ProcessedTransaction } from "./types";
import { rawToProcessed } from "./search/search";
import LoadingState from "./components/LoadingState";
const CameraScanner = lazy(() => import("./search/CameraScanner"));

interface LatestTransactionsTableProps {
  transactions: ProcessedTransaction[];
}

const LatestTransactionsTable: FC<LatestTransactionsTableProps> = ({ transactions }) => {
  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr className="text-left text-xs sm:text-sm text-gray-500">
            <th className="py-2 sm:py-3 px-2 sm:px-4 font-medium">Txn Hash</th>
            <th className="py-2 sm:py-3 px-2 sm:px-4 font-medium">Age</th>
            <th className="py-2 sm:py-3 px-2 sm:px-4 font-medium">From</th>
            <th className="py-2 sm:py-3 px-2 sm:px-4 font-medium">To</th>
            <th className="py-2 sm:py-3 px-2 sm:px-4 font-medium text-right">Value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {transactions
            .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
            .map((tx: ProcessedTransaction) => (
              <tr key={tx.hash} className="hover:bg-gray-50 transition-colors">
                <td className="py-3 sm:py-4 px-2 sm:px-4">
                  <div className="w-16 sm:w-24 md:w-36 truncate">
                    <TransactionLink 
                      txHash={tx.hash} 
                      className="text-blue-600 hover:text-blue-700 transition-colors font-medium text-xs sm:text-sm"
                    />
                  </div>
                </td>
                <td className="py-3 sm:py-4 px-2 sm:px-4 text-gray-500 whitespace-nowrap text-xs sm:text-sm">
                  <TimestampAge timestamp={Number(tx.timestamp)} />
                </td>
                <td className="py-3 sm:py-4 px-2 sm:px-4">
                  <div className="w-16 sm:w-24 md:w-36 truncate">
                    <PlainAddress 
                      address={tx.from || ''} 
                      linkable={true} 
                      dontOverrideColors={false}
                      className="text-blue-600 hover:text-blue-700 transition-colors font-medium text-xs sm:text-sm"
                    />
                  </div>
                </td>
                <td className="py-3 sm:py-4 px-2 sm:px-4">
                  <div className="w-16 sm:w-24 md:w-36 truncate">
                    <PlainAddress 
                      address={tx.to || ''} 
                      linkable={true} 
                      dontOverrideColors={false}
                      className="text-blue-600 hover:text-blue-700 transition-colors font-medium text-xs sm:text-sm"
                    />
                  </div>
                </td>
                <td className="py-3 sm:py-4 px-2 sm:px-4 text-right font-medium whitespace-nowrap text-xs sm:text-sm">
                  <NativeTokenAmount value={BigInt(tx.value)} />
                </td>
              </tr>
            ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={5} className="py-4 px-4 text-center bg-gray-50">
              <NavLink
                to="/txs"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-link-blue hover:text-white bg-link-blue/10 hover:bg-link-blue rounded-lg transition-colors duration-200"
              >
                View All Transactions
              </NavLink>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

const Home: FC = () => {
  const { provider, config } = useContext(RuntimeContext);
  const [searchRef, handleChange, handleSubmit] = useGenericSearch();
  const [isScanning, setScanning] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const { data, isLoading, error } = useSWR(
    provider ? ["ots_getLatestTransactions", 20] : null,
    async () => {
      const result = await provider!.send("ots_getLatestTransactions", [20]);
      return rawToProcessed(provider!, result);
    },
    {
      refreshInterval: 5000,
      dedupingInterval: 2000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      suspense: false,
      revalidateOnMount: true
    }
  );

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  usePageTitle("Home");

  return (
    <div className="flex-grow flex flex-col" style={{
      background: 'linear-gradient(to bottom, rgba(255, 248, 204, 1) 0%, rgba(236, 253, 236, 1) 50%, rgba(220, 255, 236, 1) 100%)'
    }}>
      
      <main className="flex-1 container mx-auto px-4 pt-2 pb-10 md:px-6 lg:px-8">
        <LoadingState 
          isLoading={isLoading || !data} 
          isEmpty={!data?.txs?.length}
          emptyMessage="No transactions found"
        >
          <div className={`transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
            {/* Search Section */}
            <div className="w-full max-w-2xl mx-auto mt-8 sm:mt-12 mb-10 sm:mb-16">
              <form
                className="relative"
                onSubmit={handleSubmit}
                autoComplete="off"
                spellCheck={false}
              >
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <div className="relative flex-1 rounded-xl overflow-hidden shadow transition-all duration-300 ease-in-out w-full">
                    <input
                      className="w-full py-3 px-4 sm:px-6 pr-10 sm:pr-12 border-none outline-none text-foreground/80 bg-white text-sm sm:text-base placeholder:text-muted-foreground/60 transition-all h-10 sm:h-12"
                      type="text"
                      placeholder="Search by address / txn hash / block"
                      onChange={handleChange}
                      ref={searchRef}
                    />
                    <button 
                      type="submit"
                      className="absolute right-0 top-0 h-full px-3 sm:px-4 flex items-center justify-center text-gray-400 hover:text-blue-500 transition-colors"
                    >
                      <FontAwesomeIcon icon={faSearch} size="sm" />
                    </button>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setScanning(true)}
                    className="h-10 sm:h-12 px-4 flex items-center justify-center bg-white hover:bg-blue-50 border border-gray-200 rounded-xl shadow-sm transition-all duration-300 hover:shadow group w-full sm:w-auto mt-2 sm:mt-0"
                  >
                    <FontAwesomeIcon icon={faQrcode} className="mr-2 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    <span className="text-sm font-medium group-hover:text-blue-500 transition-colors">Scan</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Transactions Table */}
            <div className="max-w-6xl mx-auto mb-8">
              <div className="w-full overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                <div className="py-3 sm:py-4 px-4 sm:px-6 bg-white border-b border-gray-200">
                  <h2 className="text-base sm:text-lg font-semibold">Latest Transactions</h2>
                </div>
                <div className="bg-white">
                  <LatestTransactionsTable transactions={data?.txs || []} />
                </div>
              </div>
            </div>
          </div>
        </LoadingState>
      </main>

      {isScanning && (
        <CameraScanner
          onClose={() => setScanning(false)}
          onScan={(result: string) => {
            if (searchRef.current) {
              searchRef.current.value = result;
            }
            setScanning(false);
          }}
        />
      )}
    </div>
  );
};

export default memo(Home);