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
  validate: ensureIndexPatternIsCreated(
    mapFieldsFormat({
      'destination.port': 'integer',
      'host.memory.free': 'bytes',
      'host.memory.total': 'bytes',
      'host.memory.used': 'bytes',
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

export const withSystemInventoryNetworksDataSource = withIndexPatternFromValue({
  indexPattern: WAZUH_IT_HYGIENE_NETWORKS_PATTERN,
  validate: ensureIndexPatternIsCreated(),
  ErrorComponent: withMapErrorPromptErrorEnsureIndexPattern(errorPromptTypes),
});

export const withSystemInventoryInterfacesDataSource =
  withIndexPatternFromValue({
    indexPattern: WAZUH_IT_HYGIENE_INTERFACES_PATTERN,
    validate: ensureIndexPatternIsCreated(
      mapFieldsFormat({
        'host.network.egress.bytes': 'bytes',
        'host.network.ingress.bytes': 'bytes',
      }),
    ),
    ErrorComponent: withMapErrorPromptErrorEnsureIndexPattern(errorPromptTypes),
  });

export const withSystemInventoryProtocolsDataSource = withIndexPatternFromValue(
  {
    indexPattern: WAZUH_IT_HYGIENE_PROTOCOLS_PATTERN,
    validate: ensureIndexPatternIsCreated(),
    ErrorComponent: withMapErrorPromptErrorEnsureIndexPattern(errorPromptTypes),
  },
);

export const withSystemInventoryProcessesDataSource = withIndexPatternFromValue(
  {
    indexPattern: WAZUH_IT_HYGIENE_PROCESSES_PATTERN,
    validate: ensureIndexPatternIsCreated(
      mapFieldsFormat({
        'process.parent.pid': 'integer',
        'process.pid': 'integer',
      }),
    ),
    ErrorComponent: withMapErrorPromptErrorEnsureIndexPattern(errorPromptTypes),
  },
);

export const withSystemInventoryPortsDataSource = withIndexPatternFromValue({
  indexPattern: WAZUH_IT_HYGIENE_PORTS_PATTERN,
  validate: ensureIndexPatternIsCreated(
    mapFieldsFormat({
      'destination.port': 'integer',
      'process.pid': 'integer',
      'source.port': 'integer',
    }),
  ),
  ErrorComponent: withMapErrorPromptErrorEnsureIndexPattern(errorPromptTypes),
});

export const withSystemInventoryPackagesDataSource = withIndexPatternFromValue({
  indexPattern: WAZUH_IT_HYGIENE_PACKAGES_PATTERN,
  validate: ensureIndexPatternIsCreated(
    mapFieldsFormat({
      'package.size': 'bytes',
    }),
  ),
  ErrorComponent: withMapErrorPromptErrorEnsureIndexPattern(errorPromptTypes),
});

export const withSystemInventoryHotfixesDataSource = withIndexPatternFromValue({
  indexPattern: WAZUH_IT_HYGIENE_HOTFIXES_PATTERN,
  validate: ensureIndexPatternIsCreated(),
  ErrorComponent: withMapErrorPromptErrorEnsureIndexPattern(errorPromptTypes),
});

export const withSystemInventorySystemDataSource = withIndexPatternFromValue({
  indexPattern: WAZUH_IT_HYGIENE_SYSTEM_PATTERN,
  validate: ensureIndexPatternIsCreated(),
  ErrorComponent: withMapErrorPromptErrorEnsureIndexPattern(errorPromptTypes),
});

export const withSystemInventoryHardwareDataSource = withIndexPatternFromValue({
  indexPattern: WAZUH_IT_HYGIENE_HARDWARE_PATTERN,
  validate: ensureIndexPatternIsCreated(
    mapFieldsFormat({
      'host.memory.free': 'bytes',
      'host.memory.total': 'bytes',
      'host.memory.used': 'bytes',
    }),
  ),
  ErrorComponent: withMapErrorPromptErrorEnsureIndexPattern(errorPromptTypes),
});
