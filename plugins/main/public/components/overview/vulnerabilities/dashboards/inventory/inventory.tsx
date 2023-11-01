import React, { useEffect, useMemo, useState } from 'react';
import { getPlugins } from '../../../../../kibana-services';
import useSearchBarConfiguration from '../../search_bar/use_search_bar_configuration'
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
import DocViewer from '../../doc_viewer/doc_viewer';
import { DiscoverNoResults } from '../../common/components/no_results';
import { LoadingSpinner } from '../../common/components/loading_spinner';
import { useDataGrid } from '../../data_grid/use_data_grid';
import { inventoryTableDefaultColumns } from './config';
import { useDocViewer } from '../../doc_viewer/use_doc_viewer';
import './inventory.scss';
import { VULNERABILITIES_INDEX_PATTERN_ID } from '../../common/constants';
import { search, exportSearchToCSV } from './inventory_service';
import { ErrorHandler, ErrorFactory, HttpError } from '../../../../../react-services/error-management';
import { withErrorBoundary } from '../../../../common/hocs';

const InventoryVulsComponent = () => {
  const { searchBarProps } = useSearchBarConfiguration({
    defaultIndexPatternID: VULNERABILITIES_INDEX_PATTERN_ID,
  })
  const { isLoading, filters, query, indexPatterns } = searchBarProps;
  const SearchBar = getPlugins().data.ui.SearchBar;
  const [results, setResults] = useState<SearchResponse>({} as SearchResponse);
  const [inspectedHit, setInspectedHit] = useState<any>(undefined);
  const [indexPattern, setIndexPattern] = useState<IndexPattern | undefined>(undefined);
  const [isSearching, setIsSearching] = useState<boolean>(false);

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
    defaultColumns: inventoryTableDefaultColumns,
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
      try {
        search({
          indexPattern: indexPatterns?.[0] as IndexPattern,
          filters,
          query,
          pagination,
          sorting
        }).then((results) => {
          setResults(results);
          setIsSearching(false);
        });
      }catch(error){
        const searchError = ErrorFactory.create(HttpError, { error, message: 'Error searching vulnerabilities' })
        ErrorHandler.handleError(searchError);
        setIsSearching(false);
      }
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
      await exportSearchToCSV(params);
    }catch(error){
      const searchError = ErrorFactory.create(HttpError, { error, message: 'Error downloading csv report' })
      ErrorHandler.handleError(searchError);
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
              showDatePicker={false}
              showQueryInput={true}
              showQueryBar={true}
              />}
          {isSearching ? 
            <LoadingSpinner /> : null}
          {!isLoading && !isSearching && results?.hits?.total === 0 ? 
            <DiscoverNoResults timeFieldName={timeField} queryLanguage={''} /> : null}
          {!isLoading && !isSearching && results?.hits?.total > 0 ?
            <EuiDataGrid 
              {...dataGridProps} 
              toolbarVisibility={{
                additionalControls: (
                  <EuiButtonEmpty
                    disabled={results?.hits?.total === 0}
                    size="xs"
                    iconType="exportAction"
                    color="primary"
                    className="euiDataGrid__controlBtn"
                    onClick={onClickExportResults}>
                    Export Formated
                  </EuiButtonEmpty>
                ),
              }}
              /> : null}
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
    </IntlProvider>
  );
}

export const InventoryVuls = withErrorBoundary(InventoryVulsComponent);