import React from 'react';
import defaultColumns from './default-columns';
import { WzTableDiscover } from '../../../common/wazuh-discover/table';
import {
  SystemInventoryNetworkInterfacesStatesDataSource,
  SystemInventoryNetworkInterfacesStatesDataSourceRepository,
} from '../../../common/data-source';
import { withSystemInventoryInterfacesDataSource } from '../../system-inventory/common/hocs/validate-system-inventory-index-pattern';

export const SystemInventoryInterfacesTable =
  withSystemInventoryInterfacesDataSource(() => {
    return (
      <WzTableDiscover
        DataSource={SystemInventoryNetworkInterfacesStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventoryNetworkInterfacesStatesDataSourceRepository
        }
        tableDefaultColumns={defaultColumns}
        displayOnlyNoResultsCalloutOnNoResults={true}
      />
    );
  });
