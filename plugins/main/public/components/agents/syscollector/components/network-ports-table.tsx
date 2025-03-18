import React from 'react';
import { EuiPanel } from '@elastic/eui';
import { portsColumns } from '../columns';
import { withSOPlatformGuard } from './with-so-platform-guard';
import {
  SystemInventoryNetworkPortsStatesDataSource,
  SystemInventoryNetworkPortsStatesDataSourceRepository,
} from '../../../common/data-source/pattern/system-inventory-network-ports';
import { WzTableDiscover } from '../../../common/wazuh-discover/table';
import { compose } from 'redux';
import { withSystemInventoryPortsDataSource } from '../../../overview/system-inventory/common/hocs/validate-system-inventory-index-pattern';

export const NetworkPortsTable = compose(
  withSOPlatformGuard,
  withSystemInventoryPortsDataSource,
)(({ agent, soPlatform }) => {
  return (
    <EuiPanel data-test-subj='network-ports-table' paddingSize='m'>
      <WzTableDiscover
        title='Network ports'
        DataSource={SystemInventoryNetworkPortsStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventoryNetworkPortsStatesDataSourceRepository
        }
        tableDefaultColumns={portsColumns[soPlatform]}
        createNewSearchContext={true}
      />
    </EuiPanel>
  );
});
