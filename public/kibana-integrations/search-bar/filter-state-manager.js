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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const es_query_1 = require("@kbn/es-query");
const lodash_1 = __importDefault(require("lodash"));
const filter_manager_1 = require("./filter-manager");
/**
 * FilterStateManager is responsible for watching for filter changes
 * and syncing with FilterManager, as well as syncing FilterManager changes
 * back to the URL.
 **/
class FilterStateManager {
    constructor(globalState, getAppState, filterManager) {
        this.getAppState = getAppState;
        this.globalState = globalState;
        this.filterManager = filterManager;
        this.watchFilterState();
        this.filterManager.getUpdates$().subscribe(() => {
            this.updateAppState();
        });
    }
    destroy() {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }
    watchFilterState() {
        // This is a temporary solution to remove rootscope.
        // Moving forward, state should provide observable subscriptions.
        this.interval = setInterval(() => {
            const appState = this.getAppState();
            const stateUndefined = !appState || !this.globalState;
            if (stateUndefined)
                return;
            const globalFilters = this.globalState.filters || [];
            const appFilters = (appState && appState.filters) || [];
            const globalFilterChanged = !lodash_1.default.isEqual(this.filterManager.getGlobalFilters(), globalFilters);
            const appFilterChanged = !lodash_1.default.isEqual(this.filterManager.getAppFilters(), appFilters);
            const filterStateChanged = globalFilterChanged || appFilterChanged;
            if (!filterStateChanged)
                return;
            const newGlobalFilters = lodash_1.default.cloneDeep(globalFilters);
            const newAppFilters = lodash_1.default.cloneDeep(appFilters);
            filter_manager_1.FilterManager.setFiltersStore(newAppFilters, es_query_1.FilterStateStore.APP_STATE);
            filter_manager_1.FilterManager.setFiltersStore(newGlobalFilters, es_query_1.FilterStateStore.GLOBAL_STATE);
            this.filterManager.setFilters(newGlobalFilters.concat(newAppFilters));
        }, 10);
    }
    saveState() {
        const appState = this.getAppState();
        if (appState)
            appState.save();
        this.globalState.save();
    }
    updateAppState() {
        // Update Angular state before saving State objects (which save it to URL)
        const partitionedFilters = this.filterManager.getPartitionedFilters();
        const appState = this.getAppState();
        if (appState) {
            appState.filters = partitionedFilters.appFilters;
        }
        this.globalState.filters = partitionedFilters.globalFilters;
        this.saveState();
    }
}
exports.FilterStateManager = FilterStateManager;
