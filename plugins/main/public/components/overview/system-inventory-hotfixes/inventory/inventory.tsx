import React from 'react';
import defaultColumns from './default-columns';
import { WzTableDiscover } from '../../../common/wazuh-discover/table';
import {
  SystemInventoryHotfixesStatesDataSource,
  SystemInventoryHotfixesStatesDataSourceRepository,
} from '../../../common/data-source';
import { withSystemInventoryHotfixesDataSource } from '../../system-inventory/common/hocs/validate-system-inventory-index-pattern';

export const SystemInventoryHotfixesTable =
  withSystemInventoryHotfixesDataSource(() => {
    return (
      <WzTableDiscover
        DataSource={SystemInventoryHotfixesStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventoryHotfixesStatesDataSourceRepository
        }
        tableDefaultColumns={defaultColumns}
        displayOnlyNoResultsCalloutOnNoResults={true}
      />
    );
  });
