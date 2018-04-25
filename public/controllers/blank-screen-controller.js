/*
 * Wazuh app - Blank screen controller
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

// Logs controller
app.controller('blankScreenController', function($scope, $rootScope, $location, errorHandler) {
    if ($rootScope.blankScreenError) {
        let parsed = null;
        try {
            parsed = errorHandler.handle($rootScope.blankScreenError,'',false,true);
        } catch (error) {
            // Do nothing (intended)
        }
        $scope.errorToShow = parsed ? parsed : $rootScope.blankScreenError;
        delete $rootScope.blankScreenError;
        if (!$scope.$$phase) $scope.$digest();
    }
    $scope.goOverview = () => {
        $location.path('/overview');
    }
});
