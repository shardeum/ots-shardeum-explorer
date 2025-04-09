import { faQrcode, faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC, lazy, memo, useContext, useState, useEffect } from "react";
import { NavLink, useSearchParams } from "react-router-dom";
import Logo from "./Logo";
import ContentFrame from "./components/ContentFrame";
import LoadingState from "./components/LoadingState";
import { useGenericSearch } from "./search/search";
import { RuntimeContext } from "./useRuntime";
import { usePageTitle } from "./useTitle";
import TransactionList from "./components/TransactionList";

interface CameraScannerProps {
  onClose: () => void;
  onScan: (result: string) => void;
}

const CameraScanner = lazy(() => import("./search/CameraScanner"));

const Home: FC = () => {
  const { provider, config } = useContext(RuntimeContext);
  const [searchRef, handleChange, handleSubmit] = useGenericSearch();
  const [isScanning, setScanning] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();



  useEffect(() => {
    setIsLoaded(true);
  }, []);

  usePageTitle("Home");

  return (
    <div className="flex-grow flex flex-col" style={{
      background: 'linear-gradient(to bottom, rgba(255, 248, 204, 1) 0%, rgba(236, 253, 236, 1) 50%, rgba(220, 255, 236, 1) 100%)'
    }}>
      <main className="flex-1 container mx-auto px-4 pt-2 pb-10 md:px-6 lg:px-8">
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
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-gray-100 rounded-lg"
                    type="button"
                    onClick={() => setScanning(true)}
                    title="Scan an address using your camera"
                  >
                    <FontAwesomeIcon icon={faQrcode} className="text-gray-400" />
                  </button>
                </div>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 h-10 sm:h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm sm:text-base transition-colors"
                >
                  Search
                </button>
              </div>
            </form>
          </div>

          {/* Transactions List */}
          <div className="max-w-6xl mx-auto mb-8">

            <TransactionList mode="full" />
          </div>
        </div>
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