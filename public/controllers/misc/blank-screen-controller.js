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
import { uiModules } from 'ui/modules'

const app = uiModules.get('app/wazuh', []);

app.controller('blankScreenController', function($scope, $location, errorHandler, wzMisc) {
    const catchedError = wzMisc.getBlankScr()
    if (catchedError) {
        let parsed = null;
        try {
            parsed = errorHandler.handle(catchedError,'',false,true);
        } catch (error) { } // eslint-disable-line
        $scope.errorToShow = parsed || catchedError;
        wzMisc.setBlankScr(false)
        if (!$scope.$$phase) $scope.$digest();
    }
    $scope.goOverview = () => {
        $location.path('/overview');
    }
});
