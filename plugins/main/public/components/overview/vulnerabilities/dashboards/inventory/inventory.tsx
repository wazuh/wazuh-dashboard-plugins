import React, { useEffect, useMemo, useState } from 'react';
import { getPlugins } from '../../../../../kibana-services';
import useSearchBarConfiguration from '../../searchbar/use-search-bar-configuration'
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
} from '@elastic/eui';
import { Filter, IndexPattern, OpenSearchQuerySortValue } from '../../../../../../../../src/plugins/data/common';
import { SearchResponse } from '../../../../../../../../src/core/server';
import DocViewer from '../../doc_viewer/doc_viewer';
import { DiscoverNoResults } from '../../common/components/no_results';
import { LoadingSpinner } from '../../common/components/loading_spinner';
import { useDataGrid } from '../../data_grid/use_data_grid';
import { inventoryTableDefaultColumns } from './config';
import { useDocViewer } from '../../doc_viewer/use_doc_viewer';
import './inventory.scss';
import { VULNERABILITIES_INDEX_PATTERN_ID } from '../../common/constants';

export const InventoryVuls = () => {
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

  const { pagination, sorting } = dataGridProps;

  const docViewerProps = useDocViewer({
    doc: inspectedHit,
    indexPattern: indexPattern as IndexPattern,
  })

  useEffect(() => {
    if (!isLoading) {
      setIndexPattern(indexPatterns?.[0] as IndexPattern);
      search();
    }
  }, [JSON.stringify(searchBarProps), JSON.stringify(pagination), JSON.stringify(sorting)]);

  /**
   * Search in index pattern
   */
  const search = async (): Promise<void> => {
    const indexPattern = indexPatterns?.[0];
    if (indexPattern) {
      setIsSearching(true);
      const data = getPlugins().data
      const searchSource = await data.search.searchSource.create();
      const timeFilter: Filter['query'] = [{
        range: {
          '@timestamp': {
            gte: searchBarProps?.dateRangeFrom,
            lte: searchBarProps?.dateRangeTo,
            format: 'strict_date_optional_time',
          },
        },
      }]
      const combined = [...timeFilter, ...(filters || [])];
      const fromField = (pagination?.pageIndex || 0) * (pagination?.pageSize || 100);
      const sortOrder: OpenSearchQuerySortValue[] = sorting?.columns.map((column) => {
        const sortDirection = column.direction === 'asc' ? 'asc' : 'desc';
        return { [column?.id || '']: sortDirection } as OpenSearchQuerySortValue;
      }) || [];

      const results = await searchSource
        .setParent(undefined)
        .setField('filter', combined)
        .setField('query', query)
        .setField('sort', sortOrder)
        .setField('size', pagination?.pageSize)
        .setField('from', fromField)
        .setField('index', indexPattern as IndexPattern)
        .fetch();
      setResults(results);
      setIsSearching(false);
    }
  };

  const timeField = indexPattern?.timeFieldName ? indexPattern.timeFieldName : undefined;


  return (
    <IntlProvider locale="en">
      <div className="vulsInventoryContainer">
      <EuiPageTemplate
        restrictWidth="100%"
        fullHeight={true}
        grow
      >
        <>
          {isLoading ? 
            <LoadingSpinner /> : 
            <SearchBar appName='inventory-vuls' {...searchBarProps} />}
          {isSearching ? 
            <LoadingSpinner /> : null}
          {!isLoading && !isSearching && results?.hits?.total === 0 ? 
            <DiscoverNoResults timeFieldName={timeField} queryLanguage={''} /> : null}
          {!isLoading && !isSearching && results?.hits?.total > 0 ?
            <EuiDataGrid {...dataGridProps} /> : null}
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
      </div>
    </IntlProvider>
  );
}
