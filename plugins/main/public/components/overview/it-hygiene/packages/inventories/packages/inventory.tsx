import React from 'react';
import {
  SystemInventoryStatesDataSource,
  SystemInventoryPackagesStatesDataSourceRepository,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import { withSystemInventoryPackagesDataSource } from '../../../common/hocs/validate-system-inventory-index-pattern';
import { getOverviewPackagesPackagesTab } from './dashboard';
import { InventoryDashboardTable } from '../../../../../common/dashboards';
import { WAZUH_SAMPLE_INVENTORY_AGENT } from '../../../../../../../common/constants';

export const ITHygienePackagesInventoryPackages =
  withSystemInventoryPackagesDataSource(() => {
    return (
      <InventoryDashboardTable
        DataSource={SystemInventoryStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventoryPackagesStatesDataSourceRepository
        }
        tableDefaultColumns={tableColumns}
        managedFilters={managedFilters}
        getDashboardPanels={getOverviewPackagesPackagesTab}
        tableId='it-hygiene-inventory-packages'
        categoriesSampleData={[WAZUH_SAMPLE_INVENTORY_AGENT]}
      />
    );
  });
