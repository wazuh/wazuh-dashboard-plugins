/*
 * Wazuh app - Management status controller
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { uiModules } from 'ui/modules';

const app = uiModules.get('app/wazuh', []);

app.controller('managerStatusController', function ($scope, errorHandler, apiReq) {
    //Initialization
    $scope.load  = true;

    //Functions
    $scope.getDaemonStatusClass = daemonStatus => (daemonStatus === 'running') ? 'status teal' : 'status red';

    Promise.all([
        apiReq.request('GET', '/agents/summary', {}),
        apiReq.request('GET', '/manager/status', {}),
        apiReq.request('GET', '/manager/info', {}),
        apiReq.request('GET', '/rules', { offset: 0, limit: 1 }),
        apiReq.request('GET', '/decoders', { offset: 0, limit: 1 })
    ])
    .then(data => {
        // Once Wazuh core fixes agent 000 issues, this should be adjusted
        const active = data[0].data.data.Active - 1;
        const total  = data[0].data.data.Total - 1;
        $scope.agentsCountActive         = active;
        $scope.agentsCountDisconnected   = data[0].data.data.Disconnected;
        $scope.agentsCountNeverConnected = data[0].data.data['Never connected'];
        $scope.agentsCountTotal          = total;
        $scope.agentsCoverity            = (active / total) * 100;

        $scope.daemons       = data[1].data.data;
        $scope.managerInfo   = data[2].data.data;
        $scope.totalRules    = data[3].data.data.totalItems;
        $scope.totalDecoders = data[4].data.data.totalItems;

        return apiReq.request('GET', '/agents', { limit: 1, sort: '-dateAdd' });
    })
    .then(lastAgent => apiReq.request('GET', `/agents/${lastAgent.data.data.items[0].id}`, {}))
    .then(agentInfo => {
        $scope.agentInfo = agentInfo.data.data;
        $scope.load = false;
        if(!$scope.$$phase) $scope.$digest();
    })
    .catch(error => errorHandler.handle(error,'Manager'));

    $scope.$on("$destroy", () => {

    });

});
