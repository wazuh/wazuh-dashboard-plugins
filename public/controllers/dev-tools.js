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
import beautifier from 'plugins/wazuh/utils/json-beautifier';
const app = modules.get('app/wazuh', []);

// Logs controller
app.controller('devToolsController', function($scope, $rootScope, errorHandler,apiReq) {
    $scope.requestText = ''
    $scope.output = 'Waiting for data'

    const parseParams = req => {
        const result = {};
        req.split('&').forEach(part => {
            const item = part.split('=');
            result[item[0]] = decodeURIComponent(item[1]);
        });
        return result;
    }

    $scope.send = async () => {
        try {
            const req = $scope.requestText ?
                        $scope.requestText.startsWith('/') ? 
                        $scope.requestText :  
                        `/${$scope.requestText}` :
                        '/';

            const path   = req.includes('?') ? req.split('?')[0] : req;
            const params = req.includes('?') ? parseParams(req.split('?')[1]) : {}

            const output = await apiReq.request('GET', path, params)
            
            $scope.output = beautifier.prettyPrint(output.data.data);
            if(!$scope.$$phase) $scope.$digest();

        } catch(error) {
            $scope.output = beautifier.prettyPrint(error.data);
            if(!$scope.$$phase) $scope.$digest();
        }

    }
});
