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
  EuiTitle,
  EuiPanel,
} from '@elastic/eui';
import { IntlProvider } from 'react-intl';
import { IndexPattern } from '../../../../../../src/plugins/data/common';
import { SearchResponse } from '../../../../../../src/core/server';
import { DiscoverNoResults } from '../no-results/no-results';
import { LoadingSpinner } from '../loading-spinner/loading-spinner';
import {
  useDataGrid,
  tDataGridColumn,
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
const DashboardByRenderer =
  getPlugins().dashboard.DashboardContainerByValueRenderer;
import './discover.scss';
import { withErrorBoundary } from '../hocs';
import {
  IDataSourceFactoryConstructor,
  useDataSource,
  tParsedIndexPattern,
  PatternDataSource,
  AlertsDataSourceRepository,
} from '../data-source';
import DiscoverDataGridAdditionalControls from './components/data-grid-additional-controls';
import { wzDiscoverRenderColumns } from './render-columns';
import { WzSearchBar } from '../search-bar';
import DocDetailsHeader from './components/doc-details-header';

export const MAX_ENTRIES_PER_QUERY = 10000;

export type WazuhDiscoverProps = {
  tableColumns: tDataGridColumn[];
  DataSource: IDataSourceFactoryConstructor<PatternDataSource>;
};

const WazuhDiscoverComponent = (props: WazuhDiscoverProps) => {
  const { DataSource, tableColumns: defaultTableColumns } = props;

  if (!DataSource) {
    throw new Error('DataSource is required');
  }

  const [results, setResults] = useState<SearchResponse>({} as SearchResponse);
  const [inspectedHit, setInspectedHit] = useState<any>(undefined);
  const [indexPattern, setIndexPattern] = useState<IndexPattern | undefined>(
    undefined,
  );
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const sideNavDocked = getWazuhCorePlugin().hooks.useDockedSideNav();

  const AlertsRepository = new AlertsDataSourceRepository();

  const {
    dataSource,
    filters,
    fetchFilters,
    fixedFilters,
    isLoading: isDataSourceLoading,
    fetchData,
    setFilters,
  } = useDataSource<tParsedIndexPattern, PatternDataSource>({
    repository: AlertsRepository, // this makes only works with alerts index pattern
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

  const { searchBarProps } = useSearchBar({
    indexPattern: dataSource?.indexPattern as IndexPattern,
    filters,
    setFilters,
  });
  const { query, absoluteDateRange } = searchBarProps;

  const dataGridProps = useDataGrid({
    ariaLabelledBy: 'Discover events table',
    defaultColumns: defaultTableColumns,
    renderColumns: wzDiscoverRenderColumns,
    results,
    indexPattern: indexPattern as IndexPattern,
    DocViewInspectButton,
    pagination: {
      pageIndex: 0,
      pageSize: 15,
      pageSizeOptions: [15, 25, 50, 100],
    },
  });

  const { pagination, sorting, columnVisibility } = dataGridProps;

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
  }, [
    JSON.stringify(fetchFilters),
    JSON.stringify(query),
    JSON.stringify(sorting),
    JSON.stringify(pagination),
    JSON.stringify(absoluteDateRange),
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
        className='discoverContainer'
        restrictWidth='100%'
        fullHeight={true}
        grow
        paddingSize='none'
        pageContentProps={{ color: 'transparent' }}
      >
        {isDataSourceLoading ? (
          <LoadingSpinner />
        ) : (
          <WzSearchBar
            appName='wazuh-discover-search-bar'
            {...searchBarProps}
            fixedFilters={fixedFilters}
            showQueryInput={true}
            showQueryBar={true}
            showSaveQuery={true}
          />
        )}
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
                    <DashboardByRenderer
                      input={histogramChartInput(
                        AlertsRepository.getStoreIndexPatternId(),
                        fetchFilters,
                        query,
                        absoluteDateRange.from,
                        absoluteDateRange.to,
                      )}
                    />
                  </EuiPanel>
                </EuiPanel>
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiDataGrid
                  {...dataGridProps}
                  className={sideNavDocked ? 'dataGridDockedNav' : ''}
                  toolbarVisibility={{
                    additionalControls: (
                      <>
                        <DiscoverDataGridAdditionalControls
                          totalHits={results?.hits?.total || 0}
                          isExporting={isExporting}
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
            <EuiFlyout onClose={() => setInspectedHit(undefined)} size='m'>
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
                    />
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlyoutBody>
            </EuiFlyout>
          )}
        </div>
      </EuiPageTemplate>
    </IntlProvider>
  );
};

export const WazuhDiscover = withErrorBoundary(WazuhDiscoverComponent);
