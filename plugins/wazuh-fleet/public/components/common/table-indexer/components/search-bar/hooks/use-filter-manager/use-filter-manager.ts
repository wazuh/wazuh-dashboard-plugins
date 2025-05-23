/*
 * Wazuh app - React hook for get plugin platform filter manager
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { useState, useEffect } from 'react';
import { Subscription } from 'rxjs';
import {
  Filter,
  FilterManager,
} from '../../../../../../../../../src/plugins/data/public';
import { getPlugins } from '../../../../../../../plugin-services';

interface IUseFilterManagerReturn {
  filterManager: FilterManager;
  filters: Filter[];
  addFilters: (filters: Filter[]) => void;
}

export const useFilterManager = (): IUseFilterManagerReturn => {
  const filterManager = getPlugins().data.query.filterManager;
  const [filters, setFilters] = useState<Filter[]>(filterManager.getFilters());

  useEffect(() => {
    const subscriptions = new Subscription();

    subscriptions.add(
      filterManager.getUpdates$().subscribe({
        next: () => {
          const newFilters = filterManager.getFilters();

          setFilters(newFilters);
        },
      }),
    );

    return () => {
      subscriptions.unsubscribe();
    };
  }, [filterManager]);

  const applyFilters = (newFilters: Filter[]) => {
    filterManager.addFilters(newFilters);
    const newFiltersUpdated = filterManager.getFilters();
    setFilters(newFiltersUpdated);
  };

  return {
    filterManager,
    filters,
    addFilters: applyFilters,
  };
};
