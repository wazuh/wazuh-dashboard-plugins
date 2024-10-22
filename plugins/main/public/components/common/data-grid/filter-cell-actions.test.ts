import { FilterStateStore } from '../../../../common/constants';
import { onFilterCellActions } from './filter-cell-actions';
import { FILTER_OPERATOR } from '../data-source';

const KEY = 'test-key';
const INDEX_PATTERN_ID = 'index-pattern-test';

const buildMatchFilter = (
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
      params: value,
      value: Array.isArray(value) ? value.join(', ') : value,
      negate: operation.includes('not'),
      type: Array.isArray(value) ? 'phrases' : 'phrase',
      index: INDEX_PATTERN_ID,
    },
    query: { match_phrase: { [key]: { query: value } } },
    $state: { store: FilterStateStore.APP_STATE },
  };
};

const buildExistsFilter = (key: string, operation: string) => {
  return {
    exists: { field: key },
    meta: {
      alias: null,
      controlledBy: undefined,
      disabled: false,
      key: key,
      value: 'exists',
      negate: operation.includes('not'),
      type: 'exists',
      index: INDEX_PATTERN_ID,
    },
    $state: { store: FilterStateStore.APP_STATE },
  };
};

describe('onFilterCellActions', () => {
  let setFilters: jest.Mock;

  beforeEach(() => {
    setFilters = jest.fn();
  });

  it('should add single filter with given key and number value (3)', () => {
    const value = 3;
    const operation = FILTER_OPERATOR.IS;

    onFilterCellActions(INDEX_PATTERN_ID, [], setFilters)(
      KEY,
      operation,
      value,
    );

    expect(setFilters).toHaveBeenCalledWith([
      buildMatchFilter(KEY, operation, value),
    ]);
  });

  it('should add single filter with is not operator for given key and number value (3)', () => {
    const value = 3;
    const operation = FILTER_OPERATOR.IS_NOT;

    onFilterCellActions(INDEX_PATTERN_ID, [], setFilters)(
      KEY,
      operation,
      value,
    );

    expect(setFilters).toHaveBeenCalledWith([
      buildMatchFilter(KEY, operation, value),
    ]);
  });

  it('should add single filter with given key and string value (19003)', () => {
    const value = '19003';
    const operation = FILTER_OPERATOR.IS;

    onFilterCellActions(INDEX_PATTERN_ID, [], setFilters)(
      KEY,
      operation,
      value,
    );

    expect(setFilters).toHaveBeenCalledWith([
      buildMatchFilter(KEY, operation, value),
    ]);
  });

  it('should add single filter with is not operator for given key and string value (19003)', () => {
    const value = '19003';
    const operation = FILTER_OPERATOR.IS_NOT;

    onFilterCellActions(INDEX_PATTERN_ID, [], setFilters)(
      KEY,
      operation,
      value,
    );

    expect(setFilters).toHaveBeenCalledWith([
      buildMatchFilter(KEY, operation, value),
    ]);
  });

  it('should add single filter with given key and boolean value (true)', () => {
    const value = true;
    const operation = FILTER_OPERATOR.IS;

    onFilterCellActions(INDEX_PATTERN_ID, [], setFilters)(
      KEY,
      operation,
      value,
    );

    expect(setFilters).toHaveBeenCalledWith([
      buildMatchFilter(KEY, operation, value),
    ]);
  });

  it('should add single filter with is not operator for given key and boolean value (true)', () => {
    const value = true;
    const operation = FILTER_OPERATOR.IS_NOT;

    onFilterCellActions(INDEX_PATTERN_ID, [], setFilters)(
      KEY,
      operation,
      value,
    );

    expect(setFilters).toHaveBeenCalledWith([
      buildMatchFilter(KEY, operation, value),
    ]);
  });

  it('should add single filter with given key and date value (2024-10-19T18:44:40.487Z)', () => {
    const value = '2024-10-19T18:44:40.487Z';
    const operation = FILTER_OPERATOR.IS;

    onFilterCellActions(INDEX_PATTERN_ID, [], setFilters)(
      KEY,
      operation,
      value,
    );

    expect(setFilters).toHaveBeenCalledWith([
      buildMatchFilter(KEY, operation, value),
    ]);
  });

  it('should add single filter is not operator for given key and date value (2024-10-19T18:44:40.487Z)', () => {
    const value = '2024-10-19T18:44:40.487Z';
    const operation = FILTER_OPERATOR.IS_NOT;

    onFilterCellActions(INDEX_PATTERN_ID, [], setFilters)(
      KEY,
      operation,
      value,
    );

    expect(setFilters).toHaveBeenCalledWith([
      buildMatchFilter(KEY, operation, value),
    ]);
  });

  it('should add single filter with given key and string value (10.0.2.2)', () => {
    const value = '10.0.2.2';
    const operation = FILTER_OPERATOR.IS;

    onFilterCellActions(INDEX_PATTERN_ID, [], setFilters)(
      KEY,
      operation,
      value,
    );

    expect(setFilters).toHaveBeenCalledWith([
      buildMatchFilter(KEY, operation, value),
    ]);
  });

  it('should add single filter with is not operator for given key and string value (10.0.2.2)', () => {
    const value = '10.0.2.2';
    const operation = FILTER_OPERATOR.IS_NOT;

    onFilterCellActions(INDEX_PATTERN_ID, [], setFilters)(
      KEY,
      operation,
      value,
    );

    expect(setFilters).toHaveBeenCalledWith([
      buildMatchFilter(KEY, operation, value),
    ]);
  });

  it('should add two filters with given key and value (group1, group2) respectively', () => {
    const values = ['group1', 'group2'];
    const operation = FILTER_OPERATOR.IS;

    onFilterCellActions(INDEX_PATTERN_ID, [], setFilters)(
      KEY,
      operation,
      values,
    );

    expect(setFilters).toHaveBeenCalledWith([
      buildMatchFilter(KEY, operation, values[0]),
      buildMatchFilter(KEY, operation, values[1]),
    ]);
  });

  it('should add two filters with is not operator for given key and value (group1, group2) respectively', () => {
    const values = ['group1', 'group2'];
    const operation = FILTER_OPERATOR.IS_NOT;

    onFilterCellActions(INDEX_PATTERN_ID, [], setFilters)(
      KEY,
      operation,
      values,
    );

    expect(setFilters).toHaveBeenCalledWith([
      buildMatchFilter(KEY, operation, values[0]),
      buildMatchFilter(KEY, operation, values[1]),
    ]);
  });

  it('should add single filter with given key and undefined value', () => {
    const values = undefined;
    const operation = FILTER_OPERATOR.IS;

    onFilterCellActions(INDEX_PATTERN_ID, [], setFilters)(
      KEY,
      operation,
      values,
    );

    expect(setFilters).toHaveBeenCalledWith([
      buildExistsFilter(KEY, FILTER_OPERATOR.DOES_NOT_EXISTS),
    ]);
  });

  it('should add single filter with is not operator for given key and undefined value', () => {
    const values = undefined;
    const operation = FILTER_OPERATOR.IS_NOT;

    onFilterCellActions(INDEX_PATTERN_ID, [], setFilters)(
      KEY,
      operation,
      values,
    );

    expect(setFilters).toHaveBeenCalledWith([
      buildExistsFilter(KEY, FILTER_OPERATOR.EXISTS),
    ]);
  });
});
