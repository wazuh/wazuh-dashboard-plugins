import React from 'react';
import {
  SystemInventoryStatesDataSource,
  SystemInventoryProcessesStatesDataSourceRepository,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import { withSystemInventoryProcessesDataSource } from '../../../common/hocs/validate-system-inventory-index-pattern';
import { ITHygieneInventoryDashboardTable } from '../../../common/components/inventory';

export const ITHygieneProccessesInventoryProcesses =
  withSystemInventoryProcessesDataSource(props => {
    return (
      <ITHygieneInventoryDashboardTable
        DataSource={SystemInventoryStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventoryProcessesStatesDataSourceRepository
        }
        tableDefaultColumns={tableColumns}
        managedFilters={managedFilters}
        tableID='it-hygiene-inventory-processes'
      />
    );
  });
