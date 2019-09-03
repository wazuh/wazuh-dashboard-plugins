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

import { FilterStateStore } from '@kbn/es-query';

import _ from 'lodash';
import { State } from 'ui/state_management/state';
import { FilterManager } from './filter-manager';

type GetAppStateFunc = () => State | undefined | null;

/**
 * FilterStateManager is responsible for watching for filter changes
 * and syncing with FilterManager, as well as syncing FilterManager changes
 * back to the URL.
 **/
export class FilterStateManager {
    filterManager: FilterManager;
    globalState: State;
    getAppState: GetAppStateFunc;
    interval: NodeJS.Timeout | undefined;

    constructor(globalState: State, getAppState: GetAppStateFunc, filterManager: FilterManager) {
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

    private watchFilterState() {
        // This is a temporary solution to remove rootscope.
        // Moving forward, state should provide observable subscriptions.
        this.interval = setInterval(() => {
            const appState = this.getAppState();
            const stateUndefined = !appState || !this.globalState;
            if (stateUndefined) return;

            const globalFilters = this.globalState.filters || [];
            const appFilters = (appState && appState.filters) || [];

            const globalFilterChanged = !_.isEqual(this.filterManager.getGlobalFilters(), globalFilters);
            const appFilterChanged = !_.isEqual(this.filterManager.getAppFilters(), appFilters);
            const filterStateChanged = globalFilterChanged || appFilterChanged;

            if (!filterStateChanged) return;

            const newGlobalFilters = _.cloneDeep(globalFilters);
            const newAppFilters = _.cloneDeep(appFilters);
            FilterManager.setFiltersStore(newAppFilters, FilterStateStore.APP_STATE);
            FilterManager.setFiltersStore(newGlobalFilters, FilterStateStore.GLOBAL_STATE);

            this.filterManager.setFilters(newGlobalFilters.concat(newAppFilters));
        }, 10);
    }

    private saveState() {
        const appState = this.getAppState();
        if (appState) appState.save();
        this.globalState.save();
    }

    private updateAppState() {
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