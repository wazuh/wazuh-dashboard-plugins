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
  EuiButtonEmpty,
  EuiCallOut,
  EuiSpacer,
  EuiPanel,
  EuiDataGridColumn
} from '@elastic/eui';
import { IntlProvider } from 'react-intl';
import { IndexPattern } from '../../../../../../src/plugins/data/common';
import { SearchResponse } from '../../../../../../src/core/server';
import { useDocViewer } from '../doc_viewer';
import DocViewer from '../doc_viewer/doc_viewer';
import { DiscoverNoResults } from '../../overview/vulnerabilities/common/components/no_results';
import { LoadingSpinner } from '../../overview/vulnerabilities/common/components/loading_spinner';
import { useDataGrid, tDataGridColumn, exportSearchToCSV } from '../hooks/data_grid';
import { ErrorHandler, ErrorFactory, HttpError } from '../../../react-services/error-management';
import { withErrorBoundary } from '../hocs';
import { HitsCounter } from '../../../kibana-integrations/discover/application/components/hits_counter';
import { formatNumWithCommas } from '../../../kibana-integrations/discover/application/helpers';
import useSearchBar from '../hooks/search_bar/use_search_bar';
import { search } from '../hooks/search_bar';
import { getPlugins } from '../../../kibana-services';
import { ViewMode } from '../../../../../../src/plugins/embeddable/public';
import { getDiscoverPanels } from './config/chart';
const DashboardByRenderer = getPlugins().dashboard.DashboardContainerByValueRenderer;

/**
 * ToDo:
 * - add possibility to customize column render
 * - add save query feature
 */

export const MAX_ENTRIES_PER_QUERY = 10000;

type WazuhDiscoverProps = {
  indexPatternName: string;
  tableColumns: tDataGridColumn[];
}

