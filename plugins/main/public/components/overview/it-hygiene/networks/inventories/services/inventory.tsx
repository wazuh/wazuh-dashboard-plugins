import React from 'react';
import {
  SystemInventoryServicesStatesDataSource,
  SystemInventoryTrafficStatesDataSourceRepository,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import { withSystemInventoryTrafficDataSource } from '../../../common/hocs/validate-system-inventory-index-pattern';
import { getOverviewProcessesPortTab } from './dashboard';
import { InventoryDashboardTable } from '../../../../../common/dashboards';
import { WAZUH_SAMPLE_INVENTORY_AGENT } from '../../../../../../../common/constants';

export const ITHygieneNetworksInventoryServices =
  withSystemInventoryTrafficDataSource(() => {
    return (
      <InventoryDashboardTable
        DataSource={SystemInventoryServicesStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventoryTrafficStatesDataSourceRepository
        }
        tableDefaultColumns={tableColumns}
        managedFilters={managedFilters}
        getDashboardPanels={getOverviewProcessesPortTab}
        tableId='it-hygiene-inventory-services'
        categoriesSampleData={[WAZUH_SAMPLE_INVENTORY_AGENT]}
      />
    );
  });
