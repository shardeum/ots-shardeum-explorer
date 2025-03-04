import { FC, useContext, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import ContentFrame from "../../components/ContentFrame";
import { balancePreset } from "../../components/FiatValue";
import InfoRow from "../../components/InfoRow";
import NativeTokenAmountAndFiat from "../../components/NativeTokenAmountAndFiat";
import StandardScrollableTable from "../../components/StandardScrollableTable";
import StandardTBody from "../../components/StandardTBody";
import TransactionLink from "../../components/TransactionLink";
import { useProxyAttributes } from "../../ots2/usePrototypeTransferHooks";
import ResultHeader from "../../search/ResultHeader";
import TransactionItem from "../../search/TransactionItem";
import UndefinedPageControl from "../../search/UndefinedPageControl";
import { SearchController } from "../../search/search";
import { useFeeToggler } from "../../search/useFeeToggler";
import StandardSelectionBoundary from "../../selection/StandardSelectionBoundary";
import { ProcessedTransaction } from "../../types";
import { BlockNumberContext } from "../../useBlockTagContext";
import { useAddressBalance, useContractCreator } from "../../useErigonHooks";
import { useResolvedAddress } from "../../useResolvedAddresses";
import { RuntimeContext } from "../../useRuntime";
import { usePageTitle } from "../../useTitle";
import DecoratedAddressLink from "../components/DecoratedAddressLink";
import TransactionAddressWithCopy from "../components/TransactionAddressWithCopy";
import { AddressAwareComponentProps } from "../types";
import PendingItem from "./PendingItem";
import PendingPage from "./PendingPage";

const ProxyInfo: FC<AddressAwareComponentProps> = ({ address }) => {
  const { provider } = useContext(RuntimeContext);
  const proxyAttributes = useProxyAttributes(provider, address);
  return (
    <>
      {proxyAttributes && proxyAttributes.proxyType && (
        <InfoRow title="Proxy type">{proxyAttributes.proxyType}</InfoRow>
      )}
      {proxyAttributes && proxyAttributes.logicAddress && (
        <InfoRow title="Logic contract">
          <DecoratedAddressLink address={proxyAttributes.logicAddress} />
        </InfoRow>
      )}
    </>
  );
};

const AddressTransactionResults: FC<AddressAwareComponentProps> = ({
  address,
}) => {
  const { config, provider } = useContext(RuntimeContext);
  const [feeDisplay, feeDisplayToggler] = useFeeToggler();

  const { addressOrName, direction } = useParams();
  if (addressOrName === undefined) {
    throw new Error("addressOrName couldn't be undefined here");
  }

  const [searchParams] = useSearchParams();
  const pageParam = searchParams.get("page");
  const currentPage = pageParam ? parseInt(pageParam) : 1;

  const [controller, setController] = useState<SearchController>();

  useEffect(() => {
    if (!provider || !address) {
      return;
    }

    const loadPage = async () => {
      const _controller = await SearchController.getPage(provider, address, currentPage);
      setController(_controller);
    };

    loadPage();
  }, [provider, address, currentPage]);

  const page = useMemo(() => controller?.getPage(), [controller]);

  const balance = useAddressBalance(provider, address);
  // const creator = useContractCreator(provider, address);
  const resolvedAddress = useResolvedAddress(provider, address);
  const resolvedName = resolvedAddress
    ? resolvedAddress[0].resolveToString(resolvedAddress[1])
    : undefined;
  const resolvedNameTrusted = resolvedAddress
    ? resolvedAddress[0].trusted(resolvedAddress[1])
    : undefined;

  usePageTitle(
    resolvedName && resolvedNameTrusted
      ? `${resolvedName} | Address ${addressOrName}`
      : `Address ${addressOrName}`,
  );

  return (
    <ContentFrame tabs>
      <StandardSelectionBoundary>
        <BlockNumberContext.Provider value="latest">
          <InfoRow title="Balance">
            {balance !== null && balance !== undefined ? (
              <NativeTokenAmountAndFiat value={balance} {...balancePreset} />
            ) : (
              <div className="w-80">
                <PendingItem />
              </div>
            )}
          </InfoRow>
          {/* {creator && (
            <InfoRow title="Contract creator">
              <div className="flex flex-col md:flex-row divide-x-2 divide-dotted divide-gray-300">
                <TransactionAddressWithCopy
                  address={creator.creator}
                  showCodeIndicator
                />
                <div className="md:ml-3 flex items-baseline pl-3 truncate">
                  <div className="truncate">
                    <TransactionLink txHash={creator.hash} />
                  </div>
                </div>
              </div>
            </InfoRow>
          )} */}
          {config && config.experimental && <ProxyInfo address={address} />}
        </BlockNumberContext.Provider>
        <NavBar address={address} page={page} controller={controller} />
        <StandardScrollableTable isAuto={true}>
          <ResultHeader
            feeDisplay={feeDisplay}
            feeDisplayToggler={feeDisplayToggler}
          />
          {page ? (
            <StandardTBody>
              {page.map((tx) => (
                <TransactionItem
                  key={tx.hash}
                  tx={tx}
                  selectedAddress={address}
                  feeDisplay={feeDisplay}
                />
              ))}
            </StandardTBody>
          ) : (
            <PendingPage rows={1} cols={8} />
          )}
        </StandardScrollableTable>
        <NavBar address={address} page={page} controller={controller} />
      </StandardSelectionBoundary>
    </ContentFrame>
  );
};

type NavBarProps = AddressAwareComponentProps & {
  page: ProcessedTransaction[] | undefined;
  controller: SearchController | undefined;
};

const NavBar: FC<NavBarProps> = ({ address, page, controller }) => (
  <div className="flex items-baseline justify-between py-3">
    <div className="text-sm text-gray-500">
      {page === undefined ? (
        <>Waiting for search results...</>
      ) : (
        <>
          <span data-test="page-count">{page.length}</span> transactions on this
          page
        </>
      )}
    </div>
    <UndefinedPageControl
      address={address}
      currentPage={controller?.getCurrentPage() ?? 1}
      totalPages={controller?.getTotalPages() ?? 1}
      disabled={controller === undefined}
    />
  </div>
);

export default AddressTransactionResults;
