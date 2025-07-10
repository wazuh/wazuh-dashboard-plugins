import React from 'react';
import {
  SystemInventoryStatesDataSource,
  SystemInventoryUsersStatesDataSourceRepository,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import { withSystemInventoryUsersDataSource } from '../../../common/hocs/validate-system-inventory-index-pattern';
import { InventoryDashboardTable } from '../../../../../common/dashboards';
import { WAZUH_SAMPLE_INVENTORY_AGENT } from '../../../../../../../common/constants';
import { compose } from 'redux';
import { withAgent } from '../hocs';
import { getOverviewUsersUsersTab } from './dashboard';

export const ITHygieneUsersInventoryUsers = compose(
  withAgent,
  withSystemInventoryUsersDataSource,
)((props: any) => {
  return (
    <div style={{ margin: '0 12px' }}>
      <InventoryDashboardTable
        DataSource={SystemInventoryStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventoryUsersStatesDataSourceRepository
        }
        tableDefaultColumns={tableColumns}
        managedFilters={managedFilters}
        getDashboardPanels={getOverviewUsersUsersTab}
        tableId='it-hygiene-inventory-users'
        indexPattern={props.indexPattern}
        categoriesSampleData={[WAZUH_SAMPLE_INVENTORY_AGENT]}
      />
    </div>
  );
});
