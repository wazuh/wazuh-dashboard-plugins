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
import beautifier   from 'plugins/wazuh/utils/json-beautifier'

const app = modules.get('app/wazuh', []);

// Logs controller
app.controller('devToolsController', function($scope, $rootScope, errorHandler,apiReq) {
    $scope.validJSON = true;
    $scope.requestText = 'GET /agents'
    $scope.output = beautifier.prettyPrint({})
    $scope.requestTextJson = JSON.stringify({
        limit: 1
    }, null, 4)

    const parseParams = req => {
        const result = {};
        req.split('&').forEach(part => {
            const item = part.split('=');
            result[item[0]] = decodeURIComponent(item[1]);
        });
        return result;
    }

    $scope.myFunc = () => {
        try {
            $scope.validJSON = true;
            const tmpCopy = JSON.parse($scope.requestTextJson);
  
            if(typeof tmpCopy === 'object' && !Object.keys(tmpCopy).length) {
                $scope.requestTextJson = '{\n\n}'
            } else {
                $scope.requestTextJson = JSON.stringify(tmpCopy, null, 4)
            }

        } catch (error) {
            $scope.validJSON = false;
        }
    }

    $scope.send = async () => {
        try {
            const method = $scope.requestText.startsWith('GET') ? 
                           'GET' :
                           $scope.requestText.startsWith('POST') ?
                           'POST' :
                           $scope.requestText.startsWith('PUT') ?
                           'PUT' :
                           $scope.requestText.startsWith('DELETE') ?
                           'DELETE' :
                           'GET';

            const requestCopy = $scope.requestText.includes(method) ?
                                $scope.requestText.split(method)[1].trim() :
                                $scope.requestText;

            const req = requestCopy ?
                        requestCopy.startsWith('/') ? 
                        requestCopy :  
                        `/${requestCopy}` :
                        '/';

            let validJSON = true, JSONraw = {};
            try {
                JSONraw = JSON.parse($scope.requestTextJson);
            } catch(error) {
                validJSON = false;
            }

            const path   = req.includes('?') ? req.split('?')[0] : req;
            const params = req.includes('?') ? parseParams(req.split('?')[1]) : {}

            const output = await apiReq.request(method, path, validJSON && !req.includes('?') ? JSONraw : params)
            
            $scope.output = beautifier.prettyPrint(output.data.data);
            if(!$scope.$$phase) $scope.$digest();

        } catch(error) {
            $scope.output = beautifier.prettyPrint(error.data);
            if(!$scope.$$phase) $scope.$digest();
        }

    }

    $scope.send();
});
