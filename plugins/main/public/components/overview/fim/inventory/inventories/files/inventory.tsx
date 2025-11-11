import React from 'react';
import {
  FIMFilesStatesDataSource,
  FIMFilesStatesDataSourceRepository,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import { withFIMFilesDataSource } from '../../../common/hocs/validate-fim-states-index-pattern';
import { InventoryDashboardTable } from '../../../../../common/dashboards';
import {
  WAZUH_SAMPLE_FILE_INTEGRITY_MONITORING,
  FIM_FILES_INVENTORY_ID,
  FIM_FILES_AGENT_INVENTORY_ID,
} from '../../../../../../../common/constants';
import { withAgent } from '../../../../../common/hocs/with-agent';

const InventoryFIMFilesComponent: React.FC = () => {
  return (
    <div style={{ margin: '0 12px' }}>
      <InventoryDashboardTable
        DataSource={FIMFilesStatesDataSource}
        DataSourceRepositoryCreator={FIMFilesStatesDataSourceRepository}
        tableDefaultColumns={tableColumns}
        managedFilters={managedFilters}
        getDashboardPanels={[
          {
            dashboardId: FIM_FILES_INVENTORY_ID,
            agentDashboardId: FIM_FILES_AGENT_INVENTORY_ID,
          },
        ]}
        tableId='fim-files-inventory'
        categoriesSampleData={[WAZUH_SAMPLE_FILE_INTEGRITY_MONITORING]}
      />
    </div>
  );
};

export const InventoryFIMFiles = withAgent(
  withFIMFilesDataSource(InventoryFIMFilesComponent),
);
