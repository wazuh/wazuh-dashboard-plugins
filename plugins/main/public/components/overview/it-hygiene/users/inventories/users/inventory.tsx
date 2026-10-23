import React from 'react';
import {
  SystemInventoryStatesDataSource,
  SystemInventoryUsersStatesDataSourceRepository,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import { withSystemInventoryUsersDataSource } from '../../../common/hocs/validate-system-inventory-index-pattern';
import { ITHygieneInventoryTable } from '../../../components/inventory-table/it-hygiene-inventory-table';
import {
  WAZUH_SAMPLE_INVENTORY_AGENT,
  IT_HYGIENE_USERS_INVENTORY_ID,
  IT_HYGIENE_USERS_AGENT_INVENTORY_ID,
} from '../../../../../../../common/constants';
import { withAgent } from '../hocs';
import { compose } from 'redux';

export const ITHygieneUsersInventoryUsers = compose(
  withAgent,
  withSystemInventoryUsersDataSource,
)(() => {
  return (
    <ITHygieneInventoryTable
      DataSource={SystemInventoryStatesDataSource}
      DataSourceRepositoryCreator={
        SystemInventoryUsersStatesDataSourceRepository
      }
      tableDefaultColumns={tableColumns}
      managedFilters={managedFilters}
      getDashboardPanels={[
        {
          dashboardId: IT_HYGIENE_USERS_INVENTORY_ID,
          agentDashboardId: IT_HYGIENE_USERS_AGENT_INVENTORY_ID,
        },
      ]}
      tableId='it-hygiene-inventory-users'
      categoriesSampleData={[WAZUH_SAMPLE_INVENTORY_AGENT]}
    />
  );
});
