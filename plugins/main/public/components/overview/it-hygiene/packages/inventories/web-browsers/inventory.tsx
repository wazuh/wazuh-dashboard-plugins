import React from 'react';
import {
  SystemInventoryStatesDataSource,
  SystemInventoryBrowserExtensionsStatesDataSourceRepository,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import { withSystemInventoryBrowserExtensionsDataSource } from '../../../common/hocs/validate-system-inventory-index-pattern';
import { getOverviewBrowserExtensionsTab } from './dashboard';
import { InventoryDashboardTable } from '../../../common/dashboards';
import { WAZUH_SAMPLE_INVENTORY_AGENT } from '../../../../../common/constants';

export const ITHygieneBrowserExtensionsInventory =
  withSystemInventoryBrowserExtensionsDataSource(() => {
    return (
      <InventoryDashboardTable
        DataSource={SystemInventoryStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventoryBrowserExtensionsStatesDataSourceRepository
        }
        tableDefaultColumns={tableColumns}
        managedFilters={managedFilters}
        getDashboardPanels={getOverviewBrowserExtensionsTab}
        tableId='it-hygiene-inventory-browser-extensions'
        categoriesSampleData={[WAZUH_SAMPLE_INVENTORY_AGENT]}
      />
    );
  });
