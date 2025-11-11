import React from 'react';
import {
  FIMRegistryKeysStatesDataSource,
  FIMRegistryKeysStatesDataSourceRepository,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import { withFIMRegistryKeysDataSource } from '../../../common/hocs/validate-fim-states-index-pattern';
import { InventoryDashboardTable } from '../../../../../common/dashboards';
import { WAZUH_SAMPLE_FILE_INTEGRITY_MONITORING, FIM_REGISTRY_KEYS_INVENTORY_ID, FIM_REGISTRY_KEYS_AGENT_INVENTORY_ID } from '../../../../../../../common/constants';
import { withAgent } from '../../../../../common/hocs/with-agent';

const InventoryFIMRegistryKeysComponent: React.FC = () => {
  return (
    <div style={{ margin: '0 12px' }}>
      <InventoryDashboardTable
        DataSource={FIMRegistryKeysStatesDataSource}
        DataSourceRepositoryCreator={FIMRegistryKeysStatesDataSourceRepository}
        tableDefaultColumns={tableColumns}
        managedFilters={managedFilters}
        getDashboardPanels={[{ dashboardId: FIM_REGISTRY_KEYS_INVENTORY_ID, agentDashboardId: FIM_REGISTRY_KEYS_AGENT_INVENTORY_ID }]}
        tableId='fim-registry-keys-inventory'
        categoriesSampleData={[WAZUH_SAMPLE_FILE_INTEGRITY_MONITORING]}
      />
    </div>
  );
};

export const InventoryFIMRegistryKeys = withAgent(
  withFIMRegistryKeysDataSource(InventoryFIMRegistryKeysComponent)
);
