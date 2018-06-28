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

app.factory('visHandlers', function() {
    let list = [];

    const addItem = item => {
        list.push(item);
    };

    const getList = () => {
        return list;
    };

    const getAppliedFilters = () => {
        let appliedFilters = {};

        // Check raw response from all rendered tables
        const tables = list.filter(item => item._scope &&
                                           item._scope.savedObj &&
                                           item._scope.savedObj.vis &&
                                           item._scope.savedObj.vis.type &&
                                           item._scope.savedObj.vis.type.type === 'table')
                            .map(item => (item._scope &&
                                          item._scope.savedObj &&
                                          item._scope.savedObj.vis &&
                                          item._scope.savedObj.vis.searchSource &&
                                          item._scope.savedObj.vis.searchSource.rawResponse) ? 
                                          item._scope.savedObj.vis.searchSource.rawResponse : 
                                          false);
        
        if(list && list.length) {
            // Parse applied filters for the first visualization
            const filters = list[0]._scope.savedObj.vis.API.queryFilter.getFilters();

            // Parse current time range
            const { from, to } = list[0]._scope.savedObj.vis.API.timeFilter.time;

            appliedFilters = {
                filters,
                time:{
                    from: dateMath.parse(from),
                    to: dateMath.parse(to)
                },
                searchBar: list[0] && list[0]._scope && list[0]._scope.appState && list[0]._scope.appState.query && list[0]._scope.appState.query.query ? 
                           list[0]._scope.appState.query.query :
                           false,
                tables
            };
        }
        return appliedFilters;
    };

    const hasData = () => {
        for(const item of list) {
            if(item && item._scope && item._scope.savedObj && item._scope.savedObj.searchSource && 
                item._scope.savedObj.searchSource.rawResponse &&
                item._scope.savedObj.searchSource.rawResponse.hits &&
                item._scope.savedObj.searchSource.rawResponse.hits.total){
                    return true;
                }
        }
        return false;
    };

    const removeAll = () => {
        for(const item of list){
            if(item && item._scope){
                item._scope.$destroy();
            }
            if(item && item._scope && item._scope.savedObj){
                item._scope.savedObj.destroy();
            }
        }
        list = [];
    };
  
    return {
      addItem,
      getList,
      removeAll,
      hasData,
      getAppliedFilters
    };
});