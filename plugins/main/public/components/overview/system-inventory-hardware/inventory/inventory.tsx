import React from 'react';
import defaultColumns from './default-columns';
import { WzTableDiscover } from '../../../common/wazuh-discover/table';
import {
  SystemInventoryHardwareStatesDataSource,
  SystemInventoryHardwareStatesDataSourceRepository,
} from '../../../common/data-source';
import { withSystemInventoryHardwareDataSource } from '../../system-inventory/common/hocs/validate-system-inventory-index-pattern';

export const SystemInventoryHardwareTable =
  withSystemInventoryHardwareDataSource(() => {
    return (
      <WzTableDiscover
        DataSource={SystemInventoryHardwareStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventoryHardwareStatesDataSourceRepository
        }
        tableDefaultColumns={defaultColumns}
        displayOnlyNoResultsCalloutOnNoResults={true}
      />
    );
  });
