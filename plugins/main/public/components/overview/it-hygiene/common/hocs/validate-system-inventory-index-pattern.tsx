import React from 'react';
import { webDocumentationLink } from '../../../../../../common/services/web_documentation';
import { EuiLink } from '@elastic/eui';
import {
  ensureIndexPatternIsCreated,
  ERROR_NO_INDICES_FOUND,
  mapFieldsFormat,
  withIndexPatternFromSettingDataSource,
  withMapErrorPromptErrorEnsureIndexPattern,
} from '../../../../common/hocs';

const errorPromptTypes = {
  [ERROR_NO_INDICES_FOUND]: {
    title: () => 'System inventory could be disabled or has a problem',
    body: ({ message }: { message: React.ReactNode }) => (
      <>
        <p>{message}</p>
        <p>
          If the system inventory is enabled, then this could be caused by an
          error in: server side, server-indexer connection, indexer side, index
          creation, index data, index pattern name misconfiguration or user
          permissions related to read the inventory indices.
        </p>
        <p>
          Please, review the server and indexer logs. Also, you can check the{' '}
          <EuiLink
            href={webDocumentationLink(
              'user-manual/capabilities/system-inventory/index.html',
            )}
            target='_blank'
            rel='noopener noreferrer'
            external
          >
            system inventory documentation.
          </EuiLink>
        </p>
      </>
    ),
  },
  default: {
    title: ({ title }: { title: string }) => title,
    body: ({ message }: { message: string }) => <p>{message}</p>,
  },
};

export const withSystemInventoryDataSource =
  withIndexPatternFromSettingDataSource({
    indexPatternSetting: 'system_inventory.pattern',
    validate: ensureIndexPatternIsCreated(
      mapFieldsFormat({
        'destination.port': 'integer',
        'host.memory.free': 'bytes',
        'host.memory.total': 'bytes',
        'host.memory.used': 'percent',
        'host.network.egress.bytes': 'bytes',
        'host.network.ingress.bytes': 'bytes',
        'package.size': 'bytes',
        'process.parent.pid': 'integer',
        'process.pid': 'integer',
        'source.port': 'integer',
      }),
    ),
    ErrorComponent: withMapErrorPromptErrorEnsureIndexPattern(errorPromptTypes),
  });

export const withSystemInventoryNetworksDataSource =
  withIndexPatternFromSettingDataSource({
    indexPatternSetting: 'system_inventory_networks.pattern',
    validate: ensureIndexPatternIsCreated(),
    ErrorComponent: withMapErrorPromptErrorEnsureIndexPattern(errorPromptTypes),
  });

export const withSystemInventoryInterfacesDataSource =
  withIndexPatternFromSettingDataSource({
    indexPatternSetting: 'system_inventory_interfaces.pattern',
    validate: ensureIndexPatternIsCreated(
      mapFieldsFormat({
        'host.network.egress.bytes': 'bytes',
        'host.network.ingress.bytes': 'bytes',
      }),
    ),
    ErrorComponent: withMapErrorPromptErrorEnsureIndexPattern(errorPromptTypes),
  });

export const withSystemInventoryProtocolsDataSource =
  withIndexPatternFromSettingDataSource({
    indexPatternSetting: 'system_inventory_protocols.pattern',
    validate: ensureIndexPatternIsCreated(),
    ErrorComponent: withMapErrorPromptErrorEnsureIndexPattern(errorPromptTypes),
  });

export const withSystemInventoryProcessesDataSource =
  withIndexPatternFromSettingDataSource({
    indexPatternSetting: 'system_inventory_processes.pattern',
    validate: ensureIndexPatternIsCreated(
      mapFieldsFormat({
        'process.parent.pid': 'integer',
        'process.pid': 'integer',
      }),
    ),
    ErrorComponent: withMapErrorPromptErrorEnsureIndexPattern(errorPromptTypes),
  });

export const withSystemInventoryPortsDataSource =
  withIndexPatternFromSettingDataSource({
    indexPatternSetting: 'system_inventory_ports.pattern',
    validate: ensureIndexPatternIsCreated(
      mapFieldsFormat({
        'destination.port': 'integer',
        'process.pid': 'integer',
        'source.port': 'integer',
      }),
    ),
    ErrorComponent: withMapErrorPromptErrorEnsureIndexPattern(errorPromptTypes),
  });

export const withSystemInventoryPackagesDataSource =
  withIndexPatternFromSettingDataSource({
    indexPatternSetting: 'system_inventory_packages.pattern',
    validate: ensureIndexPatternIsCreated(
      mapFieldsFormat({
        'package.size': 'bytes',
      }),
    ),
    ErrorComponent: withMapErrorPromptErrorEnsureIndexPattern(errorPromptTypes),
  });

export const withSystemInventoryHotfixesDataSource =
  withIndexPatternFromSettingDataSource({
    indexPatternSetting: 'system_inventory_hotfixes.pattern',
    validate: ensureIndexPatternIsCreated(),
    ErrorComponent: withMapErrorPromptErrorEnsureIndexPattern(errorPromptTypes),
  });

export const withSystemInventorySystemDataSource =
  withIndexPatternFromSettingDataSource({
    indexPatternSetting: 'system_inventory_system.pattern',
    validate: ensureIndexPatternIsCreated(),
    ErrorComponent: withMapErrorPromptErrorEnsureIndexPattern(errorPromptTypes),
  });

export const withSystemInventoryHardwareDataSource =
  withIndexPatternFromSettingDataSource({
    indexPatternSetting: 'system_inventory_hardware.pattern',
    validate: ensureIndexPatternIsCreated(
      mapFieldsFormat({
        'host.memory.free': 'bytes',
        'host.memory.total': 'bytes',
        'host.memory.used': 'percent',
      }),
    ),
    ErrorComponent: withMapErrorPromptErrorEnsureIndexPattern(errorPromptTypes),
  });
