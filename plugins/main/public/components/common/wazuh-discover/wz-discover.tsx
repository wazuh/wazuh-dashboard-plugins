import React, { useState, useMemo, useEffect } from 'react';
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
  EuiPanel,
} from '@elastic/eui';
import { TimeRange } from '../../../../../../src/plugins/data/public';
import { IntlProvider } from 'react-intl';
import { IndexPattern } from '../../../../../../src/plugins/data/common';
import { SearchResponse } from '../../../../../../src/core/server';
import { DiscoverNoResults } from '../no-results/no-results';
import { LoadingSearchbarProgress } from '../loading-searchbar-progress/loading-searchbar-progress';
import {
  useDataGrid,
  exportSearchToCSV,
  getAllCustomRenders,
} from '../data-grid';
import { DocumentViewTableAndJson } from './components/document-view-table-and-json';
import {
  ErrorHandler,
  ErrorFactory,
  HttpError,
} from '../../../react-services/error-management';
import useSearchBar from '../search-bar/use-search-bar';
import { getPlugins } from '../../../kibana-services';
import { histogramChartInput } from './config/histogram-chart';
import { getWazuhCorePlugin } from '../../../kibana-services';
import './discover.scss';
import {
  HideOnErrorInitializatingDataSource,
  PromptErrorInitializatingDataSource,
  withErrorBoundary,
} from '../hocs';
import {
  IDataSourceFactoryConstructor,
  useDataSource,
  tParsedIndexPattern,
  PatternDataSource,
  EventsDataSourceRepository,
} from '../data-source';
import DiscoverDataGridAdditionalControls from './components/data-grid-additional-controls';
import { wzDiscoverRenderColumns } from './render-columns';
import { WzSearchBar } from '../search-bar';
import { transformDateRange } from '../search-bar/search-bar-service';
import DocDetailsHeader from './components/doc-details-header';
import { tDataGridColumn } from '../data-grid/types';
import { SampleDataWarning } from '../../visualize/components';

export const MAX_ENTRIES_PER_QUERY = 10000;

const DashboardByRenderer =
  getPlugins().dashboard.DashboardContainerByValueRenderer;

export type WazuhDiscoverProps = {
  moduleId: string;
  tableColumns: tDataGridColumn[];
  DataSource: IDataSourceFactoryConstructor<PatternDataSource>;
  categoriesSampleData: string[];
};

