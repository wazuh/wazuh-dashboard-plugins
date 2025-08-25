import React from 'react';
import {
  SystemInventoryStatesDataSource,
  SystemInventoryHotfixesStatesDataSourceRepository,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import { withSystemInventoryHotfixesDataSource } from '../../../common/hocs/validate-system-inventory-index-pattern';
import { getOverviewPackagesHotfixesTab } from './dashboard';
import { InventoryDashboardTable } from '../../../../../common/dashboards';
import { WAZUH_SAMPLE_INVENTORY_AGENT } from '../../../../../../../common/constants';

export const ITHygienePackagesInventoryHotfixes =
  withSystemInventoryHotfixesDataSource(() => {
    return (
      <InventoryDashboardTable
        DataSource={SystemInventoryStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventoryHotfixesStatesDataSourceRepository
        }
        tableDefaultColumns={tableColumns}
        managedFilters={managedFilters}
        managedFiltersProps={{ style: { flexGrow: 0.25, minWidth: '300px' } }}
        getDashboardPanels={getOverviewPackagesHotfixesTab}
        tableId='it-hygiene-inventory-hotfixes'
        categoriesSampleData={[WAZUH_SAMPLE_INVENTORY_AGENT]}
      />
    );
  });
