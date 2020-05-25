"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const filter_state_manager_1 = require("./filter-state-manager");
const setup_1 = require("./setup");
function FilterBarQueryFilterProvider(getAppState, globalState) {
    // TODO: this is imported here to avoid circular imports.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const data = new setup_1.DataPlugin().setup();
    const filterManager = data.filter.filterManager;
    const filterStateManager = new filter_state_manager_1.FilterStateManager(globalState, getAppState, filterManager);
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
exports.FilterBarQueryFilterProvider = FilterBarQueryFilterProvider;
