import React from 'react';
import {
  SystemInventoryStatesDataSource,
  SystemInventoryHardwareStatesDataSourceRepository,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import { withSystemInventoryHardwareDataSource } from '../../../common/hocs/validate-system-inventory-index-pattern';
import { getOverviewSystemHardwareTab } from './dashboard';
import { WAZUH_SAMPLE_INVENTORY_AGENT } from '../../../../../../../common/constants';
import { InventoryDashboardTable } from '../../../../../common/dashboards';

export const ITHygieneSystemInventoryHardware =
  withSystemInventoryHardwareDataSource(() => {
    return (
      <InventoryDashboardTable
        DataSource={SystemInventoryStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventoryHardwareStatesDataSourceRepository
        }
        tableDefaultColumns={tableColumns}
        managedFilters={managedFilters}
        getDashboardPanels={getOverviewSystemHardwareTab}
        tableId='it-hygiene-inventory-hardware'
        categoriesSampleData={[WAZUH_SAMPLE_INVENTORY_AGENT]}
      />
    );
  });
