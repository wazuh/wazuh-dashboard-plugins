import React from 'react';
import { orderBy } from 'lodash';

interface ManagedFilter {
  managedField?: string;
  controlledBy?: string;
  component: any;
  order: number;
}

/**
 * Decide if the filter is managed or not.
 * @param filter
 * @param param1
 * @returns
 */
function isManagedFilter(filter, { managedField, controlledBy }) {
  return (
    (managedField && filter.meta?.key === managedField) ||
    (controlledBy && filter.meta?.controlledBy === controlledBy)
  );
}

/**
 * Get the managed filter
 * @param filters
 * @param param1
 * @returns
 */
function getManagedFilter(filters, { managedField, controlledBy }) {
  return filters.find(filter =>
    isManagedFilter(filter, { managedField, controlledBy }),
  );
}

/**
 * Exclude the manged filter
 * @param filters
 * @param param1
 * @returns
 */
function excludeManagedFilter(filters, { managedField, controlledBy }) {
  return filters.filter(
    filter => !isManagedFilter(filter, { managedField, controlledBy }),
  );
}

interface UseCustomSearchBarFilters {
  searchBarFilters: any[];
  postFixedFilters: React.ReactNode[];
}

/**
 * Hook to use with the WzSearchBar that excludes the managed filter from the filter in the
 * filter manager and returns the expected postFixedFilters to be rendered in the WzSearchBar with
 * the managed filters.
 * @param definition
 * @param filters
 * @param setFilters
 * @returns
 */
export const useWithManagedSearchBarFilters = (
  definition: {
    spec: {
      [key: string]: ManagedFilter;
    };
  },
  filters: any[],
  setFilters: (filters: any) => void,
): UseCustomSearchBarFilters => {
  return {
    searchBarFilters: filters.filter(
      f =>
        !Object.values(definition.spec)
          .map(({ controlledBy }) => controlledBy)
          .filter(Boolean)
          .includes(f.meta?.controlledBy),
    ),
    postFixedFilters: orderBy(
      Object.values(definition.spec),
      ['order'],
      ['asc'],
      // eslint-disable-next-line react/display-name
    ).map(customFilterSpec => (
      // eslint-disable-next-line react/jsx-key
      <ManagedFilterComponent
        {...customFilterSpec}
        filters={filters}
        setFilters={setFilters}
        managedFilter={getManagedFilter(filters, customFilterSpec)}
      />
    )),
  };
};

const ManagedFilterComponent = ({
  filters,
  setFilters,
  managedFilter,
  component: Component,
  ...customFilterSpec
}) => {
  const setManagedFilter = managedFilters => {
    const filtersExcludingManagedFilter = excludeManagedFilter(
      filters,
      customFilterSpec,
    );

    setFilters([
      ...filtersExcludingManagedFilter,
      ...(managedFilters ? managedFilters : []),
    ]);
  };

  return (
    <Component
      customFilterSpec={customFilterSpec}
      setManagedFilter={setManagedFilter}
      managedFilter={managedFilter}
    />
  );
};
