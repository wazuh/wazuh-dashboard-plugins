import React from 'react';
import defaultColumns from './default-columns';
import { WzTableDiscover } from '../../../common/wazuh-discover/table';
import {
  SystemInventoryProtocolsStatesDataSource,
  SystemInventoryProtocolsStatesDataSourceRepository,
} from '../../../common/data-source';
import { withSystemInventoryProtocolsDataSource } from '../../system-inventory/common/hocs/validate-system-inventory-index-pattern';

export const SystemInventoryProtocolsTable =
  withSystemInventoryProtocolsDataSource(() => {
    return (
      <WzTableDiscover
        DataSource={SystemInventoryProtocolsStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventoryProtocolsStatesDataSourceRepository
        }
        tableDefaultColumns={defaultColumns}
        displayOnlyNoResultsCalloutOnNoResults={true}
      />
    );
  });
