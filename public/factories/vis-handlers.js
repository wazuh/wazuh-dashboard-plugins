/*
 * Wazuh app - Factory to store visualizations handlers
 * 
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { uiModules } from 'ui/modules'
import dateMath from '@kbn/datemath';
const app = uiModules.get('app/wazuh', []);

class VisHandlers {
    constructor() {
        this.list = [];
    }

    addItem(item) {
        this.list.push(item);
    }

    getList() {
        return this.list;
    }

    getAppliedFilters(syscollector) {
        const appliedFilters = {};

        if(syscollector){
            Object.assign(appliedFilters, {
                filters: syscollector,
                time:{
                    from: 'now-1d/d',
                    to: 'now'
                },
                searchBar: false,
                tables:[]
            });
            return appliedFilters;
        }
        
        // Check raw response from all rendered tables
        
        const tables = this.list
                            .filter(item => item.vis && item.vis._state && item.vis._state.type === 'table')
                            .map(item => {
                                const columns = []; 
                                for(const table of item.dataLoader.visData.tables){
                                    columns.push(...table.columns.map(t => t.title));
                                }

                                return (item.vis &&
                                        item.vis.searchSource &&
                                        item.vis.searchSource.rawResponse) ? 
                                        {
                                            rawResponse: item.vis.searchSource.rawResponse,
                                            title: item.vis.title || 'Table',
                                            columns: columns
                                        } : 
                                        false;
                            });
        
        if(this.list && this.list.length) {
            const visualization = this.list[0].vis;
            // Parse applied filters for the first visualization
            const filters = visualization.API.queryFilter.getFilters();
     
            // Parse current time range
            const { from, to } = visualization.API.timeFilter.getTime();
            const { query } = visualization.searchSource._fields.query;

            Object.assign(appliedFilters, {
                filters,
                time:{
                    from: dateMath.parse(from),
                    to: dateMath.parse(to)
                },
                searchBar: query,
                tables
            });
        }

        return appliedFilters;
    }

    hasData() {
        for(const item of this.list) {
            if(
                item &&
                item.vis &&
                item.vis.title !== 'Agents status' &&
                item.vis.searchSource && 
                item.vis.searchSource.rawResponse &&
                item.vis.searchSource.rawResponse.hits &&
                item.vis.searchSource.rawResponse.hits.total
            ){
                return true;
            }
        }
        return false;
    }

    removeAll() {
        this.list = [];
    }
}

app.service('visHandlers', VisHandlers);