import { Filter } from '../../../../../../../../../src/plugins/data/public';
import { FILTER_OPERATOR, FilterStateStore } from './filter-operators';

/**
 * Creates a base template for a filter with the required metadata
 *
 * @param field - Field on which the filter will be applied
 * @param value - Value or values for the filter (can be string or array of strings)
 * @param indexPatternId - ID of the index pattern to which the field belongs
 * @param query - Query object that defines the filter condition
 * @param controlledBy - Optional identifier of the component that controls this filter
 * @param negate - Indicates if the filter should be negated (default: false)
 * @returns A Filter object configured according to the provided parameters
 */
export const filterTemplate = (
  field: string,
  value: string | string[],
  indexPatternId: string,
  query: any,
  controlledBy?: string,
  negate: boolean = false,
): Filter => {
  return {
    meta: {
      alias: null,
      disabled: false,
      key: field,
      value: Array.isArray(value) ? value.join(', ') : value,
      params: value,
      negate,
      type: Array.isArray(value) ? 'phrases' : 'phrase',
      index: indexPatternId,
      controlledBy,
    },
    ...query,
    $state: { store: FilterStateStore.APP_STATE },
  };
};

/**
 * Interface for filter generation parameters
 */
export interface GenerateFilterParams {
  /** Filter operator type */
  type: FILTER_OPERATOR;
  /** Name of the field on which the filter will be applied */
  key: string;
  /** Value or values for the filter (string, array of strings, or array of numbers for ranges) */
  value: string | string[] | any;
  /** ID of the index pattern to which the field belongs */
  indexPatternId: string;
  /** Optional identifier of the component that controls this filter */
  controlledBy?: string;
}

/**
 * Generates a complete filter based on the specified operator type
 *
 * This function creates different types of filters according to the selected operator:
 * - IS/IS_NOT: Exact match or negation filters
 * - EXISTS/DOES_NOT_EXISTS: Field existence filters
 * - IS_ONE_OF/IS_NOT_ONE_OF: Filters for multiple possible values
 * - IS_BETWEEN/IS_NOT_BETWEEN: Numeric range filters
 *
 * @param params - Object with the necessary parameters to generate the filter
 * @returns A Filter object configured according to the operator and provided parameters
 * @throws Error if the value type is not compatible with the selected operator
 */
export const generateFilter = (params: GenerateFilterParams): Filter => {
  const { type, key, value, indexPatternId, controlledBy } = params;

  if (
    (type === FILTER_OPERATOR.IS_ONE_OF || type === FILTER_OPERATOR.IS_NOT_ONE_OF) &&
    !Array.isArray(value)
  ) {
    throw new Error('The value must be an array for IS_ONE_OF and IS_NOT_ONE_OF operators');
  }

  if (
    type === FILTER_OPERATOR.IS_BETWEEN &&
    (!Array.isArray(value) || value.length > 2 || value.length === 0 || value.some(v => isNaN(Number(v))))
  ) {
    throw new Error('The value must be an array with one or two numbers for the IS_BETWEEN operator');
  }

  switch (type) {
    case FILTER_OPERATOR.IS:
    case FILTER_OPERATOR.IS_NOT:
      return filterTemplate(
        key,
        value,
        indexPatternId,
        {
          query: {
            match_phrase: {
              [key]: {
                query: value,
              },
            },
          },
        },
        controlledBy,
        type === FILTER_OPERATOR.IS_NOT,
      );
    case FILTER_OPERATOR.EXISTS:
    case FILTER_OPERATOR.DOES_NOT_EXISTS:
      return {
        meta: {
          alias: null,
          disabled: false,
          key: key,
          value: 'exists',
          negate: type === FILTER_OPERATOR.DOES_NOT_EXISTS,
          type: 'exists',
          index: indexPatternId,
          controlledBy,
        },
        exists: { field: key },
        $state: { store: FilterStateStore.APP_STATE },
      };
    case FILTER_OPERATOR.IS_ONE_OF:
    case FILTER_OPERATOR.IS_NOT_ONE_OF:
      return filterTemplate(
        key,
        value,
        indexPatternId,
        {
          query: {
            bool: {
              minimum_should_match: 1,
              should: value.map((v: string) => ({
                match_phrase: {
                  [key]: {
                    query: v,
                  },
                },
              })),
            },
          },
        },
        controlledBy,
        type === FILTER_OPERATOR.IS_NOT_ONE_OF,
      );
    case FILTER_OPERATOR.IS_BETWEEN:
    case FILTER_OPERATOR.IS_NOT_BETWEEN:
      return {
        meta: {
          alias: null,
          disabled: false,
          key: key,
          params: {
            gte: value[0],
            lte: value[1] || NaN,
          },
          negate: type === FILTER_OPERATOR.IS_NOT_BETWEEN,
          type: 'range',
          index: indexPatternId,
          controlledBy,
        },
        range: {
          [key]: {
            gte: value[0],
            lte: value[1] || NaN,
          },
        },
        $state: { store: FilterStateStore.APP_STATE },
      };
    default:
      throw new Error('Invalid filter type');
  }
};
