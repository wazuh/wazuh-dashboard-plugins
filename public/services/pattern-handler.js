/*
 * Wazuh app - Pattern handler service
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

modules.get('app/wazuh', [])
.service('patternHandler', function ($location, genericReq, appState, errorHandler, wzMisc) {
    return {
        getPatternList: async () => {
            try {
                const patternList = await genericReq.request('GET','/get-list',{});

                if(!patternList.data.data.length){
                    wzMisc.setBlankScr('Sorry but no valid index patterns were found')
                    $location.search('tab',null);
                    $location.path('/blank-screen');
                    return;
                }

                if(appState.getCurrentPattern()){
                    let filtered = patternList.data.data.filter(item => item.id.includes(appState.getCurrentPattern()))
                    if(!filtered.length) appState.setCurrentPattern(patternList.data.data[0].id)
                }

                return patternList.data.data;
            } catch (error) {
                errorHandler.handle(error,'Pattern Handler (getPatternList)');
            }
            return;
        },
        changePattern: async selectedPattern => {
            try {
                appState.setCurrentPattern(selectedPattern);
                await genericReq.request('GET',`/refresh-fields/${selectedPattern}`,{})
                return appState.getCurrentPattern();
            } catch (error) {
                errorHandler.handle(error,'Pattern Handler (changePattern)');
            }
            return;
        }
    };
});
