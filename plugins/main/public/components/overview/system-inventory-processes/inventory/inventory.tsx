import React from 'react';
import defaultColumns from './default-columns';
import { WzTableDiscover } from '../../../common/wazuh-discover/table';
import {
  SystemInventoryProcessesStatesDataSource,
  SystemInventoryProcessesStatesDataSourceRepository,
} from '../../../common/data-source';
import { withSystemInventoryProcessesDataSource } from '../../system-inventory/common/hocs/validate-system-inventory-index-pattern';

export const SystemInventoryProcessesTable =
  withSystemInventoryProcessesDataSource(() => {
    return (
      <WzTableDiscover
        DataSource={SystemInventoryProcessesStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventoryProcessesStatesDataSourceRepository
        }
        tableDefaultColumns={defaultColumns}
        displayOnlyNoResultsCalloutOnNoResults={true}
      />
    );
  });
