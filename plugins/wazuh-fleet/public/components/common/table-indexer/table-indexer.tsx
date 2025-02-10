import React, { useEffect, useState } from 'react';
import {
  // EuiToolTip,
  // EuiButtonIcon,
  // EuiDataGridCellValueElementProps,
  EuiFlexGroup,
  // EuiFlyout,
  // EuiFlyoutBody,
  // EuiFlyoutHeader,
  // EuiTitle,
  EuiBasicTable,
  EuiFlexItem,
} from '@elastic/eui';
import { SearchResponse } from '../../../../../../src/core/server';
// import { getWazuhCorePlugin } from '../../../kibana-services';
// import {
//   ErrorHandler,
//   ErrorFactory,
//   HttpError,
// } from '../../../react-services/error-management';
// common components/hooks
// import { agentsTableColumns } from '../../agents/list/columns';
import useSearchBar from './components/search-bar/use-search-bar';
// import { IndexPattern } from '../../../../../src/plugins/data/public';
// import { DocumentViewTableAndJson } from './components/document-view/document-view-table-and-json';
import { WzSearchBar } from './components/search-bar/search-bar';
import { LoadingSpinner } from './components/loading-spinner/loading-spinner';
// import { useDataSource } from '../../common/data-source/hooks';
// import {
//   tParsedIndexPattern,
//   PatternDataSource,
// } from '../../common/data-source';
import { search } from './components/search-bar/search-bar-service';
// import { Agent } from '../../../../common/types';

interface TDocumentDetailsTab {
  id: string;
  name: string;
  content: any;
}