const WazuhDiscoverComponent = (props: WazuhDiscoverProps) => {
  const {
    moduleId,
    DataSource,
    tableColumns: defaultTableColumns,
    categoriesSampleData,
  } = props;

  if (!DataSource) {
    throw new Error('DataSource is required');
  }

  const [results, setResults] = useState<SearchResponse>({} as SearchResponse);
  const [inspectedHit, setInspectedHit] = useState<any>(undefined);
  const [indexPattern, setIndexPattern] = useState<IndexPattern | undefined>(
    undefined,
  );
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [patternId, setPatternId] = useState<string>('');
  const sideNavDocked = getWazuhCorePlugin().hooks.useDockedSideNav();

  const EventsRepository = new EventsDataSourceRepository();

  useEffect(() => {
    (async () => {
      const id = await EventsRepository.getStoreIndexPatternId();
      setPatternId(id);
    })();
  }, []);

  const {
    dataSource,
    filters,
    fetchFilters,
    fixedFilters,
    isLoading: isDataSourceLoading,
    fetchData,
    setFilters,
    error,
  } = useDataSource<tParsedIndexPattern, PatternDataSource>({
    repository: AlertsRepository, // this makes only works with events index pattern
    DataSource,
  });

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

  const { searchBarProps, fingerprint, autoRefreshFingerprint } = useSearchBar({
    indexPattern: dataSource?.indexPattern as IndexPattern,
    filters,
    setFilters,
  });
  const { query, dateRangeFrom, dateRangeTo } = searchBarProps;
  const [absoluteDateRange, setAbsoluteDateRange] = useState<TimeRange>(
    transformDateRange({ from: dateRangeFrom, to: dateRangeTo }),
  );
  const dataGridProps = useDataGrid({
    moduleId,
    ariaLabelledBy: 'Discover events table',
    defaultColumns: defaultTableColumns,
    renderColumns: wzDiscoverRenderColumns,
    results,
    indexPattern: indexPattern as IndexPattern,
    DocViewInspectButton,
    useDefaultPagination: true,
    filters,
    setFilters,
  });

  const { pagination, setPagination, sorting, columnVisibility } =
    dataGridProps;

  useEffect(() => {
    if (isDataSourceLoading) {
      return;
    }
    setIndexPattern(dataSource?.indexPattern);

    fetchData({
      query,
      pagination,
      sorting,
      dateRange: absoluteDateRange,
    })
      .then(results => setResults(results))
      .catch(error => {
        const searchError = ErrorFactory.create(HttpError, {
          error,
          message: 'Error fetching data',
        });
        ErrorHandler.handleError(searchError);
      });
  }, [absoluteDateRange, JSON.stringify(sorting), JSON.stringify(pagination)]);

  useEffect(() => {
    if (isDataSourceLoading) {
      return;
    }
    setIndexPattern(dataSource?.indexPattern);
    setPagination(pagination => ({
      ...pagination,
      pageIndex: 0,
    }));
    setAbsoluteDateRange(
      transformDateRange({ from: dateRangeFrom, to: dateRangeTo }),
    );
  }, [
    JSON.stringify(fetchFilters),
    JSON.stringify(query),
    dateRangeFrom,
    dateRangeTo,
    fingerprint,
    autoRefreshFingerprint,
  ]);

  const timeField = indexPattern?.timeFieldName
    ? indexPattern.timeFieldName
    : undefined;

  const onClickExportResults = async () => {
    const params = {
      indexPattern: indexPattern as IndexPattern,
      filters: fetchFilters,
      query,
      fields: columnVisibility.visibleColumns,
      pagination: {
        pageIndex: 0,
        pageSize: results.hits.total,
      },
      dateRange: absoluteDateRange,
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

  const closeFlyoutHandler = () => setInspectedHit(undefined);

  return (
    <IntlProvider locale='en'>
      <>
        {isDataSourceLoading ? (
          <LoadingSearchbarProgress />
        ) : (
          <EuiPageTemplate
            className={
              dataSource ? 'discoverContainer' : ''
            } /* WORKAROUND: The conditional class assignment avoid to set a container height that
            moves down the error prompt if this is rendered. With thisthe error promtp is rendered
            at the top of the view.
            */
            restrictWidth='100%'
            fullHeight={true}
            grow
            paddingSize='none'
            pageContentProps={{ color: 'transparent' }}
          >
            {/* TODO: Using a page template wrapping these components causes different y render position
            of data source error prompt. We should unify the different views. In the Dashboard tab, the
            same prompt is rendered at top of view */}
            <HideOnErrorInitializatingDataSource error={error}>
              <WzSearchBar
                appName='wazuh-discover-search-bar'
                {...searchBarProps}
                fixedFilters={fixedFilters}
                showQueryInput={true}
                showQueryBar={true}
                showSaveQuery={true}
              />
              <SampleDataWarning categoriesSampleData={categoriesSampleData} />
            </HideOnErrorInitializatingDataSource>
            {!isDataSourceLoading && results?.hits?.total === 0 ? (
              <DiscoverNoResults timeFieldName={timeField} queryLanguage={''} />
            ) : null}
            <div
              className={
                !isDataSourceLoading && dataSource && results?.hits?.total > 0
                  ? ''
                  : 'wz-no-display'
              }
            >
              <EuiPanel
                paddingSize='s'
                hasShadow={false}
                hasBorder={false}
                color='transparent'
              >
                <EuiFlexGroup gutterSize='s' direction='column'>
                  <EuiFlexItem grow={false} className='discoverChartContainer'>
                    <EuiPanel
                      hasBorder={false}
                      hasShadow={false}
                      color='transparent'
                      paddingSize='none'
                    >
                      <EuiPanel>
                        {patternId && (
                          <DashboardByRenderer
                            input={histogramChartInput(
                              patternId,
                              fetchFilters,
                              query,
                              dateRangeFrom,
                              dateRangeTo,
                              fingerprint,
                            )}
                          />
                        )}
                      </EuiPanel>
                    </EuiPanel>
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiDataGrid
                      {...dataGridProps}
                      className={sideNavDocked ? 'dataGridDockedNav' : ''}
                      toolbarVisibility={{
                        showColumnSelector: { allowHide: false },
                        additionalControls: (
                          <>
                            <DiscoverDataGridAdditionalControls
                              dataGridStatePersistenceManager={
                                dataGridProps.dataGridStatePersistenceManager
                              }
                              totalHits={results?.hits?.total || 0}
                              isExporting={isExporting}
                              columnsAvailable={dataGridProps.columnsAvailable}
                              columnVisibility={dataGridProps.columnVisibility}
                              onClickExportResults={onClickExportResults}
                              maxEntriesPerQuery={MAX_ENTRIES_PER_QUERY}
                              dateRange={absoluteDateRange}
                            />
                          </>
                        ),
                      }}
                    />
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiPanel>
              {inspectedHit && (
                <EuiFlyout onClose={closeFlyoutHandler} size='m'>
                  <EuiFlyoutHeader>
                    <DocDetailsHeader
                      doc={inspectedHit}
                      indexPattern={dataSource?.indexPattern}
                    />
                  </EuiFlyoutHeader>
                  <EuiFlyoutBody>
                    <EuiFlexGroup direction='column'>
                      <EuiFlexItem>
                        <DocumentViewTableAndJson
                          document={inspectedHit}
                          indexPattern={indexPattern}
                          renderFields={getAllCustomRenders(
                            defaultTableColumns,
                            wzDiscoverRenderColumns,
                          )}
                          filters={filters}
                          setFilters={setFilters}
                          onFilter={closeFlyoutHandler}
                        />
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiFlyoutBody>
                </EuiFlyout>
              )}
            </div>
            {/* TODO: this should be rendered with a guard instead optional rendering, but this
            requires to refactor the creation of the data source. Consider the IT Hygiene tables
            for the refactor. */}
            {error && <PromptErrorInitializatingDataSource error={error} />}
          </EuiPageTemplate>
        )}
      </>
    </IntlProvider>
  );
};

export const WazuhDiscover = withErrorBoundary(WazuhDiscoverComponent);
