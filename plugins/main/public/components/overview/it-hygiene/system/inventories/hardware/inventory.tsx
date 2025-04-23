import React from 'react';
import {
  SystemInventoryStatesDataSource,
  SystemInventoryHardwareStatesDataSourceRepository,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import { withSystemInventoryHardwareDataSource } from '../../../common/hocs/validate-system-inventory-index-pattern';
import { ITHygieneInventoryDashboardTable } from '../../../common/components/inventory';

export const ITHygieneSystemInventoryHardware =
  withSystemInventoryHardwareDataSource(props => {
    return (
      <ITHygieneInventoryDashboardTable
        DataSource={SystemInventoryStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventoryHardwareStatesDataSourceRepository
        }
        tableDefaultColumns={tableColumns}
        managedFilters={managedFilters}
        tableID='it-hygiene-inventory-hardware'
      />
    );
  });
