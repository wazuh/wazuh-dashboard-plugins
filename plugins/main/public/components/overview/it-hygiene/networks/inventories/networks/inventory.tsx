import React from 'react';
import {
  SystemInventoryStatesDataSource,
  SystemInventoryNetworksStatesDataSourceRepository,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import { withSystemInventoryNetworksDataSource } from '../../../common/hocs/validate-system-inventory-index-pattern';
import { InventoryDashboardTable } from '../../../../../common/dashboards';
import { WAZUH_SAMPLE_INVENTORY_AGENT, IT_HYGIENE_NETWORKS_INVENTORY_ID, IT_HYGIENE_NETWORKS_AGENT_INVENTORY_ID } from '../../../../../../../common/constants';

export const ITHygieneNetworksInventoryNetworks =
  withSystemInventoryNetworksDataSource(() => {
    return (
      <InventoryDashboardTable
        DataSource={SystemInventoryStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventoryNetworksStatesDataSourceRepository
        }
        tableDefaultColumns={tableColumns}
        managedFilters={managedFilters}
        getDashboardPanels={[
          {
            dashboardId: IT_HYGIENE_NETWORKS_INVENTORY_ID,
            agentDashboardId: IT_HYGIENE_NETWORKS_AGENT_INVENTORY_ID,
          },
        ]}
        tableId='it-hygiene-inventory-networks'
        categoriesSampleData={[WAZUH_SAMPLE_INVENTORY_AGENT]}
      />
    );
  });
