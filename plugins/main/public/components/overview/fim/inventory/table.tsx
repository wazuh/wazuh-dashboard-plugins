import React from 'react';
import { DocumentViewTableAndJsonPropsAdditionalTabs } from '../../../common/wazuh-discover/components/document-view-table-and-json';
import { withErrorBoundary, withPanel } from '../../../common/hocs';
import { compose } from 'redux';
import { EnhancedTableUseParentDataSourceSearchBar } from '../../../common/wazuh-discover/table';

export interface WzTableDiscoverProps {
  dataSource: any;
  fetchFilters: any;
  searchBarProps: any;
  filters: any;
  setFilters: any;
  fetchData: any;
  fingerprint: any;
  isDataSourceLoading: any;
  tableDefaultColumns: tDataGridColumn[];
  createNewSearchContext?: CreateNewSearchContext;
  useAbsoluteDateRange?: boolean;
  displayOnlyNoResultsCalloutOnNoResults?: boolean;
  title?: React.ReactNode;
  inspectDetailsTitle?: string;
  additionalDocumentDetailsTabs?: DocumentViewTableAndJsonPropsAdditionalTabs;
}

export const WzTableUseParentDataSource = compose(
  withPanel({ paddingSize: 's', hasShadow: false, hasBorder: true }),
  withErrorBoundary,
)(
  ({
    dataSource,
    filters,
    fetchFilters,
    fixedFilters,
    isDataSourceLoading,
    fetchData,
    setFilters,
    searchBarProps,
    fingerprint,
    tableDefaultColumns,
    displayOnlyNoResultsCalloutOnNoResults,
    title,
    inspectDetailsTitle,
    additionalDocumentDetailsTabs,
    tableId,
  }) => (
    <EnhancedTableUseParentDataSourceSearchBar
      dataSource={dataSource}
      filters={filters}
      fetchFilters={fetchFilters}
      fixedFilters={fixedFilters}
      isDataSourceLoading={isDataSourceLoading}
      fetchData={fetchData}
      setFilters={setFilters}
      searchBarProps={searchBarProps}
      fingerprint={fingerprint}
      tableDefaultColumns={tableDefaultColumns}
      displayOnlyNoResultsCalloutOnNoResults={
        displayOnlyNoResultsCalloutOnNoResults
      }
      title={title}
      inspectDetailsTitle={inspectDetailsTitle}
      additionalDocumentDetailsTabs={additionalDocumentDetailsTabs}
      showSearchBar={false}
      tableId={tableId}
    />
  ),
);
