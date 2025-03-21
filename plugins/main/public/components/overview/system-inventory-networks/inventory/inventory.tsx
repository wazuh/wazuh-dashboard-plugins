import React from 'react';
import defaultColumns from './default-columns';
import { WzTableDiscover } from '../../../common/wazuh-discover/table';
import {
  SystemInventoryNetworkSettingsStatesDataSource,
  SystemInventoryNetworkSettingsStatesDataSourceRepository,
} from '../../../common/data-source';
import { withSystemInventoryNetworksDataSource } from '../../system-inventory/common/hocs/validate-system-inventory-index-pattern';

export const SystemInventoryNetworksTable =
  withSystemInventoryNetworksDataSource(() => {
    return (
      <WzTableDiscover
        DataSource={SystemInventoryNetworkSettingsStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventoryNetworkSettingsStatesDataSourceRepository
        }
        tableDefaultColumns={defaultColumns}
        displayOnlyNoResultsCalloutOnNoResults={true}
      />
    );
  });
