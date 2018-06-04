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
app.controller('blankScreenController', function($scope, $location, errorHandler, wzMisc) {
    const bse_error = wzMisc.getValue('blankScreenError')
    if (bse_error) {
        let parsed = null;
        try {
            parsed = errorHandler.handle(bse_error,'',false,true);
        } catch (error) {
            // Do nothing (intended)
        }
        $scope.errorToShow = parsed ? parsed : bse_error;
        wzMisc.setBlankScr(false)
        if (!$scope.$$phase) $scope.$digest();
    }
    $scope.goOverview = () => {
        $location.path('/overview');
    }
});
