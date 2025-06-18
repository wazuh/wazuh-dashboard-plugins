import React from 'react';
import {
  SystemInventoryStatesDataSource,
  SystemInventoryPortsStatesDataSourceRepository,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import { withSystemInventoryPortsDataSource } from '../../../common/hocs/validate-system-inventory-index-pattern';
import { ITHygieneInventoryDashboardTable } from '../../../common/components/inventory';
import { getOverviewProcessesPortTab } from './dashboard';

export const ITHygieneNetworksInventoryPorts =
  withSystemInventoryPortsDataSource(props => {
    return (
      <ITHygieneInventoryDashboardTable
        DataSource={SystemInventoryStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventoryPortsStatesDataSourceRepository
        }
        tableDefaultColumns={tableColumns}
        managedFilters={managedFilters}
        getDashboardPanels={getOverviewProcessesPortTab}
        tableId='it-hygiene-inventory-ports'
        indexPattern={props.indexPattern}
      />
    );
  });
