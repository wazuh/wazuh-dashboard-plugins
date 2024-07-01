import React, { useState, useEffect, useMemo } from 'react';
import { getWazuhCorePlugin } from '../../../kibana-services';
import { SearchResponse } from '../../../../../src/core/server';
import { IndexPattern } from '../../../../../src/plugins/data/common';
import useSearchBar from '../../common/search-bar/use-search-bar';
import {
  EuiButtonIcon,
  EuiDataGrid,
  EuiToolTip,
  EuiDataGridCellValueElementProps,
  EuiPageBody,
  EuiPanel,
  EuiButtonEmpty,
} from '@elastic/eui';
import {
  ErrorFactory,
  ErrorHandler,
  HttpError,
} from '../../../react-services/error-management';
import {
  MAX_ENTRIES_PER_QUERY,
  exportSearchToCSV,
} from '../../common/data-grid/data-grid-service';
import { useDataGrid } from '../../common/data-grid/use-data-grid';
import {
  FleetDataSource,
  FleetDataSourceRepository,
  PatternDataSource,
  tParsedIndexPattern,
  useDataSource,
} from '../../common/data-source';
import { DiscoverNoResults } from '../../common/no-results/no-results';
import { LoadingSpinner } from '../../common/loading-spinner/loading-spinner';
import { WzSearchBar } from '../../common/search-bar';
import { agentsDefaultColumns } from './columnst';
import { HitsCounter } from '../../../kibana-integrations/discover/application/components/hits_counter';
import { formatNumWithCommas } from '../../../kibana-integrations/discover/application/helpers';
import { useDocViewer } from '../../common/doc-viewer';

export const AgentList = () => {
  const {
    dataSource,
    filters,
    fetchFilters,
    isLoading: isDataSourceLoading,
    fetchData,
    setFilters,
  } = useDataSource<tParsedIndexPattern, PatternDataSource>({
    DataSource: FleetDataSource,
    repository: new FleetDataSourceRepository(),
  });
  const { searchBarProps } = useSearchBar({
    indexPattern: dataSource?.indexPattern as IndexPattern,
    filters,
    setFilters,
  });
  const { query } = searchBarProps;

  const [results, setResults] = useState<SearchResponse>({} as SearchResponse);
  const [inspectedHit, setInspectedHit] = useState<any>(undefined);
  const [indexPattern, setIndexPattern] = useState<IndexPattern | undefined>(
    undefined,
  );
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
    const inspectHintMsg = 'Inspect vulnerability details';
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
    ariaLabelledBy: 'Fleet agents table',
    defaultColumns: agentsDefaultColumns,
    // renderColumns: wzDiscoverRenderColumns,
    results,
    indexPattern: indexPattern as IndexPattern,
    DocViewInspectButton,
  });

  const { pagination, sorting, columnVisibility } = dataGridProps;

  const docViewerProps = useDocViewer({
    doc: inspectedHit,
    indexPattern: indexPattern as IndexPattern,
  });

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

  useEffect(() => {
    if (isDataSourceLoading) {
      return;
    }
    setIndexPattern(dataSource?.indexPattern);
    fetchData({ query, pagination, sorting })
      .then(results => {
        setResults(results);
      })
      .catch(error => {
        const searchError = ErrorFactory.create(HttpError, {
          error,
          message: 'Error fetching vulnerabilities',
        });
        ErrorHandler.handleError(searchError);
      });
  }, [
    JSON.stringify(fetchFilters),
    JSON.stringify(query),
    JSON.stringify(pagination),
    JSON.stringify(sorting),
    isDataSourceLoading,
  ]);

  return (
    <EuiPageBody locale='en'>
      <>
        {isDataSourceLoading ? (
          <LoadingSpinner />
        ) : (
          <WzSearchBar
            appName='agents'
            {...searchBarProps}
            showDatePicker={false}
            showQueryInput={true}
            showQueryBar={true}
            showSaveQuery={true}
          />
        )}
        {!isDataSourceLoading && results?.hits?.total === 0 ? (
          <DiscoverNoResults />
        ) : null}
        {!isDataSourceLoading && results?.hits?.total > 0 ? (
          <EuiPanel
            paddingSize='s'
            hasShadow={false}
            hasBorder={false}
            color='transparent'
          >
            <EuiDataGrid
              {...dataGridProps}
              className={sideNavDocked ? 'dataGridDockedNav' : ''}
              toolbarVisibility={{
                additionalControls: (
                  <>
                    <HitsCounter
                      hits={results?.hits?.total}
                      showResetButton={false}
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
                      disabled={
                        results?.hits?.total === 0 ||
                        !columnVisibility?.visibleColumns?.length
                      }
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
          </EuiPanel>
        ) : null}
      </>
    </EuiPageBody>
  );
};
