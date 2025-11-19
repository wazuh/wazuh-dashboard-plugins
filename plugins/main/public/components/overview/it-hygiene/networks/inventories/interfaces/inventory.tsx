import React from 'react';
import {
  SystemInventoryStatesDataSource,
  SystemInventoryInterfacesStatesDataSourceRepository,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import { withSystemInventoryInterfacesDataSource } from '../../../common/hocs/validate-system-inventory-index-pattern';
import { InventoryDashboardTable } from '../../../../../common/dashboards';
import {
  WAZUH_SAMPLE_INVENTORY_AGENT,
  IT_HYGIENE_INTERFACES_INVENTORY_ID,
  IT_HYGIENE_INTERFACES_AGENT_INVENTORY_ID,
} from '../../../../../../../common/constants';

export const ITHygieneNetworksInventoryInterfaces =
  withSystemInventoryInterfacesDataSource(() => {
    return (
      <InventoryDashboardTable
        DataSource={SystemInventoryStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventoryInterfacesStatesDataSourceRepository
        }
        tableDefaultColumns={tableColumns}
        managedFilters={managedFilters}
        getDashboardPanels={[
          {
            dashboardId: IT_HYGIENE_INTERFACES_INVENTORY_ID,
            agentDashboardId: IT_HYGIENE_INTERFACES_AGENT_INVENTORY_ID,
          },
        ]}
        tableId='it-hygiene-inventory-interfaces'
        categoriesSampleData={[WAZUH_SAMPLE_INVENTORY_AGENT]}
      />
    );
  });
