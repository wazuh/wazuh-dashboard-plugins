import React from 'react';
import {
  SystemInventoryStatesDataSource,
  SystemInventoryNetworksStatesDataSourceRepository,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import { withSystemInventoryNetworksDataSource } from '../../../common/hocs/validate-system-inventory-index-pattern';
import { ITHygieneInventoryDashboardTable } from '../../../common/components/inventory';

export const ITHygieneNetworksInventoryNetworks =
  withSystemInventoryNetworksDataSource(props => {
    return (
      <ITHygieneInventoryDashboardTable
        DataSource={SystemInventoryStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventoryNetworksStatesDataSourceRepository
        }
        tableDefaultColumns={tableColumns}
      />
    );
  });
