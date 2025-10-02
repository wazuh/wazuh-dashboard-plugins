import React from 'react';
import {
  SystemInventoryStatesDataSource,
  SystemInventoryServicesStatesDataSourceRepository,
} from '../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import { withSystemInventoryServicesDataSource } from '../common/hocs/validate-system-inventory-index-pattern';
import { getOverviewServicesTab } from './dashboard';
import { WAZUH_SAMPLE_INVENTORY_AGENT } from '../../../../../common/constants';
import { InventoryDashboardTable } from '../../../common/dashboards';

export const ITHygieneServicesInventory = withSystemInventoryServicesDataSource(
  () => {
    return (
      <InventoryDashboardTable
        DataSource={SystemInventoryStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventoryServicesStatesDataSourceRepository
        }
        tableDefaultColumns={tableColumns}
        managedFilters={managedFilters}
        managedFiltersProps={{ style: { flexGrow: 0.25, minWidth: '300px' } }}
        getDashboardPanels={getOverviewServicesTab}
        tableId='it-hygiene-inventory-services'
        categoriesSampleData={[WAZUH_SAMPLE_INVENTORY_AGENT]}
      />
    );
  },
);
