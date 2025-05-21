import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withGuardAsync } from './withGuard';
import {
  existsIndices,
  existsIndexPattern,
  createIndexPattern,
} from '../../../react-services';
import { EuiButton, EuiEmptyPrompt } from '@elastic/eui';
import { LoadingSpinnerDataSource } from '../loading/loading-spinner-data-source';
import { HTTP_STATUS_CODES } from '../../../../common/constants';

export const ERROR_NO_INDICES_FOUND = 'ERROR_NO_INDICES_FOUND';
export const ERROR_INDEX_PATTERN_CREATION = 'ERROR_INDEX_PATTERN_CREATION';
export const ERROR_ENSURE_INDEX_PATTERN = 'ERROR_ENSURE_INDEX_PATTERN';

export const ensureIndexPatternIsCreated =
  ({
    mapSavedObjectAttributesCreation,
  }: {
    mapSavedObjectAttributesCreation?: (parameters: {
      indexPatternID: string;
      fields: any[];
    }) => any;
  } = {}) =>
  async ({ indexPatternID }) => {
    try {
      // Check the existence of related index pattern
      const existIndexPattern = await existsIndexPattern(indexPatternID);
      const indexPattern = existIndexPattern;

      // If the index pattern does not exist, then check the existence of index
      if (
        existIndexPattern?.error?.statusCode === HTTP_STATUS_CODES.NOT_FOUND
      ) {
        // Check the existence of indices
        const { exist, fields } = await existsIndices(indexPatternID);

        if (!exist) {
          return {
            ok: true,
            data: {
              error: {
                title: 'No matching indices',
                message: `No matching indices were found for [${indexPatternID}] index pattern.`,
                type: ERROR_NO_INDICES_FOUND,
              },
            },
          };
        }
        // Define fieldFormatMap
        const extraAttributes = mapSavedObjectAttributesCreation
          ? mapSavedObjectAttributesCreation({ indexPatternID, fields })
          : {};

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
                type: ERROR_INDEX_PATTERN_CREATION,
              },
            },
          };
        }
      }
      return {
        ok: false,
        data: {
          indexPattern,
        },
      };
    } catch (error) {
      return {
        ok: true,
        data: {
          error: {
            title: 'There was a problem validating the data source',
            message: error.message,
            type: ERROR_ENSURE_INDEX_PATTERN,
          },
        },
      };
    }
  };

interface WithIndexPatternFromSettingDataSourceError {
  title: string;
  message: string;
  type: string;
}
export interface WithIndexPatternFromSettingDataSourceParams {
  indexPatternSetting: string;
  ErrorComponent?: React.ElementRef;
  LoadingComponent?: React.ElementRef;
  validate?: (context: { indexPatternID: string }) => Promise<{
    ok: boolean;
    data: {
      error?: WithIndexPatternFromSettingDataSourceError;
    };
  }>;
}

interface MapErrorTypes {
  default: {
    title: (title: string) => string;
    body: () => React.Node;
  };
  [key: string]: {
    title: (title: string) => string;
    body: () => React.Node;
  };
}
const mapErrorPromptComponents = (
  errorTypes: MapErrorTypes,
  error: WithIndexPatternFromSettingDataSourceError,
) => {
  const { type, title, message } = error;
  const ComponentTitle = errorTypes?.[type]?.title || errorTypes.default.title;
  const ComponentBody = errorTypes?.[type]?.body || errorTypes.default.body;

  return {
    title: <h2>{ComponentTitle(title)}</h2>,
    body: <ComponentBody title={title} message={message} />,
  };
};

export const withMapErrorPromptErrorEnsureIndexPattern =
  // eslint-disable-next-line react/display-name
  (mapErrorTypes: MapErrorTypes) => props => {
    const { title, body } = mapErrorPromptComponents(
      mapErrorTypes,
      props?.error,
    );

    return (
      <EuiEmptyPrompt
        iconType='alert'
        title={title}
        body={body}
        actions={
          <EuiButton color='primary' fill onClick={props.check}>
            Refresh
          </EuiButton>
        }
      />
    );
  };

export const withIndexPatternFromSettingDataSource = ({
  indexPatternSetting,
  validate,
  ErrorComponent,
  LoadingComponent = LoadingSpinnerDataSource,
}: WithIndexPatternFromSettingDataSourceParams) => {
  const mapStateToProps = state => {
    return {
      indexPatternID: state.appConfig.data[indexPatternSetting],
    };
  };

  return compose(
    connect(mapStateToProps),
    withGuardAsync(validate, ErrorComponent, LoadingComponent),
  );
};

export const withIndexPatternsFromSettingDataSource = ({
  indexPatternSettings,
  validate,
  ErrorComponent,
  LoadingComponent = LoadingSpinnerDataSource,
}: WithIndexPatternFromSettingDataSourceParams) => {
  const mapStateToProps = state => {
    return {
      indexPatternIDs: indexPatternSettings.map(
        indexPatternSetting => state.appConfig.data[indexPatternSetting],
      ),
    };
  };

  return compose(
    connect(mapStateToProps),
    withGuardAsync(
      async ({ indexPatternIDs }) => {
        const results = await Promise.all(
          indexPatternIDs.map(indexPatternID => validate({ indexPatternID })),
        );
        const result = results.reduce(
          (accum, result) => {
            return {
              ok: result.ok || accum.ok,
              data: {
                indexPatterns: [
                  ...accum?.data?.indexPatterns,
                  ...(result?.data?.indexPattern
                    ? [result.data.indexPattern]
                    : [null]),
                ],
                error: {
                  title: accum?.data?.error?.title,
                  message: accum?.data?.error?.message,
                  errors: [
                    ...accum.data.error.errors,
                    ...(result.data?.error ? [result.data.error] : []),
                  ],
                },
              },
            };
          },
          {
            ok: false,
            data: {
              indexPatterns: [],
              error: {
                title: 'Error checking the data sources',
                message: '',
                errors: [],
              },
            },
          },
        );
        return result;
      },
      ErrorComponent,
      LoadingComponent,
    ),
  );
};

const fieldMappers = {
  bytes: ({ type }) => (type === 'number' ? { id: 'bytes' } : undefined),
  // integer, remove thousands and decimals separator thorugh the params.pattern
  integer: ({ type }) =>
    type === 'number' ? { id: 'number', params: { pattern: '0' } } : undefined,
  percent: ({ type }) => {
    console.log({ type });
    return type === 'number'
      ? { id: 'percent', params: { pattern: '0,0.[00]%' } }
      : undefined;
  },
};

export function mapFieldsFormat(expectedFields: {
  [key: keyof typeof fieldMappers]: (field: any) => any;
}) {
  return {
    mapSavedObjectAttributesCreation: ({ fields }) => {
      const fieldsToMap = Object.keys(expectedFields);
      console.log({ fieldsToMap });
      const mappedFields = fields
        ?.filter(({ name }) => fieldsToMap.includes(name))
        .map(field => {
          const { name } = field;
          const mapper = fieldMappers[expectedFields[name]] || undefined;

          if (!mapper) {
            return undefined;
          }
          const result = mapper(field);
          if (!result) {
            return undefined;
          }
          return [name, result];
        })
        .filter(Boolean);

      if (mappedFields.length) {
        return {
          fieldFormatMap: JSON.stringify(Object.fromEntries(mappedFields)),
        }; // Add format map for expected fields
      }
      return {};
    },
  };
}
