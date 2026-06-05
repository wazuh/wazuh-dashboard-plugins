import React from 'react';
import {
  SystemInventoryStatesDataSource,
  SystemInventorySystemStatesDataSourceRepository,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import { withSystemInventorySystemDataSource } from '../../../common/hocs/validate-system-inventory-index-pattern';
import {
  WAZUH_SAMPLE_INVENTORY_AGENT,
  IT_HYGIENE_SYSTEM_INVENTORY_ID,
  IT_HYGIENE_SYSTEM_AGENT_INVENTORY_ID,
} from '../../../../../../../common/constants';
import { InventoryDashboardTable } from '../../../../../common/dashboards';

export const ITHygieneSystemInventorySystem =
  withSystemInventorySystemDataSource(() => {
    return (
      <InventoryDashboardTable
        DataSource={SystemInventoryStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventorySystemStatesDataSourceRepository
        }
        tableDefaultColumns={tableColumns}
        managedFilters={managedFilters}
        getDashboardPanels={[
          {
            dashboardId: IT_HYGIENE_SYSTEM_INVENTORY_ID,
            agentDashboardId: IT_HYGIENE_SYSTEM_AGENT_INVENTORY_ID,
          },
        ]}
        tableId='it-hygiene-inventory-system'
        categoriesSampleData={[WAZUH_SAMPLE_INVENTORY_AGENT]}
      />
    );
  });
