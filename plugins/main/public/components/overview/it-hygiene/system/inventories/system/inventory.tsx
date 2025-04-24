import React from 'react';
import {
  SystemInventoryStatesDataSource,
  SystemInventorySystemStatesDataSourceRepository,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import { withSystemInventorySystemDataSource } from '../../../common/hocs/validate-system-inventory-index-pattern';
import { ITHygieneInventoryDashboardTable } from '../../../common/components/inventory';
import { getOverviewSystemSystemTab } from './dashboard';

export const ITHygieneSystemInventorySystem =
  withSystemInventorySystemDataSource(props => {
    return (
      <ITHygieneInventoryDashboardTable
        DataSource={SystemInventoryStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventorySystemStatesDataSourceRepository
        }
        tableDefaultColumns={tableColumns}
        managedFilters={managedFilters}
        getDashboardPanels={getOverviewSystemSystemTab}
        tableID='it-hygiene-inventory-system'
      />
    );
  });
