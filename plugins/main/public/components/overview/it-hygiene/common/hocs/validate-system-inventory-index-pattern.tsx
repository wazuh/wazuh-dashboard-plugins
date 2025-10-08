import React from 'react';
import { webDocumentationLink } from '../../../../../../common/services/web_documentation';
import { EuiLink } from '@elastic/eui';
import {
  ensureIndexPatternIsCreated,
  ERROR_NO_INDICES_FOUND,
  mapFieldsFormat,
  withIndexPatternFromValue,
  withMapErrorPromptErrorEnsureIndexPattern,
} from '../../../../common/hocs';
import {
  WAZUH_IT_HYGIENE_HARDWARE_PATTERN,
  WAZUH_IT_HYGIENE_HOTFIXES_PATTERN,
  WAZUH_IT_HYGIENE_INTERFACES_PATTERN,
  WAZUH_IT_HYGIENE_NETWORKS_PATTERN,
  WAZUH_IT_HYGIENE_PACKAGES_PATTERN,
  WAZUH_IT_HYGIENE_PATTERN,
  WAZUH_IT_HYGIENE_PORTS_PATTERN,
  WAZUH_IT_HYGIENE_PROCESSES_PATTERN,
  WAZUH_IT_HYGIENE_PROTOCOLS_PATTERN,
  WAZUH_IT_HYGIENE_SYSTEM_PATTERN,
  WAZUH_IT_HYGIENE_USERS_PATTERN,
  WAZUH_IT_HYGIENE_GROUPS_PATTERN,
  WAZUH_IT_HYGIENE_SERVICES_PATTERN,
  WAZUH_IT_HYGIENE_BROWSER_EXTENSIONS_PATTERN,
  WAZUH_INDEX_TYPE_STATES_INVENTORY_HARDWARE,
  WAZUH_INDEX_TYPE_STATES_INVENTORY_HOTFIXES,
  WAZUH_INDEX_TYPE_STATES_INVENTORY_INTERFACES,
  WAZUH_INDEX_TYPE_STATES_INVENTORY_NETWORKS,
  WAZUH_INDEX_TYPE_STATES_INVENTORY_PACKAGES,
  WAZUH_INDEX_TYPE_STATES_INVENTORY_PORTS,
  WAZUH_INDEX_TYPE_STATES_INVENTORY_PROCESSES,
  WAZUH_INDEX_TYPE_STATES_INVENTORY_PROTOCOLS,
  WAZUH_INDEX_TYPE_STATES_INVENTORY_SYSTEM,
  WAZUH_INDEX_TYPE_STATES_INVENTORY_USERS,
  WAZUH_INDEX_TYPE_STATES_INVENTORY_GROUPS,
  WAZUH_INDEX_TYPE_STATES_INVENTORY_SERVICES,
  WAZUH_INDEX_TYPE_STATES_INVENTORY_BROWSER_EXTENSIONS,
} from '../../../../../../common/constants';

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

export const withSystemInventoryDataSource = withIndexPatternFromValue({
  indexPattern: WAZUH_IT_HYGIENE_PATTERN,
  validate: ensureIndexPatternIsCreated({
    indexType: WAZUH_INDEX_TYPE_STATES_INVENTORY_SYSTEM,
    ...mapFieldsFormat({
      'destination.port': 'integer',
      'host.memory.free': 'bytes',
      'host.memory.total': 'bytes',
      'host.memory.used': 'bytes',
      'host.memory.usage': 'percent',
      'host.network.egress.bytes': 'bytes',
      'host.network.ingress.bytes': 'bytes',
      'package.size': 'bytes',
      'process.parent.pid': 'integer',
      'process.pid': 'integer',
      'source.port': 'integer',
    }),
  }),
  ErrorComponent: withMapErrorPromptErrorEnsureIndexPattern(errorPromptTypes),
});

export const withSystemInventoryNetworksDataSource = withIndexPatternFromValue({
  indexPattern: WAZUH_IT_HYGIENE_NETWORKS_PATTERN,
  validate: ensureIndexPatternIsCreated({
    indexType: WAZUH_INDEX_TYPE_STATES_INVENTORY_NETWORKS,
  }),
  ErrorComponent: withMapErrorPromptErrorEnsureIndexPattern(errorPromptTypes),
});

export const withSystemInventoryInterfacesDataSource =
  withIndexPatternFromValue({
    indexPattern: WAZUH_IT_HYGIENE_INTERFACES_PATTERN,
    validate: ensureIndexPatternIsCreated({
      indexType: WAZUH_INDEX_TYPE_STATES_INVENTORY_INTERFACES,
      ...mapFieldsFormat({
        'host.network.egress.bytes': 'bytes',
        'host.network.ingress.bytes': 'bytes',
      }),
    }),
    ErrorComponent: withMapErrorPromptErrorEnsureIndexPattern(errorPromptTypes),
  });

export const withSystemInventoryProtocolsDataSource = withIndexPatternFromValue(
  {
    indexPattern: WAZUH_IT_HYGIENE_PROTOCOLS_PATTERN,
    validate: ensureIndexPatternIsCreated({
      indexType: WAZUH_INDEX_TYPE_STATES_INVENTORY_PROTOCOLS,
    }),
    ErrorComponent: withMapErrorPromptErrorEnsureIndexPattern(errorPromptTypes),
  },
);

