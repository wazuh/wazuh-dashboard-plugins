import React, { useEffect, useMemo, useState } from 'react';
import { IntlProvider } from 'react-intl';
import {
  EuiDataGrid,
  EuiPageTemplate,
  EuiToolTip,
  EuiButtonIcon,
  EuiDataGridCellValueElementProps,
  EuiFlexGroup,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiTitle,
  EuiButtonEmpty,
  EuiPanel,
} from '@elastic/eui';
import { SearchResponse } from '../../../../../../src/core/server';
import { HitsCounter } from '../../../kibana-integrations/discover/application/components/hits_counter';
import { formatNumWithCommas } from '../../../kibana-integrations/discover/application/helpers';
formatNumWithCommas;
import { getWazuhCorePlugin } from '../../../kibana-services';
import {
  ErrorHandler,
  ErrorFactory,
  HttpError,
} from '../../../react-services/error-management';

import './table.scss';

import {
  exportSearchToCSV,
  getAllCustomRenders,
  MAX_ENTRIES_PER_QUERY,
  tDataGridColumn,
  useDataGrid,
} from '../data-grid';

import { LoadingSearchbarProgress } from '../loading-searchbar-progress/loading-searchbar-progress';
// common components/hooks
import { IndexPattern } from '../../../../../../../src/plugins/data/public';
import { wzDiscoverRenderColumns } from './render-columns';
import { DocumentViewTableAndJson } from './components/document-view-table-and-json';
import { WzSearchBar } from '../search-bar';
import { DataGridVisibleColumnsSelector } from './components/visible-columns-selector';
import {
  CreateNewSearchContext,
  useDataSourceWithSearchBar,
} from '../hooks/use-data-source-search-context';
import {
  IDataSourceFactoryConstructor,
  PatternDataSource,
  tDataSourceRepository,
  tParsedIndexPattern,
} from '../data-source';
import { DiscoverNoResults } from '../no-results/no-results';

export interface WzTableDiscoverProps {
  DataSource: IDataSourceFactoryConstructor<PatternDataSource>;
  DataSourceRepositoryCreator: tDataSourceRepository<tParsedIndexPattern>;
  tableDefaultColumns: tDataGridColumn[];
  createNewSearchContext?: CreateNewSearchContext;
  useAbsoluteDateRange?: boolean;
  displayOnlyNoResultsCalloutOnNoResults?: boolean;
  title?: React.ReactNode;
  inspectDetailsTitle?: string;
}

/**
 * React component that renders a search bar and a grid table using a data
 * source, data source repository creator and table default columns
 * @param param0
 * @returns
 */
