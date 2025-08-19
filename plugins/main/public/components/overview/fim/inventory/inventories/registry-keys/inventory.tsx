import React from 'react';
import {
  FIMRegistryKeysStatesDataSource,
  FIMRegistryKeysStatesDataSourceRepository,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import { getDashboard } from './dashboard';
import { withFIMRegistryKeysDataSource } from '../../../common/hocs/validate-fim-states-index-pattern';
import { InventoryDashboardTable } from '../../../../../common/dashboards';
import { WAZUH_SAMPLE_FILE_INTEGRITY_MONITORING } from '../../../../../../../common/constants';
import { compose } from 'redux';
import { withAgent } from '../../../../../common/hocs/with-agent';

export const InventoryFIMRegistryKeys = compose(
  withAgent,
  withFIMRegistryKeysDataSource,
)(props => {
  return (
    <div style={{ margin: '0 12px' }}>
      <InventoryDashboardTable
        DataSource={FIMRegistryKeysStatesDataSource}
        DataSourceRepositoryCreator={FIMRegistryKeysStatesDataSourceRepository}
        tableDefaultColumns={tableColumns}
        managedFilters={managedFilters}
        getDashboardPanels={getDashboard}
        tableId='fim-registry-keys-inventory'
        indexPattern={props.indexPattern}
        categoriesSampleData={[WAZUH_SAMPLE_FILE_INTEGRITY_MONITORING]}
      />
    </div>
  );
});
