import React from 'react';
import { orderBy } from 'lodash';
import { Filter } from 'src/plugins/data/common';

export interface ManagedFilter {
  managedField?: string;
  controlledBy?: string;
  selector?: (filter: Filter) => boolean;
  component: any;
  order: number;
}

type ManagedFilterSelectors = Pick<
  ManagedFilter,
  'managedField' | 'controlledBy' | 'selector'
>;

/**
 * Decide if the filter is managed or not.
 * @param filter
 * @param param1
 * @returns
 */
function isManagedFilter(
  filter: Filter,
  { managedField, controlledBy, selector }: ManagedFilterSelectors,
) {
  if (selector) {
    return selector(filter);
  }
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
function getManagedFilter(
  filters: Filter[],
  { managedField, controlledBy, selector }: ManagedFilterSelectors,
) {
  return filters.find(filter =>
    isManagedFilter(filter, { managedField, controlledBy, selector }),
  );
}

/**
 * Exclude the manged filter
 * @param filters
 * @param param1
 * @returns
 */
function excludeManagedFilter(
  filters: Filter[],
  { managedField, controlledBy, selector }: ManagedFilterSelectors,
) {
  return filters.filter(
    filter =>
      !isManagedFilter(filter, { managedField, controlledBy, selector }),
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
  filters: Filter[],
  setFilters: (filters: Filter[]) => void,
): UseCustomSearchBarFilters => {
  return {
    searchBarFilters: filters.filter(f => {
      const isManaged = Object.values(definition.spec)
        .map(({ managedField, selector }) => {
          if (selector) {
            return selector(f);
          } else if (managedField) {
            return (
              f.meta?.key === managedField ||
              f.meta?.controlledBy === managedField
            );
          }
        })
        .filter(Boolean);
      return isManaged.length === 0;
    }),
    postFixedFilters: orderBy(
      Object.values(definition.spec),
      ['order'],
      ['asc'],
      // eslint-disable-next-line react/display-name
    ).map((customFilterSpec: ManagedFilter) => (
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
