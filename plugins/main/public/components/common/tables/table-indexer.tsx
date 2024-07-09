import React, { useState } from 'react';
import { IntlProvider } from 'react-intl';
import {
  EuiFlexGroup,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiTitle,
  EuiButtonEmpty,
  EuiFlexItem,
} from '@elastic/eui';
import { getWazuhCorePlugin } from '../../../kibana-services';
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
import { DocumentViewTableAndJson } from '../wazuh-discover/components/document-view-table-and-json';
import { WzSearchBar } from '../../common/search-bar';
import { TableData } from './table-data';

type TDocumentDetailsTab = {
  id: string;
  name: string;
  content: any;
};

export const TableIndexer = ({
  DataSource,
  DataSourceRepository,
  documentDetailsExtraTabs,
  exportCSVPrefixFilename = '',
  tableProps = {},
}: {
  DataSource: any;
  DataSourceRepository;
  documentDetailsExtraTabs?: {
    pre?:
      | TDocumentDetailsTab[]
      | (({ document: any, indexPattern: any }) => TDocumentDetailsTab[]);
    post?:
      | TDocumentDetailsTab[]
      | (({ document: any, indexPattern: any }) => TDocumentDetailsTab[]);
  };
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

  const [indexPattern, setIndexPattern] = useState<IndexPattern | undefined>(
    undefined,
  );
  const [inspectedHit, setInspectedHit] = useState<any | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const sideNavDocked = getWazuhCorePlugin().hooks.useDockedSideNav();

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
              setIndexPattern(dataSource?.indexPattern);

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
        {inspectedHit && (
          <EuiFlyout onClose={() => setInspectedHit(null)} size='m'>
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
                  tableProps={{
                    onFilter(...rest) {
                      // TODO: implement using the dataSource
                    },
                    onToggleColumn() {
                      // TODO: reseach if make sense the ability to toggle columns
                    },
                  }}
                />
              </EuiFlexGroup>
            </EuiFlyoutBody>
          </EuiFlyout>
        )}
      </>
    </IntlProvider>
  );
};
