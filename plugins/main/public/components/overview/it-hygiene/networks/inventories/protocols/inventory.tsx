import React from 'react';
import {
  SystemInventoryStatesDataSource,
  SystemInventoryProtocolsStatesDataSourceRepository,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import { withSystemInventoryProtocolsDataSource } from '../../../common/hocs/validate-system-inventory-index-pattern';
import { ITHygieneInventoryTable } from '../../../components/inventory-table/it-hygiene-inventory-table';
import {
  WAZUH_SAMPLE_INVENTORY_AGENT,
  IT_HYGIENE_PROTOCOLS_INVENTORY_ID,
  IT_HYGIENE_PROTOCOLS_AGENT_INVENTORY_ID,
} from '../../../../../../../common/constants';

export const ITHygieneNetworksInventoryProtocols =
  withSystemInventoryProtocolsDataSource(() => {
    return (
      <ITHygieneInventoryTable
        DataSource={SystemInventoryStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventoryProtocolsStatesDataSourceRepository
        }
        tableDefaultColumns={tableColumns}
        managedFilters={managedFilters}
        getDashboardPanels={[
          {
            dashboardId: IT_HYGIENE_PROTOCOLS_INVENTORY_ID,
            agentDashboardId: IT_HYGIENE_PROTOCOLS_AGENT_INVENTORY_ID,
          },
        ]}
        tableId='it-hygiene-inventory-protocols'
        categoriesSampleData={[WAZUH_SAMPLE_INVENTORY_AGENT]}
      />
    );
  });
