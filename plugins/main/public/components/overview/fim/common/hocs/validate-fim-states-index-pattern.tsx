import React from 'react';
import {
  existsIndices,
  existsIndexPattern,
  createIndexPattern,
} from '../../../../../react-services';
import { EuiButton, EuiEmptyPrompt, EuiLink } from '@elastic/eui';
import { webDocumentationLink } from '../../../../../../common/services/web_documentation';
import { HTTP_STATUS_CODES } from '../../../../../../common/constants';
import { withIndexPatternFromSettingDataSource } from '../../../system-inventory/common/hocs/validate-index-pattern';

const INDEX_PATTERN_CREATION_NO_INDEX = 'INDEX_PATTERN_CREATION_NO_INDEX';

export async function validateFIMStateDataSources({ indexPatternID }) {
  try {
    // Check the existence of related index pattern
    const existIndexPattern = await existsIndexPattern(indexPatternID);
    const indexPattern = existIndexPattern;

    // If the index pattern does not exist, then check the existence of index
    if (existIndexPattern?.error?.statusCode === HTTP_STATUS_CODES.NOT_FOUND) {
      // Check the existence of indices
      const { exist, fields } = await existsIndices(indexPatternID);

      if (!exist) {
        return {
          ok: true,
          data: {
            error: {
              title:
                'File integrity monitoring could be disabled or has a problem',
              message: `No matching indices were found for [${indexPatternID}] index pattern.`,
              type: INDEX_PATTERN_CREATION_NO_INDEX,
            },
          },
        };
      }
      // Define fieldFormatMap
      const fieldFormatMap = fields?.some(({ name }) => name === 'file.size')
        ? { fieldFormatMap: `{"file.size":{"id":"bytes"}}` } // Add format map for file.size field
        : {};

      const extraAttributes = {
        ...fieldFormatMap,
      };

      // If some index matches the index pattern, then create the index pattern
      const resultCreateIndexPattern = await createIndexPattern(
        indexPatternID,
        fields,
        extraAttributes,
      );
      if (resultCreateIndexPattern?.error) {
        return {
          ok: true,
          data: {
            error: {
              title: `There was a problem creating the [${indexPatternID}] index pattern`,
              message: resultCreateIndexPattern?.error,
            },
          },
        };
      }
    }
    return {
      ok: false,
      data: { indexPattern },
    };
  } catch (error) {
    return {
      ok: true,
      data: {
        error: {
          title:
            'There was a problem validating the file integrity monitoring data source',
          message: error.message,
        },
      },
    };
  }
}

const errorPromptBody = {
  [INDEX_PATTERN_CREATION_NO_INDEX]: (props: {
    error: { message: React.ReactNode };
  }) => (
    <>
      <p>{props.error.message}</p>
      <p>
        If the file integrity monitoring is enabled, then this could be caused
        by an error in: server side, server-indexer connection, indexer side,
        index creation, index data, index pattern name misconfiguration or user
        permissions related to read the inventory indices.
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
  default: ({ error: { message } }) => <p>{message}</p>,
};

export const PromptCheckIndex = props => {
  const { refresh } = props;
  const { title } = props?.error;
  const ComponentBody =
    errorPromptBody?.[props?.error?.type] || errorPromptBody.default;

  const body = <ComponentBody {...props}></ComponentBody>;

  return (
    <EuiEmptyPrompt
      iconType='alert'
      title={<h2>{title}</h2>}
      body={body}
      actions={
        <EuiButton color='primary' fill onClick={refresh}>
          Refresh
        </EuiButton>
      }
    />
  );
};

export const withFIMFilesDataSource = withIndexPatternFromSettingDataSource({
  indexPatternSetting: 'fim_files.pattern',
  PromptError: PromptCheckIndex,
  validate: validateFIMStateDataSources,
});

export const withFIMRegistriesDataSource =
  withIndexPatternFromSettingDataSource({
    indexPatternSetting: 'fim_registries.pattern',
    PromptError: PromptCheckIndex,
    validate: validateFIMStateDataSources,
  });
