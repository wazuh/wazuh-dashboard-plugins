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
import * as modules from 'ui/modules'

const app = modules.get('app/wazuh', []);

app.factory('visHandlers', function() {
    let list = [];

    const addItem = item => {
        list.push(item);
    }

    const getList = () => {
        return list;
    }

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
    }

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
    }
  
    return {
      addItem    : addItem,
      getList    : getList,
      removeAll  : removeAll,
      hasData    : hasData
    };
});