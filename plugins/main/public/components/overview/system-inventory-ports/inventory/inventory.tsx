import React from 'react';
import defaultColumns from './default-columns';
import { WzTableDiscover } from '../../../common/wazuh-discover/table';
import {
  SystemInventoryNetworkPortsStatesDataSource,
  SystemInventoryNetworkPortsStatesDataSourceRepository,
} from '../../../common/data-source';
import { withSystemInventoryPortsDataSource } from '../../system-inventory/common/hocs/validate-system-inventory-index-pattern';

export const SystemInventoryPortsTable = withSystemInventoryPortsDataSource(
  () => {
    return (
      <WzTableDiscover
        DataSource={SystemInventoryNetworkPortsStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventoryNetworkPortsStatesDataSourceRepository
        }
        tableDefaultColumns={defaultColumns}
        displayOnlyNoResultsCalloutOnNoResults={true}
      />
    );
  },
);
