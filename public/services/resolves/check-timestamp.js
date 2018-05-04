/*
 * Wazuh app - File for routes definition
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export default async (appState,genericReq,errorHandler,$rootScope,$location) => {
    try {
        const data = await genericReq.request('GET', '/api/wazuh-elastic/timestamp');
        const current = appState.getCreatedAt();
        if(data && data.data){
            if(!current) appState.setCreatedAt(data.data.lastRestart);
            $rootScope.lastRestart = data.data.lastRestart;
            if(!$rootScope.$$phase) $rootScope.$digest();
        } else {
            $rootScope.blankScreenError = 'Your .wazuh-version index is empty or corrupt.'
            $location.search('tab',null);
            $location.path('/blank-screen');
        }
        return;
    } catch (error){
        $rootScope.blankScreenError = error.message || error;
        $location.search('tab',null);
        $location.path('/blank-screen');
    }
}