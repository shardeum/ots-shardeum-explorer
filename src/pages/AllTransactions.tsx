import { FC, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import useSWR from 'swr';
import { RuntimeContext } from '../useRuntime';
import { ProcessedTransaction } from '../types';
import { rawToProcessed } from '../search/search';
import TransactionLink from '../components/TransactionLink';
import TimestampAge from '../components/TimestampAge';
import PlainAddress from '../execution/components/PlainAddress';
import NativeTokenAmount from '../components/NativeTokenAmount';
import TransactionPageControl from './TransactionPageControl';
import { usePageTitle } from '../useTitle';
import { PAGE_SIZE } from '../params';

const AllTransactions: FC = () => {
  const { provider } = useContext(RuntimeContext);
  const [searchParams] = useSearchParams();
  const currentPage = Number(searchParams.get('page')) || 1;

  usePageTitle('Transactions');

  const { data, isLoading, error } = useSWR(
    provider ? [`ots_getTransactions_${currentPage}`, null, currentPage, PAGE_SIZE] : null,
    async () => {
      try {
        const response = await provider!.send('ots_getTransactions', [
          null,
          currentPage,
          PAGE_SIZE
        ]);

        console.log('Raw response:', response); // Debug log
        
        const processed = await rawToProcessed(provider!, response);
        
        console.log('Processed transactions:', processed); // Debug log
        
        return processed;
      } catch (err) {
        console.error('Error processing transactions:', err);
        throw err;
      }
    }
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="space-y-4">
            {[...Array(PAGE_SIZE)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-red-500">
          Error loading transactions: {error.message}
        </div>
      </div>
    );
  }

  if (!data?.txs || data.txs.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Transactions</h1>
        <div className="text-gray-500">No transactions found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Transactions</h1>
      
      <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm bg-white">
        <div className="overflow-x-auto">
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
              {data.txs.map((tx: ProcessedTransaction) => (
                <tr key={tx.hash} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 sm:py-4 px-2 sm:px-4">
                    <div className="w-16 sm:w-24 md:w-36 truncate">
                      <TransactionLink 
                        txHash={tx.hash} 
                        className="text-blue-600 hover:text-blue-700 transition-colors font-medium text-xs sm:text-sm"
                      />
                    </div>
                  </td>
                  <td className="py-3 sm:py-4 px-2 sm:px-4 text-xs sm:text-sm">
                    <TimestampAge timestamp={tx.timestamp} />
                  </td>
                  <td className="py-3 sm:py-4 px-2 sm:px-4">
                    <div className="w-16 sm:w-24 md:w-36 truncate">
                      {tx.from && <PlainAddress address={tx.from} />}
                    </div>
                  </td>
                  <td className="py-3 sm:py-4 px-2 sm:px-4">
                    <div className="w-16 sm:w-24 md:w-36 truncate">
                      {tx.to && <PlainAddress address={tx.to} />}
                    </div>
                  </td>
                  <td className="py-3 sm:py-4 px-2 sm:px-4 text-right text-xs sm:text-sm">
                    <NativeTokenAmount value={tx.value} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8">
        <TransactionPageControl 
          currentPage={currentPage}
          totalPages={data.totalPages} 
          disabled={isLoading}
        />
      </div>
    </div>
  );
};

export default AllTransactions;