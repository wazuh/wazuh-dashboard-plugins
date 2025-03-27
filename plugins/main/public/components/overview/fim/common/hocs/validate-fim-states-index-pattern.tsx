import React from 'react';
import { EuiLink } from '@elastic/eui';
import { webDocumentationLink } from '../../../../../../common/services/web_documentation';
import {
  ensureIndexPatternIsCreated,
  withIndexPatternFromSettingDataSource,
  ERROR_NO_INDICES_FOUND,
  withMapErrorPromptErrorEnsureIndexPattern,
} from '../../../../common/hocs/with-index-pattern';

const errorPromptTypes = {
  [ERROR_NO_INDICES_FOUND]: {
    title: () => (
      <h2>File integrity monitoring could be disabled or has a problem</h2>
    ),
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
              'user-manual/capabilities/vulnerability-detection/index.html',
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

export const withFIMFilesDataSource = withIndexPatternFromSettingDataSource({
  indexPatternSetting: 'fim_files.pattern',
  ErrorComponent: withMapErrorPromptErrorEnsureIndexPattern(errorPromptTypes),
  validate: ensureIndexPatternIsCreated({
    mapSavedObjectAttributesCreation: ({ fields }) => {
      return fields?.some(({ name }) => name === 'file.size')
        ? { fieldFormatMap: `{"file.size":{"id":"bytes"}}` } // Add format map for file.size field
        : {};
    },
  }),
});

export const withFIMRegistriesDataSource =
  withIndexPatternFromSettingDataSource({
    indexPatternSetting: 'fim_registries.pattern',
    ErrorComponent: withMapErrorPromptErrorEnsureIndexPattern(errorPromptTypes),
    validate: ensureIndexPatternIsCreated(),
  });
