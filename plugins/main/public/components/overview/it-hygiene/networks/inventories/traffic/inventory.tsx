import React from 'react';
import {
  SystemInventoryStatesDataSource,
  SystemInventoryTrafficStatesDataSourceRepository,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import { withSystemInventoryTrafficDataSource } from '../../../common/hocs/validate-system-inventory-index-pattern';
import { ITHygieneInventoryDashboardTable } from '../../../common/components/inventory';
import { getOverviewProcessesPortTab } from './dashboard';

export const ITHygieneNetworksInventoryTraffic =
  withSystemInventoryTrafficDataSource(props => {
    return (
      <ITHygieneInventoryDashboardTable
        DataSource={SystemInventoryStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventoryTrafficStatesDataSourceRepository
        }
        tableDefaultColumns={tableColumns}
        managedFilters={managedFilters}
        getDashboardPanels={getOverviewProcessesPortTab}
        tableId='it-hygiene-inventory-traffic'
        indexPattern={props.indexPattern}
      />
    );
  });
