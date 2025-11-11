import React from 'react';
import {
  SystemInventoryStatesDataSource,
  SystemInventoryGroupsStatesDataSourceRepository,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import { withSystemInventoryGroupsDataSource } from '../../../common/hocs/validate-system-inventory-index-pattern';
import { InventoryDashboardTable } from '../../../../../common/dashboards';
import { WAZUH_SAMPLE_INVENTORY_AGENT, IT_HYGIENE_GROUPS_INVENTORY_ID, IT_HYGIENE_GROUPS_AGENT_INVENTORY_ID } from '../../../../../../../common/constants';
import { withAgent } from '../hocs';

export const ITHygieneUsersInventoryGroups = withAgent(
  withSystemInventoryGroupsDataSource(() => {
  return (
    <div style={{ margin: '0 12px' }}>
      <InventoryDashboardTable
        DataSource={SystemInventoryStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventoryGroupsStatesDataSourceRepository
        }
        tableDefaultColumns={tableColumns}
        managedFilters={managedFilters}
        getDashboardPanels={[
          {
            dashboardId: IT_HYGIENE_GROUPS_INVENTORY_ID,
            agentDashboardId: IT_HYGIENE_GROUPS_AGENT_INVENTORY_ID,
          },
        ]}
        tableId='it-hygiene-inventory-groups'
        categoriesSampleData={[WAZUH_SAMPLE_INVENTORY_AGENT]}
      />
    </div>
  );
  })
);
