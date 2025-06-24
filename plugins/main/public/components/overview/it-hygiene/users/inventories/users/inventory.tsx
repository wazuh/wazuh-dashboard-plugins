import React from 'react';
import {
  SystemInventoryStatesDataSource,
  SystemInventoryUsersStatesDataSourceRepository,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import {
  withSystemInventoryUsersDataSource
} from '../../../common/hocs/validate-system-inventory-index-pattern';
import {
  ITHygieneInventoryDashboardTable,
  ITHygieneInventoryDashboardTableProps,
} from '../../../common/components/inventory';
import { getOverviewUsersUsersTab } from './dashboard';

export const ITHygieneUsersInventoryUsers =
  withSystemInventoryUsersDataSource(
    (props: ITHygieneInventoryDashboardTableProps) => {
      return (
        <ITHygieneInventoryDashboardTable
          DataSource={SystemInventoryStatesDataSource}
          DataSourceRepositoryCreator={
            SystemInventoryUsersStatesDataSourceRepository
          }
          tableDefaultColumns={tableColumns}
          managedFilters={managedFilters}
          getDashboardPanels={getOverviewUsersUsersTab}
          tableId='it-hygiene-inventory-users'
          indexPattern={props.indexPattern}
        />
      );
    },
  );