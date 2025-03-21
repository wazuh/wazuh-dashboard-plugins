import React from 'react';
import defaultColumns from './default-columns';
import { WzTableDiscover } from '../../../common/wazuh-discover/table';
import {
  SystemInventorySystemStatesDataSource,
  SystemInventorySystemStatesDataSourceRepository,
} from '../../../common/data-source';
import { withSystemInventorySystemDataSource } from '../../system-inventory/common/hocs/validate-system-inventory-index-pattern';

export const SystemInventorySystemTable = withSystemInventorySystemDataSource(
  () => {
    return (
      <WzTableDiscover
        DataSource={SystemInventorySystemStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventorySystemStatesDataSourceRepository
        }
        tableDefaultColumns={defaultColumns}
        displayOnlyNoResultsCalloutOnNoResults={true}
      />
    );
  },
);
