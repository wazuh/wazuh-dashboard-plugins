/*
 * Wazuh app - Manager logs controller
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
import CsvGenerator from './csv-generator'

const app = modules.get('app/wazuh', []);

// Logs controller
app.controller('managerLogController', function ($scope, $rootScope, Logs, apiReq, errorHandler, csvReq, appState) {
    $scope.searchTerm  = '';
    $scope.loading     = true;
    $scope.logs        = Logs;
    $scope.realtime    = false;
    $scope.realLogs    = [];
    $scope.type_log    = 'all';
    $scope.category    = 'all';
    let intervalId     = null;

    const getRealLogs = async params => {
        try{
            const data = await apiReq.request('GET', '/manager/logs', params);
            $scope.realLogs = data.data.data.items;
            if(!$scope.$$phase) $scope.$digest();
            return;
        } catch (error) {
            errorHandler.handle(error,'Logs');
        }
        return;
    };

    $scope.playRealtime = async () => {
        const params = { limit: 20 };
        if($scope.logs && $scope.logs.filters && Array.isArray($scope.logs.filters)){
            for(const filter of $scope.logs.filters){
                if(!filter.name || !filter.value) continue;
                params[filter.name] = filter.value;
            }
        }
        $scope.realtime = true;
        await getRealLogs(params);
        intervalId = setInterval(() => getRealLogs(params), 2500);
    };

    $scope.stopRealtime = () => {
        $scope.realtime   = false;
        clearInterval(intervalId);
        if(!$scope.$$phase) $scope.$digest();
    }

    $scope.downloadCsv = async () => {
        try {
            const currentApi   = JSON.parse(appState.getCurrentAPI()).id;
            const output       = await csvReq.fetch('/manager/logs', currentApi, $scope.logs ? $scope.logs.filters : null);
            const csvGenerator = new CsvGenerator(output.csv, 'logs.csv');
            csvGenerator.download(true);
        } catch (error) {
            errorHandler.handle(error,'Download CSV');
        }
        return;
    }

    const initialize = async () => {
        try{            
            await $scope.logs.nextPage();
            const data = await apiReq.request('GET', '/manager/logs/summary', {});
            $scope.summary = data.data.data;
            $scope.loading = false;
            if(!$scope.$$phase) $scope.$digest();
            return;
        } catch (error) {
            errorHandler.handle(error,'Logs');
        }
        return;
    }

    initialize();

    // Resetting the factory configuration
    $scope.$on("$destroy", () => {
        if($scope.realtime) {
            $scope.realtime = false;
            clearInterval(intervalId);
        }
        $scope.logs.reset();

    });
});