const WazuhDiscover = (props: WazuhDiscoverProps) => {
  const { indexPatternName, tableColumns: defaultTableColumns } = props
  const { searchBarProps } = useSearchBar({
    defaultIndexPatternID: indexPatternName,
  })
  const { isLoading, filters, query, indexPatterns } = searchBarProps;
  const SearchBar = getPlugins().data.ui.SearchBar;
  const [results, setResults] = useState<SearchResponse>({} as SearchResponse);
  const [inspectedHit, setInspectedHit] = useState<any>(undefined);
  const [indexPattern, setIndexPattern] = useState<IndexPattern | undefined>(undefined);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const onClickInspectDoc = useMemo(() => (index: number) => {
    const rowClicked = results.hits.hits[index];
    setInspectedHit(rowClicked);
  }, [results]);

  const DocViewInspectButton = ({ rowIndex }: EuiDataGridCellValueElementProps) => {
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
    defaultColumns: defaultTableColumns,
    results,
    indexPattern: indexPattern as IndexPattern,
    DocViewInspectButton
  })

  const { pagination, sorting, columnVisibility } = dataGridProps;

  const docViewerProps = useDocViewer({
    doc: inspectedHit,
    indexPattern: indexPattern as IndexPattern,
  })

  useEffect(() => {
    if (!isLoading) {
      setIndexPattern(indexPatterns?.[0] as IndexPattern);
      search({
        indexPattern: indexPatterns?.[0] as IndexPattern,
        filters,
        query,
        pagination,
        sorting
      }).then((results) => {
        setResults(results);
        setIsSearching(false);
      }).catch((error) => {
        const searchError = ErrorFactory.create(HttpError, { error, message: 'Error fetching vulnerabilities' })
        ErrorHandler.handleError(searchError);
        setIsSearching(false);
      })
    }
  }, [JSON.stringify(searchBarProps), JSON.stringify(pagination), JSON.stringify(sorting)]);

  const timeField = indexPattern?.timeFieldName ? indexPattern.timeFieldName : undefined;

  const onClickExportResults = async () => {
    const params = {
      indexPattern: indexPatterns?.[0] as IndexPattern,
      filters,
      query,
      fields: columnVisibility.visibleColumns,
      pagination: {
        pageIndex: 0,
        pageSize: results.hits.total
      },
      sorting
    }
    try {
      setIsExporting(true);
      await exportSearchToCSV(params);
    } catch (error) {
      const searchError = ErrorFactory.create(HttpError, { error, message: 'Error downloading csv report' })
      ErrorHandler.handleError(searchError);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <IntlProvider locale="en">
      <EuiPageTemplate
        className="vulsInventoryContainer"
        restrictWidth="100%"
        fullHeight={true}
        grow
      >
        <>
          {isLoading ?
            <LoadingSpinner /> :
            <SearchBar
              appName='inventory-vuls'
              {...searchBarProps}
            />}
          {isSearching ?
            <LoadingSpinner /> : null}
          {!isLoading && !isSearching && results?.hits?.total === 0 ?
            <DiscoverNoResults timeFieldName={timeField} queryLanguage={''} /> : null}
          {!isLoading && !isSearching && results?.hits?.total > 0 ? (
            <>
              <EuiFlexItem grow={false}>
                <EuiPanel hasBorder={false} hasShadow={false} color="transparent" paddingSize="none">
                  <EuiPanel>
                    <DashboardByRenderer
                      input={{
                        viewMode: ViewMode.VIEW,
                        panels: getDiscoverPanels('wazuh-alerts-*'),
                        isFullScreenMode: false,
                        filters: searchBarProps.filters ?? [],
                        useMargins: false,
                        id: 'vulnerability-detector-dashboard-tab-filters',
                        timeRange: {
                          from: searchBarProps.dateRangeFrom,
                          to: searchBarProps.dateRangeTo,
                        },
                        title: 'Vulnerability detector dashboard filters',
                        description: 'Dashboard of the Vulnerability detector filters',
                        query: searchBarProps.query,
                        refreshConfig: {
                          pause: false,
                          value: 15,
                        },
                        hidePanelTitles: true,
                      }}
                    />
                  </EuiPanel>
                </EuiPanel>
              </EuiFlexItem>
              <EuiSpacer size="m" />
              <EuiDataGrid
                {...dataGridProps}
                toolbarVisibility={{
                  additionalControls: (
                    <>
                      <HitsCounter
                        hits={results?.hits?.total}
                        showResetButton={false}
                        onResetQuery={() => { }}
                        tooltip={results?.hits?.total && results?.hits?.total > MAX_ENTRIES_PER_QUERY ? {
                          ariaLabel: 'Warning',
                          content: `The query results has exceeded the limit of 10,000 hits. To provide a better experience the table only shows the first ${formatNumWithCommas(MAX_ENTRIES_PER_QUERY)} hits.`,
                          iconType: 'alert',
                          position: 'top'
                        } : undefined}
                      />
                      <EuiButtonEmpty
                        disabled={results?.hits?.total === 0}
                        size="xs"
                        iconType="exportAction"
                        color="primary"
                        isLoading={isExporting}
                        className="euiDataGrid__controlBtn"
                        onClick={onClickExportResults}>
                        Export Formated
                      </EuiButtonEmpty>
                    </>
                  )
                }}
              />
            </>) : null}
          {inspectedHit && (
            <EuiFlyout onClose={() => setInspectedHit(undefined)} size="m">
              <EuiFlyoutHeader>
                <EuiTitle>
                  <h2>Document Details</h2>
                </EuiTitle>
              </EuiFlyoutHeader>
              <EuiFlyoutBody>
                <EuiFlexGroup direction="column">
                  <EuiFlexItem>
                    <DocViewer
                      {...docViewerProps} />
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlyoutBody>
            </EuiFlyout>
          )}
        </>
      </EuiPageTemplate>
    </IntlProvider >
  );
}

export default WazuhDiscover;