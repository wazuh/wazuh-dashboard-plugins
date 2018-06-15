/*
 * Wazuh app - Login controller
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

const app = uiModules.get('app/wazuh', []);

app.controller('loginController', function ($scope, $location, appState, genericReq) {
    $scope.submit = password => {
        genericReq.request('POST', '/api/wazuh-api/wlogin', {password: password})
        .then(data => {
            appState.setUserCode(data.data.code);
            $location.path('/overview');
            if(!$scope.$$phase) $scope.$digest();
        })
        .catch (error => {
            $scope.errorFromRequest = 'Wrong password, try again'
        })
    }
});
