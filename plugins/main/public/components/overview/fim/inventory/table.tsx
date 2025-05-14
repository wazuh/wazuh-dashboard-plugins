import React from 'react';
import { withErrorBoundary, withPanel } from '../../../common/hocs';
import { compose } from 'redux';
import { TableDataGridWithSearchBarInspectedHitFetchData } from '../../../common/wazuh-discover/table';

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
    <TableDataGridWithSearchBarInspectedHitFetchData
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
