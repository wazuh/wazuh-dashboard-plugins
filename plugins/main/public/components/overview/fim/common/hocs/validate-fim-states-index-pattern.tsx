import React from 'react';
import { EuiLink } from '@elastic/eui';
import { webDocumentationLink } from '../../../../../../common/services/web_documentation';
import {
  ensureIndexPatternIsCreated,
  withIndexPatternFromValue,
  ERROR_NO_INDICES_FOUND,
  withMapErrorPromptErrorEnsureIndexPattern,
  mapFieldsFormat,
} from '../../../../common/hocs/with-index-pattern';
import {
  WAZUH_FIM_FILES_PATTERN,
  WAZUH_FIM_REGISTRY_KEYS_PATTERN,
  WAZUH_FIM_REGISTRY_VALUES_PATTERN,
} from '../../../../../../common/constants';

const errorPromptTypes = {
  [ERROR_NO_INDICES_FOUND]: {
    title: () => 'File integrity monitoring could be disabled or has a problem',
    body: ({ message }: { message: React.ReactNode }) => (
      <>
        <p>{message}</p>
        <p>
          If the file integrity monitoring is enabled, then this could be caused
          by an error in: server side, server-indexer connection, indexer side,
          index creation, index data, index pattern name misconfiguration or
          user permissions related to read the inventory indices.
        </p>
        <p>
          Please, review the server and indexer logs. Also, you can check the{' '}
          <EuiLink
            href={webDocumentationLink(
              'user-manual/capabilities/file-integrity/index.html',
            )}
            target='_blank'
            rel='noopener noreferrer'
            external
          >
            file integrity monitoring documentation.
          </EuiLink>
        </p>
      </>
    ),
  },
  default: {
    title: ({ title }: { title: string }) => title,
    body: ({ message }) => <p>{message}</p>,
  },
};

export const withFIMFilesDataSource = withIndexPatternFromValue({
  indexPattern: WAZUH_FIM_FILES_PATTERN,
  ErrorComponent: withMapErrorPromptErrorEnsureIndexPattern(errorPromptTypes),
  validate: ensureIndexPatternIsCreated(
    mapFieldsFormat({
      'file.size': 'bytes',
    }),
  ),
});

export const withFIMRegistryKeysDataSource = withIndexPatternFromValue({
  indexPattern: WAZUH_FIM_REGISTRY_KEYS_PATTERN,
  ErrorComponent: withMapErrorPromptErrorEnsureIndexPattern(errorPromptTypes),
  validate: ensureIndexPatternIsCreated(),
});

export const withFIMRegistryValuesDataSource = withIndexPatternFromValue({
  indexPattern: WAZUH_FIM_REGISTRY_VALUES_PATTERN,
  ErrorComponent: withMapErrorPromptErrorEnsureIndexPattern(errorPromptTypes),
  validate: ensureIndexPatternIsCreated(
    mapFieldsFormat({
      'registry.size': 'bytes',
    }),
  ),
});
