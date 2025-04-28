import React from 'react';
import {
  SystemInventoryStatesDataSource,
  SystemInventoryInterfacesStatesDataSourceRepository,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import { withSystemInventoryInterfacesDataSource } from '../../../common/hocs/validate-system-inventory-index-pattern';
import {
  ITHygieneInventoryDashboardTable,
  ITHygieneInventoryDashboardTableProps,
} from '../../../common/components/inventory';
import { getOverviewNetworksInterfacesTab } from './dashboard';

export const ITHygieneNetworksInventoryInterfaces =
  withSystemInventoryInterfacesDataSource(
    (props: ITHygieneInventoryDashboardTableProps) => {
      return (
        <ITHygieneInventoryDashboardTable
          DataSource={SystemInventoryStatesDataSource}
          DataSourceRepositoryCreator={
            SystemInventoryInterfacesStatesDataSourceRepository
          }
          tableDefaultColumns={tableColumns}
          managedFilters={managedFilters}
          getDashboardPanels={getOverviewNetworksInterfacesTab}
          tableId='it-hygiene-inventory-interfaces'
        />
      );
    },
  );
