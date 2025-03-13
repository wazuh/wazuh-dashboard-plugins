import React from 'react';
import { EuiPanel } from '@elastic/eui';
import { netifaceColumns } from '../columns';
import { WzTableDiscover } from '../../../common/wazuh-discover/table';
import {
  SystemInventoryNetworkInterfacesStatesDataSource,
  SystemInventoryNetworkInterfacesStatesDataSourceRepository,
} from '../../../common/data-source';

export const NetworkInterfacesTable = ({ agent }) => {
  return (
    <EuiPanel data-test-subj='network-interfaces-table' paddingSize='m'>
      <WzTableDiscover
        title='Network interfaces'
        DataSource={SystemInventoryNetworkInterfacesStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventoryNetworkInterfacesStatesDataSourceRepository
        }
        tableDefaultColumns={netifaceColumns}
        createNewSearchContext={true}
      />
    </EuiPanel>
  );
};
