import React from 'react';
import {
  SystemInventoryStatesDataSource,
  SystemInventoryGroupsStatesDataSourceRepository,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import { withSystemInventoryGroupsDataSource } from '../../../common/hocs/validate-system-inventory-index-pattern';
import { InventoryDashboardTable } from '../../../../../common/dashboards';
import { WAZUH_SAMPLE_INVENTORY_AGENT } from '../../../../../../../common/constants';
import { compose } from 'redux';
import { withAgent } from '../hocs';
import { getOverviewUsersGroupsTab } from './dashboard';

export const ITHygieneUsersInventoryGroups = compose(
  withAgent,
  withSystemInventoryGroupsDataSource,
)((props: any) => {
  return (
    <div style={{ margin: '0 12px' }}>
      <InventoryDashboardTable
        DataSource={SystemInventoryStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventoryGroupsStatesDataSourceRepository
        }
        tableDefaultColumns={tableColumns}
        managedFilters={managedFilters}
        getDashboardPanels={getOverviewUsersGroupsTab}
        tableId='it-hygiene-inventory-groups'
        indexPattern={props.indexPattern}
        categoriesSampleData={[WAZUH_SAMPLE_INVENTORY_AGENT]}
      />
    </div>
  );
});
