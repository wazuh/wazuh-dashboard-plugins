const app = require('ui/modules').get('app/wazuh', []);

app.controller('healthCheck', function ($scope, $rootScope, $timeout, $location, Notifier, courier, genericReq, apiReq, appState, testAPI,errorHandler) {
    const checks = {
        api     : true,
        pattern : true,
        setup   : true,
        template: true
    };

    const notify           = new Notifier();
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
                const patternData = await genericReq.request('GET', `/api/wazuh-elastic/pattern/${patternTitle}`);
                if (!patternData.data.status) {
                    $scope.errors.push("The selected index-pattern is not present.");
                } else {
                    $scope.processedChecks++;
                }
            }

            if(checks.template) {
                const templateData = await genericReq.request('GET', `/api/wazuh-elastic/template/${patternTitle}`);
                if (!templateData.data.status) {
                    $scope.errors.push("No template found for the selected index-pattern.");
                } else {
                    $scope.processedChecks++;
                }
            }

            return;
        } catch (error) {
            handleError(error);
        }
    }

    const checkApiConnection = async () => {
        try {
            if(checks.api) {
                const data = await testAPI.check_stored(JSON.parse(appState.getCurrentAPI()).id);

                if (data.data.error || data.data.data.apiIsDown) {
                    $scope.errors.push("Error connecting to the API.");
                } else { 
                    $scope.processedChecks++;
        
                    if(checks.setup) {
                        const versionData = await apiReq.request('GET', '/version', {});
                        const apiVersion  = versionData.data.data;
                        const setupData   = await genericReq.request('GET', '/api/wazuh-elastic/setup');

                        if (apiVersion !== 'v' + setupData.data.data["app-version"]) {
                            $scope.errors.push("API version mismatch. Expected v" + setupData.data.data["app-version"]);
                        } else {
                            $scope.processedChecks++;
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
    }

    const timer = () =>  $location.path($rootScope.previousLocation);

    const load = async () => {
        try {
            const configuration = await genericReq.request('GET', '/api/wazuh-api/configuration', {});
            appState.setPatternSelector(typeof configuration.data.data['ip.selector'] !== 'undefined' ? configuration.data.data['ip.selector'] : true)
            if('data' in configuration.data &&
               'timeout' in configuration.data.data && 
               Number.isInteger(configuration.data.data.timeout) && 
               configuration.data.data.timeout >= 1500
            ) {
                $rootScope.userTimeout = configuration.data.data.timeout;   
            }
            
            if('data' in configuration.data) {
                checks.pattern  = typeof configuration.data.data['checks.pattern']  !== 'undefined' ? configuration.data.data['checks.pattern']  : true;
                checks.template = typeof configuration.data.data['checks.template'] !== 'undefined' ? configuration.data.data['checks.template'] : true;
                checks.api      = typeof configuration.data.data['checks.api']      !== 'undefined' ? configuration.data.data['checks.api']      : true;
                checks.setup    = typeof configuration.data.data['checks.setup']    !== 'undefined' ? configuration.data.data['checks.setup']    : true;
            }

            for(let key in checks) $scope.totalChecks += (checks[key]) ? 1 : 0;

            if ($scope.totalChecks == 0) $scope.zeroChecks = true;

            await Promise.all([ checkPatterns(), checkApiConnection() ]);

            $scope.checksDone = true;

            if ($scope.processedChecks === $scope.totalChecks && $scope.errors.length === 0) {
                $timeout(timer, 1000);
            }

            if(!$scope.$$phase) $scope.$digest();
            return;
        } catch (error) {
            errorHandler.handle(error,'Health Check');
        }
    }

    load();

});