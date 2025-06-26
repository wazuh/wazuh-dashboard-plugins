import React from 'react';
import {
  SystemInventoryStatesDataSource,
  SystemInventoryGroupsStatesDataSourceRepository,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import {
  withSystemInventoryGroupsDataSource
} from '../../../common/hocs/validate-system-inventory-index-pattern';
import {
  ITHygieneInventoryDashboardTable,
  ITHygieneInventoryDashboardTableProps,
} from '../../../common/components/inventory';
import { getOverviewUsersGroupsTab } from './dashboard';

export const ITHygieneUsersInventoryGroups = withSystemInventoryGroupsDataSource(
  (props: ITHygieneInventoryDashboardTableProps) => {
    return (
      <ITHygieneInventoryDashboardTable
        DataSource={SystemInventoryStatesDataSource}
        DataSourceRepositoryCreator={SystemInventoryGroupsStatesDataSourceRepository}
        tableDefaultColumns={tableColumns}
        managedFilters={managedFilters}
        getDashboardPanels={getOverviewUsersGroupsTab}
        tableId="it-hygiene-inventory-groups"
        indexPattern={props.indexPattern}
      />
    );
  }
);
