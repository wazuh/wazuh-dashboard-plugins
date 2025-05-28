import React from 'react';
import { PatternDataSource } from '../../../common/data-source';
import { WazuhFlyoutDiscoverNewFilterManagerRecentEvents } from '../../../common/wazuh-data-grid/recent-events/recent-events';
import { fileIntegrityMonitoring } from '../../../../utils/applications';
import * as filesUtils from './inventory-files';
import * as registriesUtils from './inventory-registries';
import { InventoryFIMFiles } from './inventories';
import { ModuleSubTabs } from '../../../common/tabs';
import { InventoryFIMRegistryKeys } from './inventories/registry-keys/inventory';
import { InventoryFIMRegistryValues } from './inventories/registry-values/inventory';

export const InventoryFIMFilesDocumentDetailsEvents = ({ document, agent }) => (
  <WazuhFlyoutDiscoverNewFilterManagerRecentEvents
    document={document}
    agent={agent}
    applicationId={fileIntegrityMonitoring.id}
    applicationTab='fim'
    recentEventsSpecificFilters={filesUtils.getRecentEventsSpecificFilters}
    DataSource={PatternDataSource}
    tableColumns={filesUtils.getDiscoverColumns({ agent })}
    initialFetchFilters={filesUtils.getImplicitFilters({
      file: document._source.file.path,
    })}
    expandedRowComponent={(...args) =>
      filesUtils.renderDiscoverExpandedRow(...args)
    }
  />
);

export const filesEventsDocumentDetailsTab = ({ document, agent }) => ({
  id: 'events',
  name: 'Events',
  content: (
    <InventoryFIMFilesDocumentDetailsEvents document={document} agent={agent} />
  ),
});

export const InventoryFIMRegistriesDocumentDetailsEvents = ({
  document,
  agent,
}) => (
  <WazuhFlyoutDiscoverNewFilterManagerRecentEvents
    document={document}
    agent={agent}
    applicationId={fileIntegrityMonitoring.id}
    applicationTab='fim'
    recentEventsSpecificFilters={registriesUtils.getRecentEventsSpecificFilters}
    DataSource={PatternDataSource}
    tableColumns={registriesUtils.getDiscoverColumns({
      agent,
    })}
    initialFetchFilters={registriesUtils.getImplicitFilters({
      file: document._source.registry.key,
    })}
    expandedRowComponent={(...args) =>
      registriesUtils.renderDiscoverExpandedRow(...args)
    }
  />
);

export const registriesEventsDocumentDetailsTab = ({ document, agent }) => ({
  id: 'events',
  name: 'Events',
  content: (
    <InventoryFIMRegistriesDocumentDetailsEvents
      document={document}
      agent={agent}
    />
  ),
});

const tabs = [
  {
    id: 'files',
    name: 'Files',
    component: InventoryFIMFiles,
  },
  {
    id: 'registry-keys',
    name: 'Registry keys',
    component: InventoryFIMRegistryKeys,
  },
  {
    id: 'registry-values',
    name: 'Registry values',
    component: InventoryFIMRegistryValues,
  },
];

export const InventoryFIM = () => {
  return <ModuleSubTabs tabs={tabs} />;
};
