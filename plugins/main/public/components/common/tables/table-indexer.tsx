import React from 'react';
import { IntlProvider } from 'react-intl';
import { EuiButtonEmpty, EuiFlexItem } from '@elastic/eui';
import {
  ErrorHandler,
  ErrorFactory,
  HttpError,
} from '../../../react-services/error-management';
import { LoadingSpinner } from '../loading-spinner/loading-spinner';
// common components/hooks
import useSearchBar from '../../common/search-bar/use-search-bar';
import { exportSearchToCSV } from '../../common/data-grid/data-grid-service';

import {
  tParsedIndexPattern,
  PatternDataSource,
} from '../../common/data-source';
import { useDataSource } from '../../common/data-source/hooks';
import { IndexPattern } from '../../../../../src/plugins/data/public';
import { WzSearchBar } from '../../common/search-bar';
import { TableData } from './table-data';

export const TableIndexer = ({
  DataSource,
  DataSourceRepository,
  exportCSVPrefixFilename = '',
  tableProps = {},
  onSetIndexPattern,
}: {
  DataSource: any;
  DataSourceRepository;
  onSetIndexPattern: () => void;
  exportCSVPrefixFilename: string;
  tableProps: any; // TODO: use props of TableData?
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

  const { searchBarProps } = useSearchBar({
    indexPattern: dataSource?.indexPattern as IndexPattern,
    filters,
    setFilters,
  });
  const { query } = searchBarProps;

  const onClickExportResults = async ({
    dataSource,
    tableColumns,
    sorting,
    totalItems,
    searchParams,
    filePrefix,
  }) => {
    const params = {
      indexPattern: dataSource.indexPattern as IndexPattern,
      filters: searchParams.fetchFilters,
      query: searchParams.query,
      fields: tableColumns.map(({ field }) => field).filter(value => value),
      pagination: {
        pageIndex: 0,
        pageSize: totalItems,
      },
      sorting,
      filePrefix,
    };
    try {
      await exportSearchToCSV(params);
    } catch (error) {
      const searchError = ErrorFactory.create(HttpError, {
        error,
        message: 'Error downloading csv report',
      });
      ErrorHandler.handleError(searchError);
    }
  };

  React.useEffect(() => {
    if (dataSource?.indexPattern) {
      onSetIndexPattern && onSetIndexPattern(dataSource?.indexPattern);
    }
  }, [dataSource?.indexPattern]);

  const { postActionButtons, ...restTableProps } = tableProps;

  const enhancedPostActionButtons = function (props) {
    return (
      <>
        {postActionButtons && (
          <EuiFlexItem>{postActionButtons(props)}</EuiFlexItem>
        )}
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty
            isDisabled={props.totalItems == 0}
            iconType='importAction'
            onClick={() =>
              onClickExportResults({
                ...props,
                dataSource,
                filePrefix: exportCSVPrefixFilename,
              })
            }
          >
            Export formatted
          </EuiButtonEmpty>
        </EuiFlexItem>
      </>
    );
  };

  const getRowProps = item => {
    return {
      onClick: () => {
        setInspectedHit(item._document);
      },
    };
  };

  return (
    <IntlProvider locale='en'>
      <>
        {isDataSourceLoading ? (
          <LoadingSpinner />
        ) : (
          <TableData
            {...restTableProps}
            postActionButtons={enhancedPostActionButtons}
            preTable={
              <WzSearchBar
                appName='search'
                {...searchBarProps}
                showDatePicker={false}
                showQueryInput={true}
                showQueryBar={true}
                showSaveQuery={true}
              />
            }
            saveStateStorage={{
              system: 'localStorage',
              key: 'wz-engine:rules-main',
            }}
            showFieldSelector
            // rowProps={getRowProps}
            fetchData={({ pagination, sorting, searchParams: { query } }) => {
              return fetchData({
                query,
                pagination,
                sorting: {
                  columns: [
                    {
                      id: sorting.field,
                      direction: sorting.direction,
                    },
                  ],
                },
              })
                .then(results => {
                  return {
                    items: results.hits.hits.map(document => ({
                      _document: document,
                      ...document._source,
                    })),
                    totalItems: results.hits.total,
                  };
                })
                .catch(error => {
                  const searchError = ErrorFactory.create(HttpError, {
                    error,
                    message: 'Error fetching data',
                  });
                  ErrorHandler.handleError(searchError);
                });
            }}
            fetchParams={{ query, fetchFilters }}
          />
        )}
      </>
    </IntlProvider>
  );
};
