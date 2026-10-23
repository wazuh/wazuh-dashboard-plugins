import React from 'react';
import {
  SystemInventoryStatesDataSource,
  SystemInventoryHotfixesStatesDataSourceRepository,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import { withSystemInventoryHotfixesDataSource } from '../../../common/hocs/validate-system-inventory-index-pattern';
import { ITHygieneInventoryTable } from '../../../components/inventory-table/it-hygiene-inventory-table';
import {
  WAZUH_SAMPLE_INVENTORY_AGENT,
  IT_HYGIENE_HOTFIXES_INVENTORY_ID,
  IT_HYGIENE_HOTFIXES_AGENT_INVENTORY_ID,
} from '../../../../../../../common/constants';

export const ITHygienePackagesInventoryHotfixes =
  withSystemInventoryHotfixesDataSource(() => {
    return (
      <ITHygieneInventoryTable
        DataSource={SystemInventoryStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventoryHotfixesStatesDataSourceRepository
        }
        tableDefaultColumns={tableColumns}
        managedFilters={managedFilters}
        managedFiltersProps={{ style: { flexGrow: 0.25, minWidth: '300px' } }}
        getDashboardPanels={[
          {
            dashboardId: IT_HYGIENE_HOTFIXES_INVENTORY_ID,
            agentDashboardId: IT_HYGIENE_HOTFIXES_AGENT_INVENTORY_ID,
          },
        ]}
        tableId='it-hygiene-inventory-hotfixes'
        categoriesSampleData={[WAZUH_SAMPLE_INVENTORY_AGENT]}
      />
    );
  });
