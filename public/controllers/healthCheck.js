let app = require('ui/modules').get('app/wazuh', []);

app.controller('healthCheck', function ($scope, genericReq, apiReq, appState, testAPI, Notifier, $timeout, $location, courier) {

    const notify = new Notifier();
    $scope.errors = [];
    $scope.processedChecks = 0;
    $scope.totalChecks = 4;

    courier.indexPatterns.get(appState.getCurrentPattern())
    .then((data) => {

        let patternTitle = data.title;
        // Check index-pattern 
        genericReq.request('GET', `/api/wazuh-elastic/pattern/${patternTitle}`)
        .then((data) => {
            if (!data.data.status) {
                $scope.errors.push("The selected index-pattern is not present.");
            }
            $scope.processedChecks++;
        })
        .catch(error => {
            $scope.errors.push(error);
            $scope.processedChecks++;
        });

        // Check template
        genericReq.request('GET', `/api/wazuh-elastic/template/${patternTitle}`)
        .then((data) => {
            if (!data.data.status) {
                $scope.errors.push("No template found for the selected index-pattern.");
            }
            $scope.processedChecks++;
        })
        .catch((error) => {
            $scope.errors.push(error);
            $scope.processedChecks++;
        });

    })
    .catch((error) => {
        notify.error("Error getting patterns from Kibana...");
    });

    // Check API connection
    testAPI.check_stored(JSON.parse(appState.getCurrentAPI()).id)
    .then(data => {
        if (data.data.error || data.data.data.apiIsDown) {
            $scope.errors.push("Error connecting to the API.");
            $scope.processedChecks++;
        } else { 
            $scope.processedChecks++;

            apiReq.request('GET', '/version', {})
            .then(data => {
                let apiVersion = data.data.data;
                genericReq.request('GET', '/api/wazuh-elastic/setup')
                .then(data => {
                    if (apiVersion !== 'v' + data.data.data["app-version"]) {
                        $scope.errors.push("API version mismatch. Expected v" + data.data.data["app-version"]);
                    }
                    $scope.processedChecks++;
                })
                .catch((error) => {
                    $scope.errors.push(error);
                    $scope.processedChecks++;
                });
            })
            .catch((error) => {
                $scope.errors.push(error);
                $scope.processedChecks++;
            });
        }
    })
    .catch((error) => {
        $scope.errors.push(error);
        $scope.processedChecks++;   
    });

    var timer = function() {
        $location.path("/overview");
    }
        
    $scope.$watch('processedChecks', () => {
        if ($scope.processedChecks == $scope.totalChecks && $scope.errors.length == 0) { // 
            $timeout(timer, 1500);
        }
    });
});
