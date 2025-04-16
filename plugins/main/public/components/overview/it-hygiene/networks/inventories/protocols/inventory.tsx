import React from 'react';
import {
  SystemInventoryStatesDataSource,
  SystemInventoryProtocolsStatesDataSourceRepository,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import { withSystemInventoryProtocolsDataSource } from '../../../common/hocs/validate-system-inventory-index-pattern';
import { ITHygieneInventoryDashboardTable } from '../../../common/components/inventory';

export const ITHygieneNetworksInventoryProtocols =
  withSystemInventoryProtocolsDataSource(props => {
    return (
      <ITHygieneInventoryDashboardTable
        DataSource={SystemInventoryStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventoryProtocolsStatesDataSourceRepository
        }
        tableDefaultColumns={tableColumns}
      />
    );
  });
