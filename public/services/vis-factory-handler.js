/*
 * Wazuh app - Vis factory service
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
import $            from 'jquery'

modules.get('app/wazuh', [])
.service('visFactoryService', function ($rootScope, appState, genericReq, discoverPendingUpdates, rawVisualizations, tabVisualizations, loadedVisualizations, commonData, visHandlers) {
    
    const clear = (onlyAgent = false) => {
        if(!onlyAgent) visHandlers.removeAll();
        discoverPendingUpdates.removeAll();
        rawVisualizations.removeAll();
        loadedVisualizations.removeAll();
    }

    const clearAll = () => {
        clear();
        tabVisualizations.removeAll();
    }

    const buildOverviewVisualizations = async (filterHandler, tab, subtab, localChange) => {
        try {
            const data = await genericReq.request('GET',`/api/wazuh-elastic/create-vis/overview-${tab}/${appState.getCurrentPattern()}`)
            rawVisualizations.assignItems(data.data.raw);
            commonData.assignFilters(filterHandler, tab, localChange);
            $rootScope.$emit('changeTabView',{tabView:subtab})
            $rootScope.$broadcast('updateVis');
            return;
        } catch (error) {
            return Promise.reject(error)
        }
    }

    const buildAgentsVisualizations = async (filterHandler, tab, subtab, localChange, id) => {
        try {
            const data = await genericReq.request('GET',`/api/wazuh-elastic/create-vis/agents-${tab}/${appState.getCurrentPattern()}`)
            rawVisualizations.assignItems(data.data.raw);
            commonData.assignFilters(filterHandler, tab, localChange, id)
            $rootScope.$emit('changeTabView',{tabView:subtab});
            $rootScope.$broadcast('updateVis');
            return;
        } catch (error) {
            return Promise.reject(error)
        }
    }


    return {
        clear,
        clearAll,
        buildOverviewVisualizations,
        buildAgentsVisualizations
    }
});