import React from 'react';
import {
  FIMFilesStatesDataSource,
  FIMFilesStatesDataSourceRepository,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
withSystemInventoryHardwareDataSource;
import { getDashboard } from './dashboard';
import { withSystemInventoryHardwareDataSource } from '../../../../it-hygiene/common/hocs/validate-system-inventory-index-pattern';
import { withFIMFilesDataSource } from '../../../common/hocs/validate-fim-states-index-pattern';
import { InventoryDashboardTable } from '../../../../../common/dashboards';
import { WAZUH_SAMPLE_FILE_INTEGRITY_MONITORING } from '../../../../../../../common/constants';
import { filesEventsDocumentDetailsTab } from '../../inventory';
import { compose } from 'redux';
import { withAgent } from '../hocs';

export const InventoryFIMFiles = compose(
  withAgent,
  withFIMFilesDataSource,
)(props => {
  return (
    <InventoryDashboardTable
      DataSource={FIMFilesStatesDataSource}
      DataSourceRepositoryCreator={FIMFilesStatesDataSourceRepository}
      tableDefaultColumns={tableColumns}
      managedFilters={managedFilters}
      getDashboardPanels={getDashboard}
      tableId='fim-files-inventory'
      indexPattern={props.indexPattern}
      categoriesSampleData={[WAZUH_SAMPLE_FILE_INTEGRITY_MONITORING]}
      additionalDocumentDetailsTabs={({ document }) => {
        return [
          filesEventsDocumentDetailsTab({ document, agent: props.agent }),
        ];
      }}
    />
  );
});
