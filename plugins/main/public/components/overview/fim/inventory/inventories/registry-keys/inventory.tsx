import React from 'react';
import {
  FIMRegistriesStatesDataSourceRepository,
  FIMRegistryKeysStatesDataSource,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
withSystemInventoryHardwareDataSource;
import { getDashboard } from './dashboard';
import { withSystemInventoryHardwareDataSource } from '../../../../it-hygiene/common/hocs/validate-system-inventory-index-pattern';
import { withFIMRegistriesDataSource } from '../../../common/hocs/validate-fim-states-index-pattern';
import { InventoryDashboardTable } from '../../../../../common/dashboards';
import { WAZUH_SAMPLE_FILE_INTEGRITY_MONITORING } from '../../../../../../../common/constants';
import { compose } from 'redux';
import { withAgent } from '../hocs';

export const InventoryFIMRegistryKeys = compose(
  withAgent,
  withFIMRegistriesDataSource,
)(props => {
  return (
    <div style={{ margin: '0 12px' }}>
      <InventoryDashboardTable
        DataSource={FIMRegistryKeysStatesDataSource}
        DataSourceRepositoryCreator={FIMRegistriesStatesDataSourceRepository}
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
