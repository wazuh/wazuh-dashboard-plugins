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
import { getDataPlugin, getUiSettings } from '../../../kibana-services';
import { useState, useEffect, useMemo } from 'react';
import { Filter } from '../../../../../../src/plugins/data/public';
import _ from 'lodash';
import { FilterManager } from '../../../../../../src/plugins/data/public';
import { Subscription } from 'rxjs';

type tUseFilterManagerReturn = {
  filterManager: FilterManager;
  filters: Filter[];
};

export const useFilterManager = (): tUseFilterManagerReturn => {
  const filterManager = getDataPlugin().query.filterManager;
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

  return { filterManager, filters };
};

export const useNewFilterManager = () => {
  const filterManager = useMemo(() => new FilterManager(getUiSettings()), []);
  return { filterManager, filters: filterManager.filters };
};
