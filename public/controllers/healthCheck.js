let app = require('ui/modules').get('app/wazuh', []);

app.controller('healthCheck', function ($scope, genericReq, appState, testAPI, Notifier, $timeout, $location, courier) {

    const notify = new Notifier();
    $scope.indexStatus = "Checking index-pattern...";
    $scope.APIStatus = "Checking API connection...";
    $scope.templateStatus = "Checking template...";
    $scope.errors = [];
    $scope.noErrors = [];

    courier.indexPatterns.get(appState.getCurrentPattern())
    .then((data) => {

        let patternTitle = data.title;
        // Check index-pattern 
        genericReq.request('GET', `/api/wazuh-elastic/pattern/${patternTitle}`)
        .then((data) => {
            if (data.data.status) {
                $scope.indexDone = 1;
                $scope.noErrors.push(true);
            } else {
                $scope.indexDone = 2;
                $scope.errors.push("The selected index-pattern is not present.");
            }
        });

        // Check template
        genericReq.request('GET', `/api/wazuh-elastic/template/${patternTitle}`)
        .then((data) => {
            if (data.data.status) {
                $scope.noErrors.push(true);
                $scope.templateDone = 1;
            } else {
                $scope.templateDone = 2;
                $scope.errors.push("No template found for the selected index-pattern.");
            }
        })
        .catch((error) => {
            $scope.errors.push(error);
        });

        // Check API connection
        testAPI.check_stored(JSON.parse(appState.getCurrentAPI()).id)
        .then(data => {
            if (data.data.error || data.data.data.apiIsDown) {
                $scope.APIDone = 2;
                $scope.errors.push("Error connecting to the API.");
            } else { 
                $scope.noErrors.push(true);
                $scope.APIDone = 1;
            }
        });
    })
    .catch((error) => {
        notify.error("Error getting patterns from Kibana...");
    });

    var timer = function() {
        $location.path("/overview");
    }
        
    $scope.$watch('noErrors.length', () => {
        if ($scope.noErrors.length == 3) { // 
            //$timeout(timer, 1500);
        }
    });
});
