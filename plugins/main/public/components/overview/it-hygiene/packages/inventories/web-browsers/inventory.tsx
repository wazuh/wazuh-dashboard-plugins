import React from 'react';
import {
  SystemInventoryStatesDataSource,
  SystemInventoryBrowserExtensionsStatesDataSourceRepository,
} from '../../../../../common/data-source';
import tableColumns from './table-columns';
import managedFilters from './managed-filters';
import { withSystemInventoryBrowserExtensionsDataSource } from '../../../common/hocs/validate-system-inventory-index-pattern';
import { ITHygieneInventoryTable } from '../../../components/inventory-table/it-hygiene-inventory-table';
import {
  WAZUH_SAMPLE_INVENTORY_AGENT,
  IT_HYGIENE_BROWSER_EXTENSIONS_INVENTORY_ID,
  IT_HYGIENE_BROWSER_EXTENSIONS_AGENT_INVENTORY_ID,
} from '../../../../../../../common/constants';

export const ITHygienePackagesInventoryWebBrowsers =
  withSystemInventoryBrowserExtensionsDataSource(() => {
    return (
      <ITHygieneInventoryTable
        DataSource={SystemInventoryStatesDataSource}
        DataSourceRepositoryCreator={
          SystemInventoryBrowserExtensionsStatesDataSourceRepository
        }
        tableDefaultColumns={tableColumns}
        managedFilters={managedFilters}
        getDashboardPanels={[
          {
            dashboardId: IT_HYGIENE_BROWSER_EXTENSIONS_INVENTORY_ID,
            agentDashboardId: IT_HYGIENE_BROWSER_EXTENSIONS_AGENT_INVENTORY_ID,
          },
        ]}
        tableId='it-hygiene-inventory-browser-extensions'
        categoriesSampleData={[WAZUH_SAMPLE_INVENTORY_AGENT]}
      />
    );
  });
