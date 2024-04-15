import React, { useEffect, useMemo, useState } from 'react';
import { getPlugins, getWazuhCorePlugin } from '../../../../../kibana-services';
import useSearchBarConfiguration from '../../search_bar/use_search_bar_configuration';
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
} from '@elastic/eui';
import { IndexPattern } from '../../../../../../../../src/plugins/data/common';
import { SearchResponse } from '../../../../../../../../src/core/server';
import { DiscoverNoResults } from '../../common/components/no_results';
import { LoadingSpinner } from '../../common/components/loading_spinner';
import { useDataGrid } from '../../data_grid/use_data_grid';
import { MAX_ENTRIES_PER_QUERY, inventoryTableDefaultColumns } from './config';
import { useDocViewer } from '../../doc_viewer/use_doc_viewer';
import './inventory.scss';
import { search, exportSearchToCSV } from './inventory_service';
import {
  ErrorHandler,
  ErrorFactory,
  HttpError,
} from '../../../../../react-services/error-management';
import { withErrorBoundary } from '../../../../common/hocs';
import { HitsCounter } from '../../../../../kibana-integrations/discover/application/components/hits_counter/hits_counter';
import { formatNumWithCommas } from '../../../../../kibana-integrations/discover/application/helpers';
import { useAppConfig } from '../../../../common/hooks';
import {
  vulnerabilityIndexFiltersAdapter,
  onUpdateAdapter,
  restorePrevIndexFiltersAdapter,
} from '../../common/vulnerability_detector_adapters';
import { compose } from 'redux';
import { withVulnerabilitiesStateDataSource } from '../../common/hocs/validate-vulnerabilities-states-index-pattern';
import { ModuleEnabledCheck } from '../../common/components/check-module-enabled';
import { DataSourceFilterManagerVulnerabilitiesStates } from '../../../../../react-services/data-sources';
import { DocumentViewTableAndJson } from '../../common/components/document_view_table_and_json';

const InventoryVulsComponent = () => {
  const appConfig = useAppConfig();
  const VULNERABILITIES_INDEX_PATTERN_ID =
    appConfig.data['vulnerabilities.pattern'];
  const { searchBarProps } = useSearchBarConfiguration({
    defaultIndexPatternID: VULNERABILITIES_INDEX_PATTERN_ID,
    onMount: vulnerabilityIndexFiltersAdapter,
    onUpdate: onUpdateAdapter,
    onUnMount: restorePrevIndexFiltersAdapter,
  });

  const fetchFilters = DataSourceFilterManagerVulnerabilitiesStates.getFilters(
    searchBarProps.filters,
    VULNERABILITIES_INDEX_PATTERN_ID,
  );
  const { isLoading, filters, query, indexPatterns } = searchBarProps;
  const SearchBar = getPlugins().data.ui.SearchBar;
  const [results, setResults] = useState<SearchResponse>({} as SearchResponse);
  const [inspectedHit, setInspectedHit] = useState<any>(undefined);
  const [indexPattern, setIndexPattern] = useState<IndexPattern | undefined>(
    undefined,
  );
  const [isSearching, setIsSearching] = useState<boolean>(false);
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
    ariaLabelledBy: 'Vulnerabilities Inventory Table',
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
        filters: fetchFilters,
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
            message: 'Error fetching vulnerabilities',
          });
          ErrorHandler.handleError(searchError);
          setIsSearching(false);
        });
    }
  }, [
    JSON.stringify(searchBarProps),
    JSON.stringify(pagination),
    JSON.stringify(sorting),
    JSON.stringify(fetchFilters),
  ]);

  const onClickExportResults = async () => {
    const params = {
      indexPattern: indexPatterns?.[0] as IndexPattern,
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
      <>
        <ModuleEnabledCheck />
        <EuiPageTemplate
          className='vulsInventoryContainer'
          restrictWidth='100%'
          grow
        >
          <>
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <SearchBar
                appName='inventory-vuls'
                {...searchBarProps}
                showDatePicker={false}
                showQueryInput={true}
                showQueryBar={true}
              />
            )}
            {isSearching ? <LoadingSpinner /> : null}
            {!isLoading && !isSearching && results?.hits?.total === 0 ? (
              <DiscoverNoResults />
            ) : null}
            {!isLoading && !isSearching && results?.hits?.total > 0 ? (
              <EuiDataGrid
                {...dataGridProps}
                className={sideNavDocked ? 'dataGridDockedNav' : ''}
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
                    <h2>Document details</h2>
                  </EuiTitle>
                </EuiFlyoutHeader>
                <EuiFlyoutBody>
                  <EuiFlexGroup direction='column'>
                    <DocumentViewTableAndJson
                      document={inspectedHit}
                      indexPattern={indexPattern}
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

export const InventoryVuls = compose(
  withErrorBoundary,
  withVulnerabilitiesStateDataSource,
)(InventoryVulsComponent);