export const TableIndexer = (props: {
  indexPatterns: any;
  columns: any;
  documentDetailsExtraTabs?:
    | TDocumentDetailsTab[]
    | (({ document: any, indexPattern: any }) => TDocumentDetailsTab[]);
  tableSortingInitialField?: string;
  tableSortingInitialDirection?: string;
  topTableComponent?: (searchBarProps: any) => React.ReactNode;
  tableProps?: any;
}) => {
  const {
    indexPatterns,
    columns,
    tableSortingInitialField,
    tableSortingInitialDirection,
    topTableComponent,
    tableProps,
    // documentDetailsExtraTabs,
  } = props;
  // const {
  //   dataSource,
  //   filters,
  //   fetchFilters,
  //   isLoading: isDataSourceLoading,
  //   fetchData,
  //   setFilters,
  // } = useDataSource<tParsedIndexPattern, PatternDataSource>({
  //   DataSource: DataSource,
  //   repository: new DataSourceRepository(),
  // });
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15,
  });
  const [sorting, setSorting] = useState({
    sort: {
      field: tableSortingInitialField || '_id',
      direction: tableSortingInitialDirection || 'desc',
    },
  });
  const { searchBarProps } = useSearchBar({
    indexPattern: indexPatterns,
    filters: [],
    setFilters: [],
  });
  const { query } = searchBarProps;
  const [results, setResults] = useState<SearchResponse>({} as SearchResponse);
  // const [inspectedHit, setInspectedHit] = useState<any>();
  // const [indexPattern, setIndexPattern] = useState<IndexPattern | undefined>(
  //   indexPattern,
  // );
  // const [isExporting, setIsExporting] = useState<boolean>(false);

  // const sideNavDocked = getWazuhCorePlugin().hooks.useDockedSideNav();

  // const onClickInspectDoc = useMemo(
  //   () => (index: number) => {
  //     const rowClicked = results.hits.hits[index];
  //     setInspectedHit(rowClicked);
  //   },
  //   [results],
  // );

  // const DocViewInspectButton = ({
  //   rowIndex,
  // }: EuiDataGridCellValueElementProps) => {
  //   const inspectHintMsg = 'Inspect details';

  //   return (
  //     <EuiToolTip content={inspectHintMsg}>
  //       <EuiButtonIcon
  //         onClick={() => onClickInspectDoc(rowIndex)}
  //         iconType='inspect'
  //         aria-label={inspectHintMsg}
  //       />
  //     </EuiToolTip>
  //   );
  // };

  // // const dataGridProps = useDataGrid({
  // //   ariaLabelledBy: 'Table',
  // //   defaultColumns: defaultColumns,
  // //   renderColumns: wzDiscoverRenderColumns,
  // //   results,
  // //   indexPattern: indexPattern as IndexPattern,
  // //   DocViewInspectButton,
  // // });

  // // const { pagination, sorting, columnVisibility } = dataGridProps;

  // // const docViewerProps = useDocViewer({
  // //   doc: inspectedHit,
  // //   indexPattern: indexPattern as IndexPattern,
  // // });

  // // const onClickExportResults = async () => {
  // //   const params = {
  // //     indexPattern: indexPattern as IndexPattern,
  // //     filters: fetchFilters,
  // //     query,
  // //     fields: columnVisibility.visibleColumns,
  // //     pagination: {
  // //       pageIndex: 0,
  // //       pageSize: results.hits.total,
  // //     },
  // //     sorting,
  // //   };
  // //   try {
  // //     setIsExporting(true);
  // //     await exportSearchToCSV(params);
  // //   } catch (error) {
  // //     const searchError = ErrorFactory.create(HttpError, {
  // //       error,
  // //       message: 'Error downloading csv report',
  // //     });
  // //     ErrorHandler.handleError(searchError);
  // //   } finally {
  // //     setIsExporting(false);
  // //   }
  // // };

  useEffect(() => {
    if (!indexPatterns) {
      return;
    }

    search({
      indexPattern: indexPatterns[0],
      query,
      pagination,
      sorting: {
        columns: [
          {
            id: sorting.sort.field,
            direction: sorting.sort.direction,
          },
        ],
      },
      filePrefix: '',
    })
      .then(results => {
        setResults(results);
      })
      .catch(error => {
        console.log(error);
      });
  }, [
    props.indexPatterns,
    JSON.stringify(query),
    JSON.stringify(pagination),
    JSON.stringify(sorting),
  ]);

  function tableOnChange({
    page,
    sort,
  }: {
    page: { index: number; size: number };
    sort: { field: string; direction: string };
  }) {
    const { index: pageIndex, size: pageSize } = page;
    const { field, direction } = sort;

    setPagination({
      pageIndex,
      pageSize,
    });
    setSorting({
      sort: {
        field,
        direction,
      },
    });
  }

  const isDataSourceLoading = false;
  const tablePagination = {
    ...pagination,
    totalItemCount: results?.total || 0,
    pageSizeOptions: [15, 25, 50, 100],
    hidePerPageOptions: false,
  };
  const getRowProps = item => ({
    'data-test-subj': `row-${item.id}`,
    onClick: () => {
      // setInspectedHit(
      //   results.hits.hits.find(({ _source }) => _source.id === item.id),
      // );
    },
  });

  return (
    <EuiFlexGroup direction='column' gutterSize='m'>
      <EuiFlexItem>
        {isDataSourceLoading ? (
          <LoadingSpinner />
        ) : (
          <WzSearchBar
            appName='search'
            {...searchBarProps}
            showDatePicker={false}
            showQueryInput={true}
            showQueryBar={true}
            showSaveQuery={true}
          />
        )}
      </EuiFlexItem>
      {topTableComponent(searchBarProps)}
      <EuiFlexItem>
        {Array.isArray(results?.hits?.hits) && results.hits.hits.length > 0 && (
          <EuiBasicTable
            columns={columns}
            items={results.hits.hits.map((item: any) => item._source) ?? []}
            loading={false}
            pagination={tablePagination}
            sorting={sorting}
            onChange={tableOnChange}
            rowProps={getRowProps}
            {...tableProps}
          />
        )}
      </EuiFlexItem>
      {/* {inspectedHit && (
        <EuiFlyout onClose={() => setInspectedHit(undefined)} size='m'>
          <EuiFlyoutHeader>
            <EuiTitle>
              <h2>Details</h2>
            </EuiTitle>
          </EuiFlyoutHeader>
          <EuiFlyoutBody>
            <EuiFlexGroup direction='column'>
              <DocumentViewTableAndJson
                document={inspectedHit}
                indexPattern={indexPatterns}
                extraTabs={documentDetailsExtraTabs}
              />
            </EuiFlexGroup>
          </EuiFlyoutBody>
        </EuiFlyout>
      )} */}
    </EuiFlexGroup>
  );
};
