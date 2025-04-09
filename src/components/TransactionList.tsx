import { FC, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import useSWR from 'swr';
import { RuntimeContext } from '../useRuntime';
import { ProcessedTransaction } from '../types';
import { rawToProcessed } from '../search/search';
import TransactionLink from './TransactionLink';
import TimestampAge from './TimestampAge';
import PlainAddress from '../execution/components/PlainAddress';
import NativeTokenAmount from './NativeTokenAmount';
import TransactionPageControl from '../pages/TransactionPageControl';
import LoadingState from './LoadingState';
import { PAGE_SIZE } from '../params';

interface TransactionListProps {
  mode: 'full';
  className?: string;
}

interface TransactionResponse {
  txs: ProcessedTransaction[];
  totalPages: number;
}

const TransactionList: FC<TransactionListProps> = ({ mode, className = '' }) => {
  const { provider } = useContext(RuntimeContext);
  const [searchParams] = useSearchParams();
  const currentPage = Number(searchParams.get('page')) || 1;

  const { data, isLoading, error } = useSWR<TransactionResponse>(
    provider ? [
      `ots_getTransactions_${currentPage}`,
      currentPage,
      PAGE_SIZE
    ] : null,
    async ([endpoint, page, pageSize]) => {
      try {
        const response = await provider!.send('ots_getTransactions', [null, currentPage, PAGE_SIZE]);
        const processed = await rawToProcessed(provider!, response);
        return processed;
      } catch (err) {
        console.error('Error fetching transactions:', err);
        throw err;
      }
    },
    {
      dedupingInterval: 2000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      suspense: false,
      revalidateOnMount: true
    }
  );

  if (error) {
    return (
      <div className="text-red-500 p-4">
        Error loading transactions: {error.message}
      </div>
    );
  }

  return (
    <LoadingState 
      isLoading={isLoading} 
      isEmpty={!data?.txs?.length}
      emptyMessage="No transactions found"
    >
      <div className={`w-full overflow-hidden rounded-xl border border-gray-200 shadow-sm ${className}`}>
        <div className="py-3 sm:py-4 px-4 sm:px-6 bg-white border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-base sm:text-lg font-semibold">
              All Transactions
            </h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Txn Hash
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Age
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  From
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  To
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.txs?.map((tx: ProcessedTransaction) => (
                <tr key={tx.hash} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <TransactionLink 
                      txHash={tx.hash}
                      className="text-blue-600 hover:text-blue-800"
                      truncateLength={26}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <TimestampAge timestamp={Number(tx.timestamp)} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <PlainAddress
                      address={tx.from || ''}
                      truncateLength={20}
                      linkable={true}
                      className="text-gray-900 hover:text-blue-600"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <PlainAddress
                      address={tx.to || ''}
                      truncateLength={20}
                      linkable={true}
                      className="text-gray-900 hover:text-blue-600"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <NativeTokenAmount value={tx.value} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {data && typeof data.totalPages === 'number' && data.totalPages > 0 && (
        <div className="mt-8">
          <TransactionPageControl
            currentPage={currentPage}
            totalPages={data.totalPages}
            disabled={isLoading}
          />
        </div>
      )}
    </LoadingState>
  );
};

export default TransactionList;
