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

export interface ManagedFiltersSpec {
  [key: string]: ManagedFilter;
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
export function isManagedFilter(
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
 * Exclude the managed filter
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

export const createManagedFilters = (
  spec: ManagedFiltersSpec,
  {
    filters,
    setFilters,
  }: { filters: Filter[]; setFilters: (filters: Filter[]) => void },
) =>
  orderBy(
    Object.values(spec),
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
  ));

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
