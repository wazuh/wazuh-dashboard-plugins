import React from 'react';
import {
  FIMRegistryValuesStatesDataSource,
  FIMRegistryValuesStatesDataSourceRepository,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
withSystemInventoryHardwareDataSource;
import { getDashboard } from './dashboard';
import { withSystemInventoryHardwareDataSource } from '../../../../it-hygiene/common/hocs/validate-system-inventory-index-pattern';
import { withFIMRegistryValuesDataSource } from '../../../common/hocs/validate-fim-states-index-pattern';
import { InventoryDashboardTable } from '../../../../../common/dashboards';
import { WAZUH_SAMPLE_FILE_INTEGRITY_MONITORING } from '../../../../../../../common/constants';
import { compose } from 'redux';
import { withAgent } from '../../../../../common/hocs/with-agent';

export const InventoryFIMRegistryValues = compose(
  withAgent,
  withFIMRegistryValuesDataSource,
)(props => {
  return (
    <div style={{ margin: '0 12px' }}>
      <InventoryDashboardTable
        DataSource={FIMRegistryValuesStatesDataSource}
        DataSourceRepositoryCreator={
          FIMRegistryValuesStatesDataSourceRepository
        }
        tableDefaultColumns={tableColumns}
        managedFilters={managedFilters}
        getDashboardPanels={getDashboard}
        tableId='fim-registry-values-inventory'
        indexPattern={props.indexPattern}
        categoriesSampleData={[WAZUH_SAMPLE_FILE_INTEGRITY_MONITORING]}
      />
    </div>
  );
});
