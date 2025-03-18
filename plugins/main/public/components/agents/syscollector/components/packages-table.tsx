import React from 'react';
import { EuiPanel } from '@elastic/eui';
import { packagesColumns } from '../columns';
import { withSOPlatformGuard } from './with-so-platform-guard';
import { WzTableDiscover } from '../../../common/wazuh-discover/table';
import {
  SystemInventoryPackagesStatesDataSource,
  SystemInventoryPackagesStatesDataSourceRepository,
} from '../../../common/data-source';
import { compose } from 'redux';
import { withSystemInventoryPackagesDataSource } from '../../../overview/system-inventory/common/hocs/validate-system-inventory-index-pattern';

export const PackagesTable = compose(
  withSOPlatformGuard,
  withSystemInventoryPackagesDataSource,
)(({ agent, soPlatform }) => {
  return (
    <EuiPanel data-test-subj='software-packages-table' paddingSize='m'>
      <WzTableDiscover
        title='Packages'
        DataSource={SystemInventoryPackagesStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventoryPackagesStatesDataSourceRepository
        }
        tableDefaultColumns={packagesColumns[soPlatform]}
        createNewSearchContext={true}
      />
    </EuiPanel>
  );
});