export const withSystemInventoryProcessesDataSource = withIndexPatternFromValue(
  {
    indexPattern: WAZUH_IT_HYGIENE_PROCESSES_PATTERN,
    validate: ensureIndexPatternIsCreated({
      indexType: WAZUH_INDEX_TYPE_STATES_INVENTORY_PROCESSES,
      ...mapFieldsFormat({
        'process.parent.pid': 'integer',
        'process.pid': 'integer',
      }),
    }),
    ErrorComponent: withMapErrorPromptErrorEnsureIndexPattern(errorPromptTypes),
  },
);

export const withSystemInventoryUsersDataSource = withIndexPatternFromValue({
  indexPattern: WAZUH_IT_HYGIENE_USERS_PATTERN,
  validate: ensureIndexPatternIsCreated({
    indexType: WAZUH_INDEX_TYPE_STATES_INVENTORY_USERS,
  }),
  ErrorComponent: withMapErrorPromptErrorEnsureIndexPattern(errorPromptTypes),
});

export const withSystemInventoryGroupsDataSource = withIndexPatternFromValue({
  indexPattern: WAZUH_IT_HYGIENE_GROUPS_PATTERN,
  validate: ensureIndexPatternIsCreated({
    indexType: WAZUH_INDEX_TYPE_STATES_INVENTORY_GROUPS,
  }),
  ErrorComponent: withMapErrorPromptErrorEnsureIndexPattern(errorPromptTypes),
});

export const withSystemInventoryTrafficDataSource = withIndexPatternFromValue({
  indexPattern: WAZUH_IT_HYGIENE_PORTS_PATTERN,
  validate: ensureIndexPatternIsCreated({
    indexType: WAZUH_INDEX_TYPE_STATES_INVENTORY_PORTS,
    ...mapFieldsFormat({
      'destination.port': 'integer',
      'process.pid': 'integer',
      'source.port': 'integer',
    }),
  }),
  ErrorComponent: withMapErrorPromptErrorEnsureIndexPattern(errorPromptTypes),
});

export const withSystemInventoryPackagesDataSource = withIndexPatternFromValue({
  indexPattern: WAZUH_IT_HYGIENE_PACKAGES_PATTERN,
  validate: ensureIndexPatternIsCreated({
    indexType: WAZUH_INDEX_TYPE_STATES_INVENTORY_PACKAGES,
    ...mapFieldsFormat({
      'package.size': 'bytes',
    }),
  }),
  ErrorComponent: withMapErrorPromptErrorEnsureIndexPattern(errorPromptTypes),
});

export const withSystemInventoryHotfixesDataSource = withIndexPatternFromValue({
  indexPattern: WAZUH_IT_HYGIENE_HOTFIXES_PATTERN,
  validate: ensureIndexPatternIsCreated({
    indexType: WAZUH_INDEX_TYPE_STATES_INVENTORY_HOTFIXES,
  }),
  ErrorComponent: withMapErrorPromptErrorEnsureIndexPattern(errorPromptTypes),
});

export const withSystemInventorySystemDataSource = withIndexPatternFromValue({
  indexPattern: WAZUH_IT_HYGIENE_SYSTEM_PATTERN,
  validate: ensureIndexPatternIsCreated({
    indexType: WAZUH_INDEX_TYPE_STATES_INVENTORY_SYSTEM,
  }),
  ErrorComponent: withMapErrorPromptErrorEnsureIndexPattern(errorPromptTypes),
});

export const withSystemInventoryHardwareDataSource = withIndexPatternFromValue({
  indexPattern: WAZUH_IT_HYGIENE_HARDWARE_PATTERN,
  validate: ensureIndexPatternIsCreated({
    indexType: WAZUH_INDEX_TYPE_STATES_INVENTORY_HARDWARE,
    ...mapFieldsFormat({
      'host.memory.free': 'bytes',
      'host.memory.total': 'bytes',
      'host.memory.used': 'bytes',
      'host.memory.usage': 'percent',
    }),
  }),
  ErrorComponent: withMapErrorPromptErrorEnsureIndexPattern(errorPromptTypes),
});

export const withSystemInventoryServicesDataSource = withIndexPatternFromValue({
  indexPattern: WAZUH_IT_HYGIENE_SERVICES_PATTERN,
  validate: ensureIndexPatternIsCreated({
    indexType: WAZUH_INDEX_TYPE_STATES_INVENTORY_SERVICES,
  }),
  ErrorComponent: withMapErrorPromptErrorEnsureIndexPattern(errorPromptTypes),
});

export const withSystemInventoryBrowserExtensionsDataSource =
  withIndexPatternFromValue({
    indexPattern: WAZUH_IT_HYGIENE_BROWSER_EXTENSIONS_PATTERN,
    validate: ensureIndexPatternIsCreated({
      indexType: WAZUH_INDEX_TYPE_STATES_INVENTORY_BROWSER_EXTENSIONS,
    }),
    ErrorComponent: withMapErrorPromptErrorEnsureIndexPattern(errorPromptTypes),
  });
