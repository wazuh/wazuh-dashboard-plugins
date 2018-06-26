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
import { uiModules }  from 'ui/modules'
import * as FileSaver from '../services/file-saver'

const app = uiModules.get('app/wazuh', []);

// Logs controller
app.controller('managerLogController', function ($scope, apiReq, errorHandler, csvReq, appState, wzTableFilter) {
    $scope.type_log    = 'all';
    $scope.category    = 'all';
    
    $scope.search = term => {
        $scope.$broadcast('wazuhSearch',{term})
    }
   
    $scope.filter = async filter => {
        $scope.$broadcast('wazuhFilter',{filter})
    }

    $scope.playRealtime = () => {
        $scope.realtime   = true;
        $scope.$broadcast('wazuhPlayRealTime')
    };

    $scope.stopRealtime = () => {
        $scope.realtime   = false;
        $scope.$broadcast('wazuhStopRealTime')
    }

    $scope.downloadCsv = async () => {
        try {
            errorHandler.info('Your download should begin automatically...', 'CSV')
            const currentApi   = JSON.parse(appState.getCurrentAPI()).id;
            const output       = await csvReq.fetch('/manager/logs', currentApi, wzTableFilter.get());
            const blob         = new Blob([output], {type: 'text/csv'});

            FileSaver.saveAs(blob, 'logs.csv');
            
            return;

        } catch (error) {
            errorHandler.handle(error,'Download CSV');
        }
        return;
    }

    const initialize = async () => {
        try{   
            const data = await apiReq.request('GET', '/manager/logs/summary', {});
            $scope.summary = data.data.data;
            if(!$scope.$$phase) $scope.$digest();
            return;
        } catch (error) {
            errorHandler.handle(error,'Logs');
        }
        return;
    }

    initialize();
});
