import { FilterStateStore } from '../../../../common/constants';
import { onFilterCellActions } from './filter-cell-actions';
import { FILTER_OPERATOR } from '../data-source';

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
      buildMatchFilter(key, operation, value),
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
      buildMatchFilter(key, operation, value),
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
      buildMatchFilter(key, operation, value),
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
      buildMatchFilter(key, operation, value),
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
      buildMatchFilter(key, operation, value),
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
      buildMatchFilter(key, operation, value),
    ]);
  });

  it('should add single filter with given key (data.aws.resource.instanceDetails.networkInterfaces.privateIpAddress) and string value (10.0.2.2)', () => {
    const key =
      'data.aws.resource.instanceDetails.networkInterfaces.privateIpAddress';
    const value = '10.0.2.2';
    const operation = FILTER_OPERATOR.IS;

    onFilterCellActions(INDEX_PATTERN_ID, [], setFilters)(
      key,
      operation,
      value,
    );

    expect(setFilters).toHaveBeenCalledWith([
      buildMatchFilter(key, operation, value),
    ]);
  });

  it('should add single filter with is not operator for given key (data.aws.resource.instanceDetails.networkInterfaces.privateIpAddress) and string value (10.0.2.2)', () => {
    const key =
      'data.aws.resource.instanceDetails.networkInterfaces.privateIpAddress';
    const value = '10.0.2.2';
    const operation = FILTER_OPERATOR.IS_NOT;

    onFilterCellActions(INDEX_PATTERN_ID, [], setFilters)(
      key,
      operation,
      value,
    );

    expect(setFilters).toHaveBeenCalledWith([
      buildMatchFilter(key, operation, value),
    ]);
  });

  it('should add two filters with given key (rule.groups) and value (group1, group2) respectively', () => {
    const key = 'rule.groups';
    const values = ['group1', 'group2'];
    const operation = FILTER_OPERATOR.IS;

    onFilterCellActions(INDEX_PATTERN_ID, [], setFilters)(
      key,
      operation,
      values,
    );

    expect(setFilters).toHaveBeenCalledWith([
      buildMatchFilter(key, operation, values[0]),
      buildMatchFilter(key, operation, values[1]),
    ]);
  });

  it('should add two filters with is not operator for given key (rule.groups) and value (group1, group2) respectively', () => {
    const key = 'rule.groups';
    const values = ['group1', 'group2'];
    const operation = FILTER_OPERATOR.IS_NOT;

    onFilterCellActions(INDEX_PATTERN_ID, [], setFilters)(
      key,
      operation,
      values,
    );

    expect(setFilters).toHaveBeenCalledWith([
      buildMatchFilter(key, operation, values[0]),
      buildMatchFilter(key, operation, values[1]),
    ]);
  });

  it('should add single filter with given key (data.aws.resource.instanceDetails.networkInterfaces.privateIpAddress) and undefined value', () => {
    const key =
      'data.aws.resource.instanceDetails.networkInterfaces.privateIpAddress';
    const values = undefined;
    const operation = FILTER_OPERATOR.IS;

    onFilterCellActions(INDEX_PATTERN_ID, [], setFilters)(
      key,
      operation,
      values,
    );

    expect(setFilters).toHaveBeenCalledWith([
      buildExistsFilter(key, FILTER_OPERATOR.DOES_NOT_EXISTS),
    ]);
  });

  it('should add single filter with is not operator for given key (data.aws.resource.instanceDetails.networkInterfaces.privateIpAddress) and undefined value', () => {
    const key =
      'data.aws.resource.instanceDetails.networkInterfaces.privateIpAddress';
    const values = undefined;
    const operation = FILTER_OPERATOR.IS_NOT;

    onFilterCellActions(INDEX_PATTERN_ID, [], setFilters)(
      key,
      operation,
      values,
    );

    expect(setFilters).toHaveBeenCalledWith([
      buildExistsFilter(key, FILTER_OPERATOR.EXISTS),
    ]);
  });
});
