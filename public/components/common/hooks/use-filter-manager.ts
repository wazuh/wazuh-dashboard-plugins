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
import { getDataPlugin } from '../../../kibana-services';
import { useState, useEffect, useMemo } from 'react';
import { Filter } from 'src/plugins/data/public';
import _ from 'lodash';

export const useFilterManager = () => {
  const filterManager = useMemo(() => getDataPlugin().query.filterManager, []);
  const [filters, setFilters] = useState<Filter[]>(filterManager.getFilters());

  useEffect(() => {
    const subscription = filterManager.getUpdates$().subscribe(() => {
      const newFilters = filterManager.getFilters();
      if (!_.isEqual(filters, newFilters)) {
        setFilters(newFilters);
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  return { filterManager, filters };
};
