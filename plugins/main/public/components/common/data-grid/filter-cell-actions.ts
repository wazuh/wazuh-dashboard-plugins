import {
  FILTER_OPERATOR,
  PatternDataSourceFilterManager,
} from '../data-source/pattern/pattern-data-source-filter-manager';
import { Filter } from '../../../../../../src/plugins/data/common';
import { isNullish } from '../util';

export const onFilterCellActions = (
  indexPatternId: string,
  filters: Filter[],
  setFilters: (filters: Filter[]) => void,
) => {
  return (
    field: string,
    operation:
      | FILTER_OPERATOR.EXISTS
      | FILTER_OPERATOR.IS
      | FILTER_OPERATOR.IS_NOT,
    values?: string | string[],
  ) => {
    // https://github.com/opensearch-project/OpenSearch-Dashboards/blob/4e34a7a5141d089f6c341a535be5a7ba2737d965/src/plugins/data/public/query/filter_manager/lib/generate_filters.ts#L89
    const negated = [FILTER_OPERATOR.IS_NOT].includes(operation);
    let _operation: FILTER_OPERATOR = operation;
    if (isNullish(values) && ![FILTER_OPERATOR.EXISTS].includes(operation)) {
      if (negated) {
        _operation = FILTER_OPERATOR.EXISTS;
      } else {
        _operation = FILTER_OPERATOR.DOES_NOT_EXISTS;
      }
    }

    const newFilters: Filter[] = [];
    if (isNullish(values)) {
      newFilters.push(
        PatternDataSourceFilterManager.createFilter(
          _operation,
          field,
          values,
          indexPatternId,
        ),
      );
    } else {
      values = Array.isArray(values) ? values : [values];
      values.forEach(item => {
        newFilters.push(
          PatternDataSourceFilterManager.createFilter(
            _operation,
            field,
            item,
            indexPatternId,
          ),
        );
      });
    }
    setFilters([...filters, ...newFilters]);
  };
};
