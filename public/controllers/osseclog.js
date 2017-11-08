let app = require('ui/modules').get('app/wazuh', []);

// Logs controller
app.controller('managerLogController', function ($scope, Logs, apiReq) {
    $scope.searchTerm  = '';
    $scope.loading     = true;
    $scope.logs        = Logs;

    $scope.logs.nextPage('')
    .then(() => apiReq.request('GET', '/manager/logs/summary', {}))
    .then(data => {
        $scope.summary = data.data.data;
        $scope.loading = false;
    });

    // Resetting the factory configuration
    $scope.$on("$destroy", () => $scope.logs.reset());
});