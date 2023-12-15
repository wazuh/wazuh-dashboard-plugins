import React, { useEffect, useMemo, useState } from 'react';
import { getPlugins } from '../../../../kibana-services';
import useSearchBar from '../../../common/search-bar/use-search-bar';
import { IntlProvider } from 'react-intl';
import {
  EuiDataGrid,
  EuiPageTemplate,
  EuiToolTip,
  EuiButtonIcon,
  EuiDataGridCellValueElementProps,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiTitle,
  EuiButtonEmpty,
} from '@elastic/eui';
import { IndexPattern } from '../../../../../../../../src/plugins/data/common';
import { SearchResponse } from '../../../../../../../../src/core/server';
import DocViewer from '../../vulnerabilities/doc_viewer/doc_viewer';
import { DiscoverNoResults } from '../../vulnerabilities/common/components/no_results';
import { LoadingSpinner } from '../../vulnerabilities/common/components/loading_spinner';
import { useDataGrid } from '../../vulnerabilities/data_grid/use_data_grid';
import {
  MAX_ENTRIES_PER_QUERY,
  inventoryTableDefaultColumns,
} from '../../vulnerabilities/dashboards/inventory/config';
import { useDocViewer } from '../../vulnerabilities/doc_viewer/use_doc_viewer';
import './inventory.scss';
import {
  search,
  exportSearchToCSV,
} from '../../vulnerabilities/dashboards/inventory/inventory_service';
import {
  ErrorHandler,
  ErrorFactory,
  HttpError,
} from '../../../../react-services/error-management';
import { withErrorBoundary } from '../../../common/hocs';
import { HitsCounter } from '../../../../kibana-integrations/discover/application/components/hits_counter/hits_counter';
import { formatNumWithCommas } from '../../../../kibana-integrations/discover/application/helpers';
import { useAppConfig } from '../../../common/hooks';

const InventoryFimComponent = () => {
  const appConfig = useAppConfig();
  const FIM_INDEX_PATTERN_ID = appConfig.data['fim.pattern'];
  const { searchBarProps } = useSearchBar({
    defaultIndexPatternID: FIM_INDEX_PATTERN_ID,
  });
  const { isLoading, filters, query, indexPatterns } = searchBarProps;
  const SearchBar = getPlugins().data.ui.SearchBar;
  const [results, setResults] = useState<SearchResponse>({} as SearchResponse);
  const [inspectedHit, setInspectedHit] = useState<any>(undefined);
  const [indexPattern, setIndexPattern] = useState<IndexPattern | undefined>(
    undefined,
  );
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const onClickInspectDoc = useMemo(
    () => (index: number) => {
      const rowClicked = results.hits.hits[index];
      setInspectedHit(rowClicked);
    },
    [results],
  );

  const DocViewInspectButton = ({
    rowIndex,
  }: EuiDataGridCellValueElementProps) => {
    const inspectHintMsg = 'Inspect document details';
    return (
      <EuiToolTip content={inspectHintMsg}>
        <EuiButtonIcon
          onClick={() => onClickInspectDoc(rowIndex)}
          iconType='inspect'
          aria-label={inspectHintMsg}
        />
      </EuiToolTip>
    );
  };

  const dataGridProps = useDataGrid({
    ariaLabelledBy: 'Fim Inventory Table',
    defaultColumns: inventoryTableDefaultColumns,
    results,
    indexPattern: indexPattern as IndexPattern,
    DocViewInspectButton,
  });

  const { pagination, sorting, columnVisibility } = dataGridProps;

  const docViewerProps = useDocViewer({
    doc: inspectedHit,
    indexPattern: indexPattern as IndexPattern,
  });

  useEffect(() => {
    if (!isLoading) {
      setIndexPattern(indexPatterns?.[0] as IndexPattern);
      search({
        indexPattern: indexPatterns?.[0] as IndexPattern,
        filters,
        query,
        pagination,
        sorting,
      })
        .then(results => {
          setResults(results);
          setIsSearching(false);
        })
        .catch(error => {
          const searchError = ErrorFactory.create(HttpError, {
            error,
            message: 'Error fetching fim',
          });
          ErrorHandler.handleError(searchError);
          setIsSearching(false);
        });
    }
  }, [
    JSON.stringify(searchBarProps),
    JSON.stringify(pagination),
    JSON.stringify(sorting),
  ]);

  const timeField = indexPattern?.timeFieldName
    ? indexPattern.timeFieldName
    : undefined;

  const onClickExportResults = async () => {
    const params = {
      indexPattern: indexPatterns?.[0] as IndexPattern,
      filters,
      query,
      fields: columnVisibility.visibleColumns,
      pagination: {
        pageIndex: 0,
        pageSize: results.hits.total,
      },
      sorting,
    };
    try {
      setIsExporting(true);
      await exportSearchToCSV(params);
    } catch (error) {
      const searchError = ErrorFactory.create(HttpError, {
        error,
        message: 'Error downloading csv report',
      });
      ErrorHandler.handleError(searchError);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <IntlProvider locale='en'>
      <EuiPageTemplate
        className='fimInventoryContainer'
        restrictWidth='100%'
        fullHeight={true}
        grow
      >
        <>
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <SearchBar
              appName='inventory-fim'
              {...searchBarProps}
              showDatePicker={false}
              showQueryInput={true}
              showQueryBar={true}
            />
          )}
          {isSearching ? <LoadingSpinner /> : null}
          {!isLoading && !isSearching && results?.hits?.total === 0 ? (
            <DiscoverNoResults timeFieldName={timeField} queryLanguage={''} />
          ) : null}
          {!isLoading && !isSearching && results?.hits?.total > 0 ? (
            <EuiDataGrid
              {...dataGridProps}
              toolbarVisibility={{
                additionalControls: (
                  <>
                    <HitsCounter
                      hits={results?.hits?.total}
                      showResetButton={false}
                      onResetQuery={() => {}}
                      tooltip={
                        results?.hits?.total &&
                        results?.hits?.total > MAX_ENTRIES_PER_QUERY
                          ? {
                              ariaLabel: 'Warning',
                              content: `The query results has exceeded the limit of 10,000 hits. To provide a better experience the table only shows the first ${formatNumWithCommas(
                                MAX_ENTRIES_PER_QUERY,
                              )} hits.`,
                              iconType: 'alert',
                              position: 'top',
                            }
                          : undefined
                      }
                    />
                    <EuiButtonEmpty
                      disabled={results?.hits?.total === 0}
                      size='xs'
                      iconType='exportAction'
                      color='primary'
                      isLoading={isExporting}
                      className='euiDataGrid__controlBtn'
                      onClick={onClickExportResults}
                    >
                      Export Formated
                    </EuiButtonEmpty>
                  </>
                ),
              }}
            />
          ) : null}
          {inspectedHit && (
            <EuiFlyout onClose={() => setInspectedHit(undefined)} size='m'>
              <EuiFlyoutHeader>
                <EuiTitle>
                  <h2>Document Details</h2>
                </EuiTitle>
              </EuiFlyoutHeader>
              <EuiFlyoutBody>
                <EuiFlexGroup direction='column'>
                  <EuiFlexItem>
                    <DocViewer {...docViewerProps} />
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlyoutBody>
            </EuiFlyout>
          )}
        </>
      </EuiPageTemplate>
    </IntlProvider>
  );
};

export const InventoryFim = withErrorBoundary(InventoryFimComponent);
