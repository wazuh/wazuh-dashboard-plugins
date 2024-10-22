import { FilterStateStore } from '../../../../common/constants';
import { Filter } from '../../../../../../src/plugins/data/common';
import { onFilterCellActions } from './filter-cell-actions';
import { FILTER_OPERATOR } from '../data-source';

const INDEX_PATTERN_ID = 'index-pattern-test';

const buildFilter = (
  type: string,
  key: string,
  value: string | string[] | any,
) => {
  return {
    meta: {
      alias: null,
      controlledBy: undefined,
      disabled: false,
      key: key,
      value: Array.isArray(value) ? value.join(', ') : value,
      params: value,
      negate: type === 'is not',
      type: Array.isArray(value) ? 'phrases' : 'phrase',
      index: INDEX_PATTERN_ID,
    },
    query: { match_phrase: { [key]: { query: value } } },
    $state: { store: FilterStateStore.APP_STATE },
  };
};

describe('onFilterCellActions', () => {
  let filters: Filter[];
  let setFilters: jest.Mock;

  beforeEach(() => {
    filters = [];
    setFilters = jest.fn();
  });

  it('should add filter with given key (rule.level) and number value (3)', () => {
    const key = 'rule.level';
    const value = 3;
    onFilterCellActions(INDEX_PATTERN_ID, filters, setFilters)(
      key,
      FILTER_OPERATOR.IS,
      value,
    );

    expect(setFilters).toHaveBeenCalledWith([
      ...filters,
      buildFilter(FILTER_OPERATOR.IS, key, value),
    ]);
  });

  it('should add filter with is not operator for key and number value (3)', () => {
    const key = 'rule.level';
    const value = 3;

    onFilterCellActions(INDEX_PATTERN_ID, filters, setFilters)(
      key,
      FILTER_OPERATOR.IS_NOT,
      value,
    );

    expect(setFilters).toHaveBeenCalledWith([
      ...filters,
      buildFilter(FILTER_OPERATOR.IS_NOT, key, value),
    ]);
  });
});
