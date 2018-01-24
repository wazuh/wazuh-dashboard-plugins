const app = require('ui/modules').get('app/wazuh', []);

app.controller('healthCheck', function ($scope, genericReq, apiReq, appState, testAPI, Notifier, $timeout, $location, courier) {
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

    const errorHandler = error => {
        $scope.errors.push(error);
        $scope.processedChecks++;
    };

    const checkPatterns = async () => {
        try {
            const data         = await courier.indexPatterns.get(appState.getCurrentPattern());
            const patternTitle = data.title;

            if(checks.pattern){
                const patternData = await genericReq.request('GET', `/api/wazuh-elastic/pattern/${patternTitle}`);
                if (!patternData.data.status) {
                    $scope.errors.push("The selected index-pattern is not present.");
                }
                $scope.processedChecks++;
            }

            if(checks.template){
                const templateData = await genericReq.request('GET', `/api/wazuh-elastic/template/${patternTitle}`);
                if (!templateData.data.status) {
                    $scope.errors.push("No template found for the selected index-pattern.");
                }
                $scope.processedChecks++;
            }

            return;
        } catch (error) {
            errorHandler(error);
        }
    }

    const checkApiConnection = async () => {
        try {
            if(checks.api){
                const data = await testAPI.check_stored(JSON.parse(appState.getCurrentAPI()).id);
                
                if (data.data.error || data.data.data.apiIsDown) {
                    $scope.errors.push("Error connecting to the API.");
                    $scope.processedChecks++;
                } else { 
                    $scope.processedChecks++;
        
                    if(checks.setup){
                        const versionData = await apiReq.request('GET', '/version', {});
                        const apiVersion  = versionData.data.data;
                        const setupData   = await genericReq.request('GET', '/api/wazuh-elastic/setup');

                        if (apiVersion !== 'v' + setupData.data.data["app-version"]) {
                            $scope.errors.push("API version mismatch. Expected v" + setupData.data.data["app-version"]);
                        }
                        $scope.processedChecks++;
                    }
                }

            } else {
                if(checks.setup) $scope.processedChecks++;
            }

            return;
        } catch(error) {
            errorHandler(error);
        }
    }

    const timer = () =>  $location.path("/overview");
        
    $scope.$watch('processedChecks', () => {
        if ($scope.processedChecks === $scope.totalChecks && $scope.errors.length === 0) {
            $timeout(timer, 1500);
        }
    });

    const load = async () => {
        try {
            const configuration = await genericReq.request('GET', '/api/wazuh-api/configuration', {});
            
            if('data' in configuration.data && 'checks' in configuration.data.data){
                checks.pattern  = configuration.data.data.checks.pattern;
                checks.template = configuration.data.data.checks.template;
                checks.api      = configuration.data.data.checks.api;
                checks.setup    = configuration.data.data.checks.setup;
            }
            for(let key in checks) $scope.totalChecks += (checks[key]) ? 1 : 0;

            await Promise.all([ checkPatterns(), checkApiConnection() ]);
            if(!$scope.$$phase) $scope.$digest();
            return;
        } catch (error) {
            notify.error('Unexpected error occurred' + error.message);
        }
    }

    load();

});