import { FilterStateStore } from '../../../../common/constants';
import { onFilterCellActions } from './filter-cell-actions';
import { FILTER_OPERATOR } from '../data-source';

const INDEX_PATTERN_ID = 'index-pattern-test';

const buildFilter = (
  key: string,
  operation: string,
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
      negate: operation === 'is not',
      type: Array.isArray(value) ? 'phrases' : 'phrase',
      index: INDEX_PATTERN_ID,
    },
    query: { match_phrase: { [key]: { query: value } } },
    $state: { store: FilterStateStore.APP_STATE },
  };
};

describe('onFilterCellActions', () => {
  let setFilters: jest.Mock;

  beforeEach(() => {
    setFilters = jest.fn();
  });

  it('should add single filter with given key (rule.level) and number value (3)', () => {
    const key = 'rule.level';
    const value = 3;
    const operation = FILTER_OPERATOR.IS;

    onFilterCellActions(INDEX_PATTERN_ID, [], setFilters)(
      key,
      operation,
      value,
    );

    expect(setFilters).toHaveBeenCalledWith([
      buildFilter(key, operation, value),
    ]);
  });

  it('should add single filter with is not operator for given key (rule.level) and number value (3)', () => {
    const key = 'rule.level';
    const value = 3;
    const operation = FILTER_OPERATOR.IS_NOT;

    onFilterCellActions(INDEX_PATTERN_ID, [], setFilters)(
      key,
      operation,
      value,
    );

    expect(setFilters).toHaveBeenCalledWith([
      buildFilter(key, operation, value),
    ]);
  });

  it('should add single filter with given key (rule.id) and string value (19003)', () => {
    const key = 'rule.id';
    const value = '19003';
    const operation = FILTER_OPERATOR.IS;

    onFilterCellActions(INDEX_PATTERN_ID, [], setFilters)(
      key,
      operation,
      value,
    );

    expect(setFilters).toHaveBeenCalledWith([
      buildFilter(key, operation, value),
    ]);
  });

  it('should add single filter with is not operator for given key (rule.id) and string value (19003)', () => {
    const key = 'rule.id';
    const value = '19003';
    const operation = FILTER_OPERATOR.IS_NOT;

    onFilterCellActions(INDEX_PATTERN_ID, [], setFilters)(
      key,
      operation,
      value,
    );

    expect(setFilters).toHaveBeenCalledWith([
      buildFilter(key, operation, value),
    ]);
  });

  it('should add single filter with given key (timestamp) and date value (2024-10-19T18:44:40.487Z)', () => {
    const key = 'timestamp';
    const value = '2024-10-19T18:44:40.487Z';
    const operation = FILTER_OPERATOR.IS;

    onFilterCellActions(INDEX_PATTERN_ID, [], setFilters)(
      key,
      operation,
      value,
    );

    expect(setFilters).toHaveBeenCalledWith([
      buildFilter(key, operation, value),
    ]);
  });

  it('should add single filter is not operator for given key (timestamp) and date value (2024-10-19T18:44:40.487Z)', () => {
    const key = 'timestamp';
    const value = '2024-10-19T18:44:40.487Z';
    const operation = FILTER_OPERATOR.IS_NOT;

    onFilterCellActions(INDEX_PATTERN_ID, [], setFilters)(
      key,
      operation,
      value,
    );

    expect(setFilters).toHaveBeenCalledWith([
      buildFilter(key, operation, value),
    ]);
  });
});
