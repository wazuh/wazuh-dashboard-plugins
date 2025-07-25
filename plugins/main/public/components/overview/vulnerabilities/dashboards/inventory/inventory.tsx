import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { SearchResponse } from '../../../../../../../../src/core/server';
import { HitsCounter } from '../../../../../kibana-integrations/discover/application/components/hits_counter/hits_counter';
import { formatNumWithCommas } from '../../../../../kibana-integrations/discover/application/helpers';
import { getWazuhCorePlugin } from '../../../../../kibana-services';
import {
  ErrorHandler,
  ErrorFactory,
  HttpError,
} from '../../../../../react-services/error-management';
import './inventory.scss';
import { inventoryTableDefaultColumns } from './config';
import {
  MAX_ENTRIES_PER_QUERY,
  getAllCustomRenders,
} from '../../../../common/data-grid/data-grid-service';
import { DiscoverNoResults } from '../../common/components/no_results';
import { LoadingSearchbarProgress } from '../../../../../../public/components/common/loading-searchbar-progress/loading-searchbar-progress';
// common components/hooks
import useSearchBar from '../../../../common/search-bar/use-search-bar';
import { useDataGrid } from '../../../../common/data-grid/use-data-grid';
import {
  HideOnErrorInitializatingDataSource,
  PromptErrorInitializatingDataSource,
  withErrorBoundary,
} from '../../../../common/hocs';
import { exportSearchToCSV } from '../../../../common/data-grid/data-grid-service';
import { compose } from 'redux';
import { withVulnerabilitiesStateDataSource } from '../../common/hocs/validate-vulnerabilities-states-index-pattern';
import { ModuleEnabledCheck } from '../../common/components/check-module-enabled';
import {
  VulnerabilitiesDataSourceRepository,
  VulnerabilitiesDataSource,
  tParsedIndexPattern,
  PatternDataSource,
} from '../../../../common/data-source';
import { useDataSource } from '../../../../common/data-source/hooks';
import { IndexPattern } from '../../../../../../../../src/plugins/data/public';
import { wzDiscoverRenderColumns } from '../../../../common/wazuh-discover/render-columns';
import { DocumentViewTableAndJson } from '../../../../common/wazuh-discover/components/document-view-table-and-json';
import { WzSearchBar } from '../../../../common/search-bar';
import VulsEvaluationFilter, {
  createUnderEvaluationFilter,
  excludeUnderEvaluationFilter,
  getUnderEvaluationFilterValue,
} from '../../common/components/vuls-evaluation-filter';
import { DataGridVisibleColumnsSelector } from '../../../../common/wazuh-discover/components/visible-columns-selector';
import { SampleDataWarning } from '../../../../visualize/components';
import { WAZUH_SAMPLE_VULNERABILITIES } from '../../../../../../common/constants';
import RestoreStateColumnsButton from '../../../../common/wazuh-discover/components/restore-state-columns';

const InventoryVulsComponent = () => {
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
    DataSource: VulnerabilitiesDataSource,
    repository: new VulnerabilitiesDataSourceRepository(),
  });
  const { searchBarProps, fingerprint } = useSearchBar({
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

  const getUnderEvaluation = useCallback(getUnderEvaluationFilterValue, [
    JSON.stringify(filters),
    isDataSourceLoading,
  ]);

  const dataGridProps = useDataGrid({
    moduleId: 'vulnerabilities-inventory',
    ariaLabelledBy: 'Vulnerabilities Inventory Table',
    defaultColumns: inventoryTableDefaultColumns,
    renderColumns: wzDiscoverRenderColumns,
    results,
    indexPattern: indexPattern as IndexPattern,
    DocViewInspectButton,
    filters,
    setFilters,
  });

  const { pagination, sorting, columnVisibility } = dataGridProps;

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
    setUnderEvaluation(getUnderEvaluation(filters || []));
    setIndexPattern(dataSource?.indexPattern);
    fetchData({ query, pagination, sorting })
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
    /* FIX: If changing any filter and the results total is the same, the page is not reset to the
     initial page but it causes a request. This has a different behavior compared with the table
     used for Events. We should use the common logic for all the tables instead of creating new ones
     avoiding the differences in the stuff that should be common for all the tables.
     See the generic table plugins/main/public/components/common/wazuh-discover/table.tsx */
    JSON.stringify(fetchFilters),
    JSON.stringify(query),
    JSON.stringify(pagination),
    JSON.stringify(sorting),
    fingerprint,
  ]);

  /**
   * When the user changes the filter value, this function is called to update the filters
   * If the value is null, the filter is removed
   * If the filter already exists, it is remove and the new filter is added
   * @param underEvaluation
   * @returns
   */
  const handleFilterChange = (underEvaluation: boolean | null) => {
    const newFilters = excludeUnderEvaluationFilter(filters || []);
    if (underEvaluation === null) {
      setFilters(newFilters);
      return;
    }
    newFilters.push(
      createUnderEvaluationFilter(
        underEvaluation,
        dataSource?.id || indexPattern?.id,
      ),
    );
    setFilters(newFilters);
  };

  const [underEvaluation, setUnderEvaluation] = useState<boolean | null>(
    getUnderEvaluation(filters || []),
  );

  const closeFlyoutHandler = () => setInspectedHit(undefined);

  return (
    <IntlProvider locale='en'>
      <>
        <ModuleEnabledCheck />
        {/* TODO: Using a page template wrapping these components causes different y render position
        of data source error prompt. We should unify the different views. In the Dashboard tab, the
        same prompt is rendered at top of view */}
        <EuiPageTemplate
          className='vulsInventoryContainer'
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
                <HideOnErrorInitializatingDataSource error={error}>
                  <WzSearchBar
                    appName='inventory-vuls'
                    {...searchBarProps}
                    filters={excludeUnderEvaluationFilter(filters)}
                    fixedFilters={fixedFilters}
                    postFixedFilters={[
                      () => (
                        <VulsEvaluationFilter
                          value={underEvaluation}
                          setValue={handleFilterChange}
                        />
                      ),
                    ]}
                    showDatePicker={false}
                    showQueryInput={true}
                    showQueryBar={true}
                    showSaveQuery={true}
                  />
                  <SampleDataWarning
                    categoriesSampleData={[WAZUH_SAMPLE_VULNERABILITIES]}
                  />
                </HideOnErrorInitializatingDataSource>
              </>
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
                <div className='vulsInventoryDataGrid'>
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

                          <RestoreStateColumnsButton
                            dataGridStatePersistenceManager={
                              dataGridProps.dataGridStatePersistenceManager
                            }
                          />

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
                    <h2>Vulnerability details</h2>
                  </EuiTitle>
                </EuiFlyoutHeader>
                <EuiFlyoutBody>
                  <EuiFlexGroup direction='column'>
                    <DocumentViewTableAndJson
                      document={inspectedHit}
                      indexPattern={indexPattern}
                      renderFields={getAllCustomRenders(
                        inventoryTableDefaultColumns,
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
          {error && <PromptErrorInitializatingDataSource error={error} />}
        </EuiPageTemplate>
      </>
    </IntlProvider>
  );
};

export const InventoryVuls = compose(
  withErrorBoundary,
  withVulnerabilitiesStateDataSource,
)(InventoryVulsComponent);
