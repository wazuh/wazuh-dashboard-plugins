"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
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
const es_query_1 = require("@kbn/es-query");
const lodash_1 = __importDefault(require("lodash"));
const rxjs_1 = require("rxjs");
const new_platform_1 = require("ui/new_platform");
// @ts-ignore
const compare_filters_1 = require("plugins/data/filter/filter_manager/lib/compare_filters");
// @ts-ignore
const map_and_flatten_filters_1 = require("plugins/data/filter/filter_manager/lib/map_and_flatten_filters");
// @ts-ignore
const uniq_filters_1 = require("plugins/data/filter/filter_manager/lib/uniq_filters");
// @ts-ignore
const extract_time_filter_1 = require("plugins/data/filter/filter_manager/lib/extract_time_filter");
// @ts-ignore
const change_time_filter_1 = require("plugins/data/filter/filter_manager/lib/change_time_filter");
const only_disabled_1 = require("./only_disabled");
class FilterManager {
    constructor(indexPatterns) {
        this.filters = [];
        this.updated$ = new rxjs_1.Subject();
        this.fetch$ = new rxjs_1.Subject();
        this.indexPatterns = indexPatterns;
    }
    mergeIncomingFilters(partitionedFilters) {
        const globalFilters = partitionedFilters.globalFilters;
        const appFilters = partitionedFilters.appFilters;
        // existing globalFilters should be mutated by appFilters
        lodash_1.default.each(appFilters, function (filter, i) {
            const match = lodash_1.default.find(globalFilters, function (globalFilter) {
                return compare_filters_1.compareFilters(globalFilter, filter);
            });
            // no match, do nothing
            if (!match)
                return;
            // matching filter in globalState, update global and remove from appState
            lodash_1.default.assign(match.meta, filter.meta);
            appFilters.splice(i, 1);
        });
        return FilterManager.mergeFilters(appFilters, globalFilters);
    }
    static mergeFilters(appFilters, globalFilters) {
        return uniq_filters_1.uniqFilters(appFilters.reverse().concat(globalFilters.reverse())).reverse();
    }
    static partitionFilters(filters) {
        const [globalFilters, appFilters] = lodash_1.default.partition(filters, es_query_1.isFilterPinned);
        return {
            globalFilters,
            appFilters,
        };
    }
    handleStateUpdate(newFilters) {
        // global filters should always be first
        newFilters.sort(({ $state: a }, { $state: b }) => {
            return a.store === es_query_1.FilterStateStore.GLOBAL_STATE &&
                b.store !== es_query_1.FilterStateStore.GLOBAL_STATE
                ? -1
                : 1;
        });
        const filtersUpdated = !lodash_1.default.isEqual(this.filters, newFilters);
        const updatedOnlyDisabledFilters = only_disabled_1.onlyDisabledFiltersChanged(newFilters, this.filters);
        this.filters = newFilters;
        if (filtersUpdated) {
            this.updated$.next();
            if (!updatedOnlyDisabledFilters) {
                this.fetch$.next();
            }
        }
    }
    /* Getters */
    getFilters() {
        return lodash_1.default.cloneDeep(this.filters);
    }
    getAppFilters() {
        const { appFilters } = this.getPartitionedFilters();
        return appFilters;
    }
    getGlobalFilters() {
        const { globalFilters } = this.getPartitionedFilters();
        return globalFilters;
    }
    getPartitionedFilters() {
        return FilterManager.partitionFilters(this.getFilters());
    }
    getUpdates$() {
        return this.updated$.asObservable();
    }
    getFetches$() {
        return this.fetch$.asObservable();
    }
    /* Setters */
    async addFilters(filters, pinFilterStatus) {
        if (!Array.isArray(filters)) {
            filters = [filters];
        }
        if (filters.length === 0) {
            return;
        }
        const { uiSettings } = new_platform_1.npSetup.core;
        if (pinFilterStatus === undefined) {
            pinFilterStatus = uiSettings.get('filters:pinnedByDefault');
        }
        // Set the store of all filters. For now.
        // In the future, all filters should come in with filter state store already set.
        const store = pinFilterStatus ? es_query_1.FilterStateStore.GLOBAL_STATE : es_query_1.FilterStateStore.APP_STATE;
        FilterManager.setFiltersStore(filters, store);
        const mappedFilters = await map_and_flatten_filters_1.mapAndFlattenFilters(this.indexPatterns, filters);
        // This is where we add new filters to the correct place (app \ global)
        const newPartitionedFilters = FilterManager.partitionFilters(mappedFilters);
        const currentFilters = this.getPartitionedFilters();
        currentFilters.appFilters.push(...newPartitionedFilters.appFilters);
        currentFilters.globalFilters.push(...newPartitionedFilters.globalFilters);
        const newFilters = this.mergeIncomingFilters(currentFilters);
        this.handleStateUpdate(newFilters);
    }
    async setFilters(newFilters) {
        const mappedFilters = await map_and_flatten_filters_1.mapAndFlattenFilters(this.indexPatterns, newFilters);
        const newPartitionedFilters = FilterManager.partitionFilters(mappedFilters);
        const mergedFilters = this.mergeIncomingFilters(newPartitionedFilters);
        this.handleStateUpdate(mergedFilters);
    }
    removeFilter(filter) {
        const filterIndex = lodash_1.default.findIndex(this.filters, item => {
            return lodash_1.default.isEqual(item.meta, filter.meta) && lodash_1.default.isEqual(item.query, filter.query);
        });
        if (filterIndex >= 0) {
            const newFilters = lodash_1.default.cloneDeep(this.filters);
            newFilters.splice(filterIndex, 1);
            this.handleStateUpdate(newFilters);
        }
    }
    async removeAll() {
        await this.setFilters([]);
    }
    async addFiltersAndChangeTimeFilter(filters) {
        const timeFilter = await extract_time_filter_1.extractTimeFilter(this.indexPatterns, filters);
        if (timeFilter)
            change_time_filter_1.changeTimeFilter(timeFilter);
        return this.addFilters(filters.filter(filter => filter !== timeFilter));
    }
    static setFiltersStore(filters, store) {
        lodash_1.default.map(filters, (filter) => {
            // Override status only for filters that didn't have state in the first place.
            if (filter.$state === undefined) {
                filter.$state = { store };
            }
        });
    }
}
exports.FilterManager = FilterManager;
