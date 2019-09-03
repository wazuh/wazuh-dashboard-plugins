/*
 * Author: Elasticsearch B.V.
 * Updated by Wazuh, Inc.
 *
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { FilterStateManager } from './filter-state-manager';
import { DataPlugin } from './setup';

export function FilterBarQueryFilterProvider(getAppState, globalState) {
    // TODO: this is imported here to avoid circular imports.
    // eslint-disable-next-line @typescript-eslint/no-var-requires

    const data = new DataPlugin().setup();
    const filterManager = data.filter.filterManager;
    const filterStateManager = new FilterStateManager(globalState, getAppState, filterManager);

    const queryFilter = {};
    queryFilter.getUpdates$ = filterManager.getUpdates$.bind(filterManager);
    queryFilter.getFetches$ = filterManager.getFetches$.bind(filterManager);
    queryFilter.getFilters = filterManager.getFilters.bind(filterManager);
    queryFilter.getAppFilters = filterManager.getAppFilters.bind(filterManager);
    queryFilter.getGlobalFilters = filterManager.getGlobalFilters.bind(filterManager);
    queryFilter.removeFilter = filterManager.removeFilter.bind(filterManager);
    queryFilter.addFilters = filterManager.addFilters.bind(filterManager);
    queryFilter.setFilters = filterManager.setFilters.bind(filterManager);
    queryFilter.addFiltersAndChangeTimeFilter = filterManager.addFiltersAndChangeTimeFilter.bind(filterManager);
    queryFilter.removeAll = filterManager.removeAll.bind(filterManager);

    queryFilter.destroy = () => {
        filterManager.destroy();
        filterStateManager.destroy();
    };

    return queryFilter;
}