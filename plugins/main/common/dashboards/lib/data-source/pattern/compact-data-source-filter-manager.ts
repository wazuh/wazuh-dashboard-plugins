import { FilterStateStore } from '../../../../constants';

type tFilter = /*unresolved*/ any;

export enum FILTER_OPERATOR {
  IS_NOT = 'is not',
  EXISTS = 'exists',
  DOES_NOT_EXISTS = 'does not exists',
}

export class CompactDataSourceFilterManager {
  /******************************************************************/
  /********************** FILTERS FACTORY ***************************/
  /******************************************************************/

  static createFilter(
    type: FILTER_OPERATOR,
    key: string,
    value: string | string[] | any,
    indexPatternId: string,
    controlledBy?: string,
  ) {
    switch (type) {
      case FILTER_OPERATOR.IS_NOT:
        return this.generateFilter(
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
      default:
        throw new Error('Invalid filter type');
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
    query: tFilter['query'] | tFilter['exists'],
    controlledBy?: string,
    negate: boolean = false,
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
      $state: { store: FilterStateStore.APP_STATE },
    };
  }
}
