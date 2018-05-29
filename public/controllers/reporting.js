/*
 * Wazuh app - Cluster monitoring controller
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
const app = require('ui/modules').get('app/wazuh', []);

// Logs controller
app.controller('reportingController', function ($scope, errorHandler, genericReq) {
    $scope.loading = true;
    const load = async () => {
        try {
            $scope.loading = true;
            const data = await genericReq.request('GET','/api/wazuh-api/reports',{});
            $scope.reports = data.data.list.reverse();
            $scope.loading = false;
            if(!$scope.$$phase) $scope.$digest();
        } catch (error) {
            errorHandler.handle(error,'Reporting');
        }
    }

    load();

    $scope.deleteReport = async name => {
        try {
            $scope.loading = true;
            await genericReq.request('DELETE','/api/wazuh-api/report/' + name,{})
            await load();
            errorHandler.info('Success','Reporting');
        } catch (error) {
            errorHandler.handle(error,'Reporting');
        }
    }
});