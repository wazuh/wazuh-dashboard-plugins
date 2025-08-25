import React from 'react';
import {
  SystemInventoryStatesDataSource,
  SystemInventoryInterfacesStatesDataSourceRepository,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import { withSystemInventoryInterfacesDataSource } from '../../../common/hocs/validate-system-inventory-index-pattern';
import { getOverviewNetworksInterfacesTab } from './dashboard';
import { InventoryDashboardTable } from '../../../../../common/dashboards';
import { WAZUH_SAMPLE_INVENTORY_AGENT } from '../../../../../../../common/constants';

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
        getDashboardPanels={getOverviewNetworksInterfacesTab}
        tableId='it-hygiene-inventory-interfaces'
        categoriesSampleData={[WAZUH_SAMPLE_INVENTORY_AGENT]}
      />
    );
  });
