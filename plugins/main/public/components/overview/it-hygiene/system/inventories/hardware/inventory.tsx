import React from 'react';
import {
  SystemInventoryStatesDataSource,
  SystemInventoryHardwareStatesDataSourceRepository,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import { withSystemInventoryHardwareDataSource } from '../../../common/hocs/validate-system-inventory-index-pattern';
import { ITHygieneInventoryDashboardTable } from '../../../common/components/inventory';
import { getOverviewSystemHardwareTab } from './dashboard';

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
        getDashboardPanels={getOverviewSystemHardwareTab}
        tableId='it-hygiene-inventory-hardware'
        indexPattern={props.indexPattern}
      />
    );
  });
