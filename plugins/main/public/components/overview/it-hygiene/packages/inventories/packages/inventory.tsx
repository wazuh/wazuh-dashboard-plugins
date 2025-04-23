import React from 'react';
import {
  SystemInventoryStatesDataSource,
  SystemInventoryPackagesStatesDataSourceRepository,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import { withSystemInventoryPackagesDataSource } from '../../../common/hocs/validate-system-inventory-index-pattern';
import { ITHygieneInventoryDashboardTable } from '../../../common/components/inventory';
import { getOverviewPackagesPackagesTab } from './dashboard';

export const ITHygienePackagesInventoryPackages =
  withSystemInventoryPackagesDataSource(props => {
    return (
      <ITHygieneInventoryDashboardTable
        DataSource={SystemInventoryStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventoryPackagesStatesDataSourceRepository
        }
        tableDefaultColumns={tableColumns}
        managedFilters={managedFilters}
        getDashboardPanels={getOverviewPackagesPackagesTab}
      />
    );
  });
