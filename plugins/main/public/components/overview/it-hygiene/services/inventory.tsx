import React from 'react';
import {
  SystemInventoryStatesDataSource,
  SystemInventoryServicesStatesDataSourceRepository,
} from '../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import { withSystemInventoryServicesDataSource } from '../common/hocs/validate-system-inventory-index-pattern';
import {
  WAZUH_SAMPLE_INVENTORY_AGENT,
  IT_HYGIENE_SERVICES_INVENTORY_ID,
  IT_HYGIENE_SERVICES_AGENT_INVENTORY_ID,
} from '../../../../../common/constants';
import { ITHygieneInventoryTable } from '../components/inventory-table/it-hygiene-inventory-table';

export const ITHygieneServicesInventory = withSystemInventoryServicesDataSource(
  () => {
    return (
      <ITHygieneInventoryTable
        DataSource={SystemInventoryStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventoryServicesStatesDataSourceRepository
        }
        tableDefaultColumns={tableColumns}
        managedFilters={managedFilters}
        managedFiltersProps={{ style: { flexGrow: 0.25, minWidth: '300px' } }}
        getDashboardPanels={[
          {
            dashboardId: IT_HYGIENE_SERVICES_INVENTORY_ID,
            agentDashboardId: IT_HYGIENE_SERVICES_AGENT_INVENTORY_ID,
          },
        ]}
        tableId='it-hygiene-inventory-services'
        categoriesSampleData={[WAZUH_SAMPLE_INVENTORY_AGENT]}
      />
    );
  },
);
