import {
  Filter,
  FilterManager,
} from '../../../../../../src/plugins/data/public';

const isSameNegatedFilter = (filter: Filter, prevFilter: Filter) => {
  return (
    filter.meta.key === prevFilter.meta.key &&
    filter.meta.type === prevFilter.meta.type &&
    filter.meta.params === prevFilter.meta.params.query &&
    filter.meta.negate !== prevFilter.meta.negate
  );
};

export const setFilters =
  (filterManager: FilterManager) => (filters: Filter[]) => {
    const prevFilters = filterManager
      .getFilters()
      .filter(
        prevFilter =>
          !filters.find(filter => isSameNegatedFilter(filter, prevFilter)),
      );
    const newFilters = [...filters, ...prevFilters];
    filterManager.setFilters(newFilters, undefined);
  };
