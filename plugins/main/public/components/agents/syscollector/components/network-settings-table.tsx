import React from 'react';
import { EuiPanel } from '@elastic/eui';
import { netaddrColumns } from '../columns';
import { WzTableDiscover } from '../../../common/wazuh-discover/table';
import {
  SystemInventoryNetworkSettingsStatesDataSource,
  SystemInventoryNetworkSettingsStatesDataSourceRepository,
} from '../../../common/data-source';
import { withSystemInventoryNetworksDataSource } from '../../../overview/system-inventory/common/hocs/validate-system-inventory-index-pattern';

export const NetworkSettingsTable = withSystemInventoryNetworksDataSource(
  ({ agent }) => {
    return (
      <EuiPanel data-test-subj='network-settings-table' paddingSize='m'>
        <WzTableDiscover
          title='Network settings'
          DataSource={SystemInventoryNetworkSettingsStatesDataSource}
          DataSourceRepositoryCreator={
            SystemInventoryNetworkSettingsStatesDataSourceRepository
          }
          tableDefaultColumns={netaddrColumns}
          createNewSearchContext={true}
        />
      </EuiPanel>
    );
  },
);
