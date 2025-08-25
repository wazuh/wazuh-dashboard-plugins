import React from 'react';
import {
  SystemInventoryStatesDataSource,
  SystemInventoryProtocolsStatesDataSourceRepository,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import { withSystemInventoryProtocolsDataSource } from '../../../common/hocs/validate-system-inventory-index-pattern';
import { getOverviewNetworksProtocolsTab } from './dashboard';
import { InventoryDashboardTable } from '../../../../../common/dashboards';
import { WAZUH_SAMPLE_INVENTORY_AGENT } from '../../../../../../../common/constants';

export const ITHygieneNetworksInventoryProtocols =
  withSystemInventoryProtocolsDataSource(() => {
    return (
      <InventoryDashboardTable
        DataSource={SystemInventoryStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventoryProtocolsStatesDataSourceRepository
        }
        tableDefaultColumns={tableColumns}
        managedFilters={managedFilters}
        getDashboardPanels={getOverviewNetworksProtocolsTab}
        tableId='it-hygiene-inventory-protocols'
        categoriesSampleData={[WAZUH_SAMPLE_INVENTORY_AGENT]}
      />
    );
  });
