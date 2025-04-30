import React from 'react';
import {
  SystemInventoryStatesDataSource,
  SystemInventoryHotfixesStatesDataSourceRepository,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import { withSystemInventoryHotfixesDataSource } from '../../../common/hocs/validate-system-inventory-index-pattern';
import { ITHygieneInventoryDashboardTable } from '../../../common/components/inventory';
import { getOverviewPackagesHotfixesTab } from './dashboard';

export const ITHygienePackagesInventoryHotfixes =
  withSystemInventoryHotfixesDataSource(props => {
    return (
      <ITHygieneInventoryDashboardTable
        DataSource={SystemInventoryStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventoryHotfixesStatesDataSourceRepository
        }
        tableDefaultColumns={tableColumns}
        managedFilters={managedFilters}
        managedFiltersProps={{ style: { flexGrow: 0.25, minWidth: '300px' } }}
        getDashboardPanels={getOverviewPackagesHotfixesTab}
        tableId='it-hygiene-inventory-hotfixes'
        indexPattern={props.indexPattern}
      />
    );
  });
