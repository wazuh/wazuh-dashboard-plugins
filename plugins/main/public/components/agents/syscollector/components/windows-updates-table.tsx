import React from 'react';
import { EuiPanel } from '@elastic/eui';
import { windowsUpdatesColumns } from '../columns';
import { WzTableDiscover } from '../../../common/wazuh-discover/table';
import {
  SystemInventoryHotfixesStatesDataSource,
  SystemInventoryHotfixesStatesDataSourceRepository,
} from '../../../common/data-source';

export const WindowsUpdatesTable = ({ agent }) => {
  return (
    <EuiPanel data-test-subj='software-windows-updates-table' paddingSize='m'>
      <WzTableDiscover
        title='Windows updates'
        DataSource={SystemInventoryHotfixesStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventoryHotfixesStatesDataSourceRepository
        }
        tableDefaultColumns={windowsUpdatesColumns}
        createNewSearchContext={true}
      />
    </EuiPanel>
  );
};
