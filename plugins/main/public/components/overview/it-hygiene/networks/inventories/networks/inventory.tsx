import React from 'react';
import {
  SystemInventoryStatesDataSource,
  SystemInventoryNetworksStatesDataSourceRepository,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import { withSystemInventoryNetworksDataSource } from '../../../common/hocs/validate-system-inventory-index-pattern';
import { ITHygieneInventoryTable } from '../../../components/inventory-table/it-hygiene-inventory-table';
import {
  WAZUH_SAMPLE_INVENTORY_AGENT,
  IT_HYGIENE_NETWORKS_INVENTORY_ID,
  IT_HYGIENE_NETWORKS_AGENT_INVENTORY_ID,
} from '../../../../../../../common/constants';

export const ITHygieneNetworksInventoryNetworks =
  withSystemInventoryNetworksDataSource(() => {
    return (
      <ITHygieneInventoryTable
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
