import React from 'react';
import {
  SystemInventoryStatesDataSource,
  SystemInventoryProcessesStatesDataSourceRepository,
} from '../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import { withSystemInventoryProcessesDataSource } from '../common/hocs/validate-system-inventory-index-pattern';
import { getOverviewProcessesProcessesTab } from './dashboard';
import { WAZUH_SAMPLE_INVENTORY_AGENT } from '../../../../../common/constants';
import { InventoryDashboardTable } from '../../../common/dashboards';

export const ITHygieneProcessesInventory =
  withSystemInventoryProcessesDataSource(() => {
    return (
      <InventoryDashboardTable
        DataSource={SystemInventoryStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventoryProcessesStatesDataSourceRepository
        }
        tableDefaultColumns={tableColumns}
        managedFilters={managedFilters}
        getDashboardPanels={getOverviewProcessesProcessesTab}
        tableId='it-hygiene-inventory-processes'
        categoriesSampleData={[WAZUH_SAMPLE_INVENTORY_AGENT]}
      />
    );
  });
