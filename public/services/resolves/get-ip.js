/*
 * Wazuh app - Module to fetch index patterns
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { SavedObjectsClientProvider } from 'ui/saved_objects';

import healthCheck from './health-check'

export default (indexPatterns, $q, $rootScope, $window, $location, Private, appState, genericReq,errorHandler, wzMisc) => {
    const deferred = $q.defer();

    const buildSavedObjectsClient = async () => {
        try {
            const savedObjectsClient = Private(SavedObjectsClientProvider);

            const savedObjectsData = await savedObjectsClient.find({
                type   : 'index-pattern',
                fields : ['title'],
                perPage: 10000
            });
            
            const { savedObjects } = savedObjectsData;

            const data = await genericReq.request('GET', '/get-list')

            let currentPattern = '';

            if (appState.getCurrentPattern()) { // There's cookie for the pattern
                currentPattern = appState.getCurrentPattern();
            } else {
                if(!data || !data.data || !data.data.data || !data.data.data.length){
                    wzMisc.setBlankScr('Sorry but no valid index patterns were found')
                    $location.search('tab',null);
                    $location.path('/blank-screen');
                    return;
                }
                currentPattern = data.data.data[0].id;
                appState.setCurrentPattern(currentPattern);
            }

            const onlyWazuhAlerts = savedObjects.filter(element => element.id === currentPattern);

            if (!onlyWazuhAlerts || !onlyWazuhAlerts.length) { // There's now selected ip
                deferred.resolve('No ip');
                return;
            }

            const courierData = await indexPatterns.get(currentPattern)

            deferred.resolve({
                list         : onlyWazuhAlerts,
                loaded       : courierData,
                stateVal     : null,
                stateValFound: false
            });
    
        } catch (error) {
            deferred.reject(error);
            wzMisc.setBlankScr(errorHandler.handle(error,'Elasticsearch',false,true));
            $location.path('/blank-screen');
        }
    }

    if (healthCheck($window, $rootScope)) {
        deferred.reject();
        $location.path('/health-check');
    } else {
        buildSavedObjectsClient();
    }
    return deferred.promise;
}