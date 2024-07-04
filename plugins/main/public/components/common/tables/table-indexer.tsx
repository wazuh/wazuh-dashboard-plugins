import React, { useEffect, useMemo, useState } from 'react';
import { IntlProvider } from 'react-intl';
import {
  EuiToolTip,
  EuiButtonIcon,
  EuiDataGridCellValueElementProps,
  EuiFlexGroup,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiTitle,
  EuiBasicTable,
  EuiFlexItem,
} from '@elastic/eui';
import { SearchResponse } from '../../../../../../src/core/server';
import { HitsCounter } from '../../../kibana-integrations/discover/application/components/hits_counter/hits_counter';
import { formatNumWithCommas } from '../../../kibana-integrations/discover/application/helpers';
import { getWazuhCorePlugin } from '../../../kibana-services';
import {
  ErrorHandler,
  ErrorFactory,
  HttpError,
} from '../../../react-services/error-management';
// import './inventory.scss';
// import { MAX_ENTRIES_PER_QUERY, inventoryTableDefaultColumns } from './config';
import { DiscoverNoResults } from '../no-results/no-results';
import { LoadingSpinner } from '../loading-spinner/loading-spinner';
// common components/hooks
import useSearchBar from '../../common/search-bar/use-search-bar';
import { useDataGrid } from '../../common/data-grid/use-data-grid';
import { useDocViewer } from '../../common/doc-viewer/use-doc-viewer';
import { withErrorBoundary } from '../../common/hocs';
import { exportSearchToCSV } from '../../common/data-grid/data-grid-service';

import {
  tParsedIndexPattern,
  PatternDataSource,
} from '../../common/data-source';
import { useDataSource } from '../../common/data-source/hooks';
import { IndexPattern } from '../../../../../src/plugins/data/public';
import { DocumentViewTableAndJson } from '../wazuh-discover/components/document-view-table-and-json';
import { wzDiscoverRenderColumns } from '../wazuh-discover/render-columns';
import { WzSearchBar } from '../../common/search-bar';
import { MAX_ENTRIES_PER_QUERY } from '../wazuh-discover/wz-flyout-discover';

type TDocumentDetailsTab = {
  id: string;
  name: string;
  content: any;
};

export const TableIndexer = ({
  DataSource,
  DataSourceRepository,
  columns: defaultColumns,
  documentDetailsExtraTabs = [],
  tableSortingInitialField = '',
  tableSortingInitialDirection = '',
  topTableComponent
}: {
  DataSource: any;
  DataSourceRepository;
  columns: any;
  documentDetailsExtraTabs?:
  | TDocumentDetailsTab[]
  | (({ document: any, indexPattern: any }) => TDocumentDetailsTab[]);
  tableSortingInitialField?: string;
  tableSortingInitialDirection?: string;
  topTableComponent?: React.ReactNode;
}) => {
  const {
    dataSource,
    filters,
    fetchFilters,
    isLoading: isDataSourceLoading,
    fetchData,
    setFilters,
  } = useDataSource<tParsedIndexPattern, PatternDataSource>({
    DataSource: DataSource,
    repository: new DataSourceRepository(),
  });
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15,
  });

  const [sorting, setSorting] = useState({
    sort: {
      field: tableSortingInitialField,
      direction: tableSortingInitialDirection,
    },
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
    const inspectHintMsg = 'Inspect details';
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

  // const dataGridProps = useDataGrid({
  //   ariaLabelledBy: 'Table',
  //   defaultColumns: defaultColumns,
  //   renderColumns: wzDiscoverRenderColumns,
  //   results,
  //   indexPattern: indexPattern as IndexPattern,
  //   DocViewInspectButton,
  // });

  // const { pagination, sorting, columnVisibility } = dataGridProps;

  // const docViewerProps = useDocViewer({
  //   doc: inspectedHit,
  //   indexPattern: indexPattern as IndexPattern,
  // });

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
    fetchData({
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
    })
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
    JSON.stringify(fetchFilters),
    JSON.stringify(query),
    JSON.stringify(pagination),
    JSON.stringify(sorting),
  ]);

  function tableOnChange({ page = {}, sort = {} }) {
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

  const tablePagination = {
    ...pagination,
    totalItemCount: results?.hits?.total,
    pageSizeOptions: [15, 25, 50, 100],
    hidePerPageOptions: false,
  };

  const getRowProps = item => {
    return {
      'data-test-subj': `row-${item.id}`,
      onClick: () => {
        setInspectedHit(
          results.hits.hits.find(({ _source }) => _source.id === item.id),
        );
      },
    };
  };
  return (
    <IntlProvider locale='en'>
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
        {topTableComponent}
        <EuiFlexItem>
          <EuiBasicTable
            columns={defaultColumns.map(({ show, ...rest }) => ({ ...rest }))}
            items={results?.hits?.hits?.map(({ _source }) => _source) || []}
            loading={isDataSourceLoading}
            pagination={tablePagination}
            sorting={sorting}
            onChange={tableOnChange}
          // rowProps={getRowProps}
          // {...tableProps}
          />
        </EuiFlexItem>
        {inspectedHit && (
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
                  indexPattern={indexPattern}
                  extraTabs={documentDetailsExtraTabs}
                />
              </EuiFlexGroup>
            </EuiFlyoutBody>
          </EuiFlyout>
        )}
      </EuiFlexGroup>
    </IntlProvider>
  );
};
