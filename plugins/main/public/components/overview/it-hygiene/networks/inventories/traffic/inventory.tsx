import React from 'react';
import {
  SystemInventoryTrafficStatesDataSource,
  SystemInventoryTrafficStatesDataSourceRepository,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import { withSystemInventoryTrafficDataSource } from '../../../common/hocs/validate-system-inventory-index-pattern';
import { InventoryDashboardTable } from '../../../../../common/dashboards';
import { getOverviewProcessesPortTab } from './dashboard';
import { WAZUH_SAMPLE_INVENTORY_AGENT } from '../../../../../../../common/constants';

export const ITHygieneNetworksInventoryTraffic =
  withSystemInventoryTrafficDataSource(() => {
    return (
      <InventoryDashboardTable
        DataSource={SystemInventoryTrafficStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventoryTrafficStatesDataSourceRepository
        }
        tableDefaultColumns={tableColumns}
        managedFilters={managedFilters}
        getDashboardPanels={getOverviewProcessesPortTab}
        tableId='it-hygiene-inventory-traffic'
        categoriesSampleData={[WAZUH_SAMPLE_INVENTORY_AGENT]}
      />
    );
  });
