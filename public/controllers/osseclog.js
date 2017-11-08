let app = require('ui/modules').get('app/wazuh', []);

// We are using the DataHandler template and customize its path to get information about logs
app.factory('Logs', function (DataHandler) {
    let Logs  = new DataHandler();
    Logs.path = '/manager/logs';
    return Logs;
});

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