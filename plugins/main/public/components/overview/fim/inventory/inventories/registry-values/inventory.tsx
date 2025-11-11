import React from 'react';
import {
  FIMRegistryValuesStatesDataSource,
  FIMRegistryValuesStatesDataSourceRepository,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import { withFIMRegistryValuesDataSource } from '../../../common/hocs/validate-fim-states-index-pattern';
import { InventoryDashboardTable } from '../../../../../common/dashboards';
import { WAZUH_SAMPLE_FILE_INTEGRITY_MONITORING, FIM_REGISTRY_VALUES_INVENTORY_ID, FIM_REGISTRY_VALUES_AGENT_INVENTORY_ID } from '../../../../../../../common/constants';
import { withAgent } from '../../../../../common/hocs/with-agent';

const InventoryFIMRegistryValuesComponent: React.FC = () => {
  return (
    <div style={{ margin: '0 12px' }}>
      <InventoryDashboardTable
        DataSource={FIMRegistryValuesStatesDataSource}
        DataSourceRepositoryCreator={FIMRegistryValuesStatesDataSourceRepository}
        tableDefaultColumns={tableColumns}
        managedFilters={managedFilters}
        getDashboardPanels={[{ dashboardId: FIM_REGISTRY_VALUES_INVENTORY_ID, agentDashboardId: FIM_REGISTRY_VALUES_AGENT_INVENTORY_ID }]}
        tableId='fim-registry-values-inventory'
        categoriesSampleData={[WAZUH_SAMPLE_FILE_INTEGRITY_MONITORING]}
      />
    </div>
  );
};

export const InventoryFIMRegistryValues = withAgent(
  withFIMRegistryValuesDataSource(InventoryFIMRegistryValuesComponent)
);
