import React from 'react';
import { EuiPanel } from '@elastic/eui';
import { processColumns } from '../columns';
import { withSOPlatformGuard } from './with-so-platform-guard';
import { WzTableDiscover } from '../../../common/wazuh-discover/table';
import {
  SystemInventoryProcessesStatesDataSource,
  SystemInventoryProcessesStatesDataSourceRepository,
} from '../../../common/data-source';

export const ProcessesTable = withSOPlatformGuard(({ agent, soPlatform }) => {
  return (
    <EuiPanel data-test-subj='processes-table' paddingSize='m'>
      <WzTableDiscover
        title='Processes'
        DataSource={SystemInventoryProcessesStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventoryProcessesStatesDataSourceRepository
        }
        tableDefaultColumns={processColumns[soPlatform]}
        createNewSearchContext={true}
      />
    </EuiPanel>
  );
});
