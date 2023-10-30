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
  EuiButtonEmpty,
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
import * as FileSaver from '../../../../../services/file-saver';

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
        console.error(error);
        // check when filters are wrong and the search fails
      }
    }
  }, [JSON.stringify(searchBarProps), JSON.stringify(pagination), JSON.stringify(sorting)]);

  /**
   * Search in index pattern
   */
  interface SearchParams {
    indexPattern: IndexPattern;
    filters?: Filter[];
    query?: any;
    pagination?: {
      pageIndex?: number;
      pageSize?: number;
    };
    fields?: string[],
    sorting?: {
      columns: {
        id: string;
        direction: 'asc' | 'desc';
      }[];
    };
  }

  const search = async (params: SearchParams): Promise<SearchResponse> => {
    const { indexPattern, filters = [], query, pagination, sorting, fields } = params;
    const data = getPlugins().data;
    const searchSource = await data.search.searchSource.create();
    const fromField = (pagination?.pageIndex || 0) * (pagination?.pageSize || 100);
    const sortOrder: OpenSearchQuerySortValue[] = sorting?.columns.map((column) => {
      const sortDirection = column.direction === 'asc' ? 'asc' : 'desc';
      return { [column?.id || '']: sortDirection } as OpenSearchQuerySortValue;
    }) || [];

    const searchParams = searchSource
      .setParent(undefined)
      .setField('filter', filters)
      .setField('query', query)
      .setField('sort', sortOrder)
      .setField('size', pagination?.pageSize)
      .setField('from', fromField)
      .setField('index', indexPattern)

    // add fields
    if(fields && Array.isArray(fields) && fields.length > 0)
      searchParams.setField('fields',fields);
      

    return await searchParams.fetch();
  };

  const timeField = indexPattern?.timeFieldName ? indexPattern.timeFieldName : undefined;

  const onClickExport = async () => {
    // use the search method to get the data and pass the results.hits.total to make

    const result = await search({
      indexPattern: indexPatterns?.[0] as IndexPattern,
      filters,
      query,
      fields: columnVisibility.visibleColumns,
      pagination: {
        pageIndex: 0,
        pageSize: results.hits.total
      },
      sorting
    })

    const allResults = result.hits.hits.map((hit: any) => {
      return indexPattern?.flattenHit(hit);
    });

    const blob = new Blob(allResults, { type: 'text/csv' });
    FileSaver.saveAs(blob, `algo.csv`);
    // use indexPattern to transform hits to object similar to flatenned method

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
                    size="xs"
                    iconType="exportAction"
                    color="primary"
                    className="euiDataGrid__controlBtn"
                    onClick={onClickExport}>
                    Export Formated
                  </EuiButtonEmpty>
                ),
                showFullScreenSelector: false
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
