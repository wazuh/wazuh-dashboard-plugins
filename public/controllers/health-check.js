/*
 * Wazuh app - Heakthcheck controller
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

app.controller('healthCheck', 
function ($scope, $rootScope, $timeout, $location, 
          courier, genericReq, apiReq, appState, testAPI, 
          errorHandler, wazuhConfig
) {
    const checks = {
        api     : true,
        pattern : true,
        setup   : true,
        template: true
    };

    $scope.errors          = [];
    $scope.processedChecks = 0;
    $scope.totalChecks     = 0;

    const handleError = error => {
        errorHandler.handle(error,'Health Check');
        $scope.errors.push(errorHandler.handle(error,'Health Check',false,true));
    };

    const checkPatterns = async () => {
        try {
            const data         = await courier.indexPatterns.get(appState.getCurrentPattern());
            const patternTitle = data.title;

            if(checks.pattern) {
                const i = $scope.results.map(item => item.id).indexOf(2);
                const patternData = await genericReq.request('GET', `/api/wazuh-elastic/pattern/${patternTitle}`);
                if (!patternData.data.status) {
                    $scope.errors.push("The selected index-pattern is not present.");
                    $scope.results[i].status = 'Error';
                } else {
                    $scope.processedChecks++;
                    $scope.results[i].status = 'Ready';
                }
            }

            if(checks.template) {
                const i = $scope.results.map(item => item.id).indexOf(3);
                const templateData = await genericReq.request('GET', `/api/wazuh-elastic/template/${patternTitle}`);
                if (!templateData.data.status) {
                    $scope.errors.push("No template found for the selected index-pattern.");
                    $scope.results[i].status = 'Error';
                } else {
                    $scope.processedChecks++;
                    $scope.results[i].status = 'Ready';
                }
            }

            return;
        } catch (error) {
            handleError(error);
        }
    };

    const checkApiConnection = async () => {
        try {
            if(checks.api) {
                const data = await testAPI.check_stored(JSON.parse(appState.getCurrentAPI()).id);

                const i = $scope.results.map(item => item.id).indexOf(0);
                if (data.data.error || data.data.data.apiIsDown) {
                    $scope.errors.push("Error connecting to the API.");
                    $scope.results[i].status = 'Error';
                } else {
                    $scope.processedChecks++;
                    $scope.results[i].status = 'Ready';
                    if(checks.setup) {
                        const versionData = await apiReq.request('GET', '/version', {});
                        const apiVersion  = versionData.data.data;
                        const setupData   = await genericReq.request('GET', '/api/wazuh-elastic/setup');
                        if(!setupData.data.data["app-version"] || !apiVersion){
                            errorHandler.handle('Error fetching app version or API version','Health Check');
                            $scope.errors.push('Error fetching version');
                        }
                        const apiSplit = apiVersion.split('v')[1].split('.');
                        const appSplit = setupData.data.data["app-version"].split('.');

                        const i = $scope.results.map(item => item.id).indexOf(1);
                        if (apiSplit[0] !== appSplit[0] || apiSplit[1] !== appSplit[1]) {
                            $scope.errors.push("API version mismatch. Expected v" + setupData.data.data["app-version"]);
                            $scope.results[i].status = 'Error';
                        } else {
                            $scope.processedChecks++;                            
                            $scope.results[i].status = 'Ready';
                        }
                    }
                }
            } else {
                if(checks.setup) $scope.processedChecks++;
            }

            return;
        } catch(error) {
            handleError(error);
        }
    };

    $scope.goApp = () => $location.path($rootScope.previousLocation || '/');
    
    $scope.results = [];

    const load = async () => {
        try {
            const configuration = wazuhConfig.getConfig();
            
            appState.setPatternSelector(configuration['ip.selector']);
            
            checks.pattern  = configuration['checks.pattern'];
            checks.template = configuration['checks.template'];
            checks.api      = configuration['checks.api'];
            checks.setup    = configuration['checks.setup'];

            $scope.results.push({ id:0,description: 'Check Wazuh API connection',status: checks.api ? 'Checking...' : 'disabled' });
            $scope.results.push({ id:1,description: 'Check for Wazuh API version',status: checks.setup ? 'Checking...' : 'disabled' });
            $scope.results.push({ id:2,description: 'Check Elasticsearch index pattern',status: checks.pattern ? 'Checking...' : 'disabled' });
            $scope.results.push({ id:3,description: 'Check Elasticsearch template',status: checks.template ? 'Checking...' : 'disabled'});

            for(let key in checks) $scope.totalChecks += (checks[key]) ? 1 : 0;

            if ($scope.totalChecks == 0) $scope.zeroChecks = true;

            await Promise.all([ checkPatterns(), checkApiConnection() ]);

            $scope.checksDone = true;
            if(!$scope.errors || !$scope.errors.length) {
                $timeout(() => $location.path($rootScope.previousLocation || '/'), 800);
                return;
            }

            if(!$scope.$$phase) $scope.$digest();
            return;
        } catch (error) {
            errorHandler.handle(error,'Health Check');
        }
    }

    load();

});
