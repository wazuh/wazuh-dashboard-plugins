import React from 'react';
import {
  SystemInventoryStatesDataSource,
  SystemInventoryServicesStatesDataSourceRepository,
} from '../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import { withSystemInventoryServicesDataSource } from '../common/hocs/validate-system-inventory-index-pattern';
import { ITHygieneInventoryDashboardTable } from '../common/components/inventory';
import { getOverviewServicesTab } from './dashboard';

export const ITHygieneServicesInventory = withSystemInventoryServicesDataSource(
  props => {
    return (
      <ITHygieneInventoryDashboardTable
        DataSource={SystemInventoryStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventoryServicesStatesDataSourceRepository
        }
        tableDefaultColumns={tableColumns}
        managedFilters={managedFilters}
        managedFiltersProps={{ style: { flexGrow: 0.25, minWidth: '300px' } }}
        getDashboardPanels={getOverviewServicesTab}
        tableId='it-hygiene-inventory-services'
        indexPattern={props.indexPattern}
      />
    );
  },
);
