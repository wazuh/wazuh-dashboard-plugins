import React from 'react';
import {
  SystemInventoryStatesDataSource,
  SystemInventoryPackagesStatesDataSourceRepository,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import { withSystemInventoryPackagesDataSource } from '../../../common/hocs/validate-system-inventory-index-pattern';
import { ITHygieneInventoryTable } from '../../../components/inventory-table/it-hygiene-inventory-table';
import {
  WAZUH_SAMPLE_INVENTORY_AGENT,
  IT_HYGIENE_PACKAGES_INVENTORY_ID,
  IT_HYGIENE_PACKAGES_AGENT_INVENTORY_ID,
} from '../../../../../../../common/constants';

export const ITHygienePackagesInventoryPackages =
  withSystemInventoryPackagesDataSource(() => {
    return (
      <ITHygieneInventoryTable
        DataSource={SystemInventoryStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventoryPackagesStatesDataSourceRepository
        }
        tableDefaultColumns={tableColumns}
        managedFilters={managedFilters}
        getDashboardPanels={[
          {
            dashboardId: IT_HYGIENE_PACKAGES_INVENTORY_ID,
            agentDashboardId: IT_HYGIENE_PACKAGES_AGENT_INVENTORY_ID,
          },
        ]}
        tableId='it-hygiene-inventory-packages'
        categoriesSampleData={[WAZUH_SAMPLE_INVENTORY_AGENT]}
      />
    );
  });
