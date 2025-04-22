import React from 'react';
import {
  SystemInventoryStatesDataSource,
  SystemInventoryNetworksStatesDataSourceRepository,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import { withSystemInventoryNetworksDataSource } from '../../../common/hocs/validate-system-inventory-index-pattern';
import {
  ITHygieneInventoryDashboardTable,
  ITHygieneInventoryDashboardTableProps,
} from '../../../common/components/inventory';
import { getOverviewNetworksTab } from './dashboard';

export const ITHygieneNetworksInventoryNetworks =
  withSystemInventoryNetworksDataSource(
    (props: ITHygieneInventoryDashboardTableProps) => {
      return (
        <ITHygieneInventoryDashboardTable
          DataSource={SystemInventoryStatesDataSource}
          DataSourceRepositoryCreator={
            SystemInventoryNetworksStatesDataSourceRepository
          }
          tableDefaultColumns={tableColumns}
          managedFilters={managedFilters}
          getDashboardPanels={getOverviewNetworksTab}
        />
      );
    },
  );
