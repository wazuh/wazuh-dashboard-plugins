import React from 'react';
import {
  SystemInventoryStatesDataSource,
  SystemInventoryNetworksStatesDataSourceRepository,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import { withSystemInventoryNetworksDataSource } from '../../../common/hocs/validate-system-inventory-index-pattern';
import { getOverviewNetworksNetworksTab } from './dashboard';
import { InventoryDashboardTable } from '../../../../../common/dashboards';
import { WAZUH_SAMPLE_INVENTORY_AGENT } from '../../../../../../../common/constants';

export const ITHygieneNetworksInventoryNetworks =
  withSystemInventoryNetworksDataSource(() => {
    return (
      <InventoryDashboardTable
        DataSource={SystemInventoryStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventoryNetworksStatesDataSourceRepository
        }
        tableDefaultColumns={tableColumns}
        managedFilters={managedFilters}
        getDashboardPanels={getOverviewNetworksNetworksTab}
        tableId='it-hygiene-inventory-networks'
        categoriesSampleData={[WAZUH_SAMPLE_INVENTORY_AGENT]}
      />
    );
  });
