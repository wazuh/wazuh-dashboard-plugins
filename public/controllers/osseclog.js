let app = require('ui/modules').get('app/wazuh', []);

// Logs controller
app.controller('managerLogController', function ($scope, Logs, apiReq) {
    $scope.searchTerm  = '';
    let requests       = 2;
    let servedRequests = 0;
    $scope.loading     = true;
    $scope.logs        = Logs;

    $scope.logs.nextPage('')
    .then(() => {
        servedRequests++;
        if (servedRequests === requests) {
            $scope.loading = false;
        }
    });

    apiReq.request('GET', '/manager/logs/summary', {})
    .then((data) => {
        $scope.summary = data.data.data;
        servedRequests++;
        if (servedRequests === requests) {
            $scope.loading = false;
        }
    });

    // Resetting the factory configuration
    $scope.$on("$destroy", () => $scope.logs.reset());
});