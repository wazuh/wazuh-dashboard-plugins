import React from 'react';

import './inventory.scss';
import { inventoryTableDefaultColumns } from './config';
import { withErrorBoundary } from '../../../common/hocs';
import { compose } from 'redux';
import { withFIMStateDataSource } from '../common/hocs/validate-fim-states-index-pattern';
import { ModuleEnabledCheck } from '../common/components/check-module-enabled';
import {
  FIMStatesDataSource,
  FIMStatesDataSourceRepository,
} from '../../../common/data-source';
import { WzTableDiscover } from '../../../common/wazuh-discover/table';

export const InventoryFIM = compose(
  withErrorBoundary,
  withFIMStateDataSource,
)(() => {
  return (
    <WzTableDiscover
      DataSource={FIMStatesDataSource}
      DataSourceRepositoryCreator={FIMStatesDataSourceRepository}
      tableDefaultColumns={inventoryTableDefaultColumns}
      displayOnlyNoResultsCalloutOnNoResults={true}
    />
  );
});
