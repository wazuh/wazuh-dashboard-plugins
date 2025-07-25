import React from 'react';
import {
  SystemInventoryServicesStatesDataSource,
  SystemInventoryTrafficStatesDataSourceRepository,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import { withSystemInventoryTrafficDataSource } from '../../../common/hocs/validate-system-inventory-index-pattern';
import { ITHygieneInventoryDashboardTable } from '../../../common/components/inventory';
import { getOverviewProcessesPortTab } from './dashboard';

export const ITHygieneNetworksInventoryServices =
  withSystemInventoryTrafficDataSource(props => {
    return (
      <ITHygieneInventoryDashboardTable
        DataSource={SystemInventoryServicesStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventoryTrafficStatesDataSourceRepository
        }
        tableDefaultColumns={tableColumns}
        managedFilters={managedFilters}
        getDashboardPanels={getOverviewProcessesPortTab}
        tableId='it-hygiene-inventory-services'
        indexPattern={props.indexPattern}
      />
    );
  });
