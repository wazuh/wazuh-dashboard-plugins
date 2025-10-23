import React from 'react';
import {
  SystemInventoryStatesDataSource,
  SystemInventoryBrowserExtensionsStatesDataSourceRepository,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import { withSystemInventoryBrowserExtensionsDataSource } from '../../../common/hocs/validate-system-inventory-index-pattern';
import { ITHygieneInventoryDashboardTable } from '../../../common/components/inventory';
import { getOverviewBrowserExtensionsTab } from './dashboard';

export const ITHygienePackagesInventoryWebBrowsers =
  withSystemInventoryBrowserExtensionsDataSource(props => {
    return (
      <ITHygieneInventoryDashboardTable
        DataSource={SystemInventoryStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventoryBrowserExtensionsStatesDataSourceRepository
        }
        tableDefaultColumns={tableColumns}
        managedFilters={managedFilters}
        getDashboardPanels={getOverviewBrowserExtensionsTab}
        tableId='it-hygiene-inventory-browser-extensions'
        indexPattern={props.indexPattern}
      />
    );
  });
