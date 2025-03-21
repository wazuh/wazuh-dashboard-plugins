import React from 'react';
import defaultColumns from './default-columns';
import { WzTableDiscover } from '../../../common/wazuh-discover/table';
import {
  SystemInventoryPackagesStatesDataSource,
  SystemInventoryPackagesStatesDataSourceRepository,
} from '../../../common/data-source';
import { withSystemInventoryPackagesDataSource } from '../../system-inventory/common/hocs/validate-system-inventory-index-pattern';

export const SystemInventoryPackagesTable =
  withSystemInventoryPackagesDataSource(() => {
    return (
      <WzTableDiscover
        DataSource={SystemInventoryPackagesStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventoryPackagesStatesDataSourceRepository
        }
        tableDefaultColumns={defaultColumns}
        displayOnlyNoResultsCalloutOnNoResults={true}
      />
    );
  });
