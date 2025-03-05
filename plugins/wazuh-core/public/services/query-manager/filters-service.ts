import rison from 'rison-node';

export enum FILTER_OPERATOR {
  IS = 'is',
  IS_NOT = 'is not',
  EXISTS = 'exists',
  DOES_NOT_EXISTS = 'does not exists',
  IS_ONE_OF = 'is one of',
  IS_NOT_ONE_OF = 'is not one of',
  IS_BETWEEN = 'is between',
  IS_NOT_BETWEEN = 'is not between',
}
import { TFilter } from './types';

export class FiltersService {
  static removeHiddenFilters(filters: TFilter[]) {
    if (!filters) {
      return filters;
    }

    return filters.filter(
      filter => !filter.meta?.controlledBy?.startsWith('hidden-'),
    );
  }

  static removeFilterByControlledBy(
    controlledByValue: string,
    filters: TFilter[],
  ): TFilter {
    const controlledBy = filters.filter(
      filter => filter.meta?.controlledBy === controlledByValue,
    );

    return controlledBy;
  }

  static removeFilter(
    filters: TFilter[],
    field: string,
    value: string | string[],
  ): TFilter[] {
    const filterIndex = filters.findIndex(f =>
      f.meta?.key === field && f.meta?.value === Array.isArray(value)
        ? value?.join(', ')
        : value,
    );

    if (filterIndex === -1) {
      return;
    }

    filters.splice(filterIndex, 1);

    return filters;
  }

  /**
   * Prevent duplicated filters, cannot exists with the same controlledBy value.
   * This ignore the filters that have the controlledBy value null
   * @param filters
   * @returns
   */
  static removeWithSameControlledBy(filters: TFilter[]): TFilter[] {
    if (!filters) {
      return filters;
    }

    const controlledList: string[] = [];
    const cleanedFilters: TFilter[] = [];

    for (const filter of filters) {
      const controlledBy = filter.meta?.controlledBy;

      if (!controlledBy || !controlledList.includes(controlledBy as string)) {
        controlledList.push(controlledBy as string);
        cleanedFilters.push(filter);
      }
    }

    return cleanedFilters;
  }

  /**
   * Remove filter repeated filters in query property
   * @param filter
   * @returns
   */

  static removeRepeatedFilters(filters: TFilter[]): TFilter[] {
    if (!filters) {
      return filters;
    }

    // eslint-disable-next-line unicorn/no-array-reduce
    const filtersMap = filters.reduce((acc, filter) => {
      const key = JSON.stringify(filter.query);

      if (!acc[key]) {
        acc[key] = filter;
      }

      return acc;
    }, {});

    return Object.values(filtersMap);
  }

  static createFilter(
    type: FILTER_OPERATOR,
    key: string,
    value: string | string[],
    indexPatternId: string,
    controlledBy?: string,
  ) {
    if (
      (type === FILTER_OPERATOR.IS_ONE_OF ||
        type === FILTER_OPERATOR.IS_NOT_ONE_OF) &&
      !Array.isArray(value)
    ) {
      throw new Error('The value must be an array');
    }

    if (
      type === FILTER_OPERATOR.IS_BETWEEN &&
      !Array.isArray(value) &&
      value.length <= 2 &&
      value.some(v => Number.isNaN(Number(v)))
    ) {
      throw new Error('The value must be an array with one or two numbers');
    }

    switch (type) {
      case FILTER_OPERATOR.IS:

      case FILTER_OPERATOR.IS_NOT: {
        return FiltersService.generateFilter(
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
      }

      case FILTER_OPERATOR.EXISTS:

      case FILTER_OPERATOR.DOES_NOT_EXISTS: {
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
          $state: { store: 'appState' },
        };
      }

      case FILTER_OPERATOR.IS_ONE_OF:

      case FILTER_OPERATOR.IS_NOT_ONE_OF: {
        return FiltersService.generateFilter(
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
      }

      case FILTER_OPERATOR.IS_BETWEEN:

      case FILTER_OPERATOR.IS_NOT_BETWEEN: {
        return {
          meta: {
            alias: null,
            disabled: false,
            key: key,
            params: {
              gte: value[0],
              lte: value[1] || Number.NaN,
            },
            negate: type === FILTER_OPERATOR.IS_NOT_BETWEEN,
            type: 'range',
            index: indexPatternId,
            controlledBy,
          },
          range: {
            [key]: {
              gte: value[0],
              lte: value[1] || Number.NaN,
            },
          },
          $state: { store: 'appState' },
        };
      }

      default: {
        throw new Error('Invalid filter type');
      }
    }
  }

  /**
   * Return a simple filter object with the field, value and index pattern received
   *
   * @param field
   * @param value
   * @param indexPatternId
   */
  static generateFilter(
    field: string,
    value: string | string[],
    indexPatternId: string,
    query: TFilter['query'] | TFilter['exists'],
    controlledBy?: string,
    negate = false,
  ) {
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
      $state: { store: 'appState' },
    };
  }

  /**
   * Transform the filter format to the format used in the URL
   * Receives a filter object and returns a filter object with the format used in the URL using rison-node
   */

  static filtersToURLFormat(filters: TFilter[]) {
    const filterCopy = filters ? filters.map(filter => ({ ...filter })) : [];

    return rison.encode({
      filters: filterCopy,
    });
  }
}
