import React from 'react';
import { EuiPanel } from '@elastic/eui';
import { packagesColumns } from '../columns';
import { withSOPlatformGuard } from './with-so-platform-guard';
import { WzTableDiscover } from '../../../common/wazuh-discover/table';
import {
  SystemInventoryPackagesStatesDataSource,
  SystemInventoryPackagesStatesDataSourceRepository,
} from '../../../common/data-source';

export const PackagesTable = withSOPlatformGuard(({ agent, soPlatform }) => {
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
