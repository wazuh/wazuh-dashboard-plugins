import React from 'react';
import {
  SystemInventoryStatesDataSource,
  SystemInventoryProcessesStatesDataSourceRepository,
} from '../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import { withSystemInventoryProcessesDataSource } from '../common/hocs/validate-system-inventory-index-pattern';
import { WAZUH_SAMPLE_INVENTORY_AGENT, IT_HYGIENE_PROCESSES_INVENTORY_ID, IT_HYGIENE_PROCESSES_AGENT_INVENTORY_ID } from '../../../../../common/constants';
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
        getDashboardPanels={[
          {
            dashboardId: IT_HYGIENE_PROCESSES_INVENTORY_ID,
            agentDashboardId: IT_HYGIENE_PROCESSES_AGENT_INVENTORY_ID,
          },
        ]}
        tableId='it-hygiene-inventory-processes'
        categoriesSampleData={[WAZUH_SAMPLE_INVENTORY_AGENT]}
      />
    );
  });
