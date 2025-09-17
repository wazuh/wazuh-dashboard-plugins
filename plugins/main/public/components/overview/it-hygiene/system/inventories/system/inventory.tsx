import React from 'react';
import {
  SystemInventoryStatesDataSource,
  SystemInventorySystemStatesDataSourceRepository,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import { withSystemInventorySystemDataSource } from '../../../common/hocs/validate-system-inventory-index-pattern';
import { getOverviewSystemSystemTab } from './dashboard';
import { WAZUH_SAMPLE_INVENTORY_AGENT } from '../../../../../../../common/constants';
import { InventoryDashboardTable } from '../../../../../common/dashboards';

export const ITHygieneSystemInventorySystem =
  withSystemInventorySystemDataSource(() => {
    return (
      <InventoryDashboardTable
        DataSource={SystemInventoryStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventorySystemStatesDataSourceRepository
        }
        tableDefaultColumns={tableColumns}
        managedFilters={managedFilters}
        getDashboardPanels={getOverviewSystemSystemTab}
        tableId='it-hygiene-inventory-system'
        categoriesSampleData={[WAZUH_SAMPLE_INVENTORY_AGENT]}
      />
    );
  });