export const WzTableDiscover = ({
  DataSource,
  DataSourceRepositoryCreator,
  tableDefaultColumns,
  createNewSearchContext = false,
  useAbsoluteDateRange = false,
  displayOnlyNoResultsCalloutOnNoResults = false,
  title,
  inspectDetailsTitle = 'Details',
}: WzTableDiscoverProps) => {
  const {
    dataSource,
    filters,
    fetchFilters,
    fixedFilters,
    isLoading: isDataSourceLoading,
    fetchData,
    setFilters,
    searchBarProps,
    fingerprint,
  } = useDataSourceWithSearchBar({
    DataSource,
    DataSourceRepositoryCreator,
    createNewSearchContext,
    useAbsoluteDateRange,
  });
  const { query } = searchBarProps;

  const [results, setResults] = useState<SearchResponse>({} as SearchResponse);
  const [inspectedHit, setInspectedHit] = useState<any>(undefined);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const sideNavDocked = getWazuhCorePlugin().hooks.useDockedSideNav();

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
    const inspectHintMsg = 'Inspect details';
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
    ariaLabelledBy: 'Table',
    defaultColumns: tableDefaultColumns,
    renderColumns: wzDiscoverRenderColumns,
    results,
    indexPattern: dataSource?.indexPattern as IndexPattern,
    DocViewInspectButton,
    filters,
    setFilters,
  });

  const { pagination, sorting, columnVisibility } = dataGridProps;

  const onClickExportResults = async () => {
    const params = {
      indexPattern: dataSource?.indexPattern as IndexPattern,
      filters: fetchFilters,
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

  useEffect(() => {
    if (isDataSourceLoading) {
      return;
    }
    fetchData({ pagination, sorting })
      .then(results => {
        setResults(results);
      })
      .catch(error => {
        const searchError = ErrorFactory.create(HttpError, {
          error,
          message: 'Error fetching data',
        });
        ErrorHandler.handleError(searchError);
      });
  }, [
    JSON.stringify(fetchFilters),
    JSON.stringify(query),
    JSON.stringify(pagination),
    JSON.stringify(sorting),
    fingerprint,
    isDataSourceLoading,
  ]);

  const closeFlyoutHandler = () => setInspectedHit(undefined);

  const shouldDisplayNoResults =
    displayOnlyNoResultsCalloutOnNoResults &&
    !isDataSourceLoading &&
    results?.hits?.total === 0;

  const shouldDisplayTable = !shouldDisplayNoResults;

  return (
    <IntlProvider locale='en'>
      <>
        <EuiPageTemplate
          className='wz-table-discover-container'
          restrictWidth='100%'
          fullHeight={true}
          grow
          paddingSize='none'
          pageContentProps={{ color: 'transparent' }}
        >
          <>
            {isDataSourceLoading ? (
              <LoadingSearchbarProgress />
            ) : (
              <>
                {title && (
                  <EuiTitle data-test-subj='wz-discovertitle' size='s'>
                    <h1>{title}</h1>
                  </EuiTitle>
                )}
                <WzSearchBar
                  appName='wzTable'
                  {...searchBarProps}
                  filters={filters}
                  fixedFilters={fixedFilters}
                  showDatePicker={false}
                  showQueryInput={true}
                  showQueryBar={true}
                  showSaveQuery={true}
                />
              </>
            )}
            {shouldDisplayNoResults && <DiscoverNoResults />}
            {!isDataSourceLoading && shouldDisplayTable ? (
              <EuiPanel
                paddingSize='s'
                hasShadow={false}
                hasBorder={false}
                color='transparent'
              >
                <div>
                  <EuiDataGrid
                    {...dataGridProps}
                    className={sideNavDocked ? 'dataGridDockedNav' : ''}
                    toolbarVisibility={{
                      showColumnSelector: { allowHide: false },
                      additionalControls: (
                        <>
                          <HitsCounter
                            hits={results?.hits?.total}
                            showResetButton={false}
                            tooltip={
                              results?.hits?.total &&
                              results?.hits?.total > MAX_ENTRIES_PER_QUERY
                                ? {
                                    ariaLabel: 'Info',
                                    content: `The query results has exceeded the limit of ${formatNumWithCommas(
                                      MAX_ENTRIES_PER_QUERY,
                                    )} hits. To provide a better experience the table only shows the first ${formatNumWithCommas(
                                      MAX_ENTRIES_PER_QUERY,
                                    )} hits.`,
                                    iconType: 'iInCircle',
                                    position: 'top',
                                  }
                                : undefined
                            }
                          />
                          <EuiButtonEmpty
                            disabled={
                              results?.hits?.total === 0 ||
                              !columnVisibility?.visibleColumns?.length
                            }
                            size='xs'
                            iconType='exportAction'
                            color='text'
                            isLoading={isExporting}
                            className='euiDataGrid__controlBtn'
                            onClick={onClickExportResults}
                          >
                            Export Formatted
                          </EuiButtonEmpty>

                          <DataGridVisibleColumnsSelector
                            availableColumns={dataGridProps.columnsAvailable}
                            columnVisibility={dataGridProps.columnVisibility}
                          />
                        </>
                      ),
                    }}
                  />
                </div>
              </EuiPanel>
            ) : null}
            {inspectedHit && (
              <EuiFlyout onClose={closeFlyoutHandler} size='m'>
                <EuiFlyoutHeader>
                  <EuiTitle>
                    <h2>{inspectDetailsTitle}</h2>
                  </EuiTitle>
                </EuiFlyoutHeader>
                <EuiFlyoutBody>
                  <EuiFlexGroup direction='column'>
                    <DocumentViewTableAndJson
                      document={inspectedHit}
                      indexPattern={dataSource?.indexPattern}
                      renderFields={getAllCustomRenders(
                        tableDefaultColumns,
                        wzDiscoverRenderColumns,
                      )}
                      filters={filters}
                      setFilters={setFilters}
                      onFilter={closeFlyoutHandler}
                    />
                  </EuiFlexGroup>
                </EuiFlyoutBody>
              </EuiFlyout>
            )}
          </>
        </EuiPageTemplate>
      </>
    </IntlProvider>
  );
};
