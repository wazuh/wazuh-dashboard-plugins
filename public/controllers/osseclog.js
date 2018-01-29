const app = require('ui/modules').get('app/wazuh', []);

// Logs controller
app.controller('managerLogController', function ($scope, $rootScope, Logs, apiReq,errorHandler) {
    $scope.searchTerm  = '';
    $scope.loading     = true;
    $scope.logs        = Logs;
    $scope.realtime    = false;
    let intervalId     = null;

    const getRealLogs = async () => {
        try{
            const data = await apiReq.request('GET', '/manager/logs', {limit:20});
            $scope.realLogs = data.data.data.items;
            if(!$scope.$$phase) $scope.$digest();
            return;
        } catch (error) {
            errorHandler.handle(error);
            if(!$rootScope.$$phase) $rootScope.$digest();
        }
    };

    $scope.playRealtime = async () => {
        $scope.realtime = true;
        await getRealLogs();
        intervalId = setInterval(getRealLogs,2500);
    };    

    $scope.stopRealtime = () => {
        $scope.realtime   = false;
        clearInterval(intervalId);
        if(!$scope.$$phase) $scope.$digest();
    }

    const initialize = async () => {
        try{
            await $scope.logs.nextPage();
            const data = await apiReq.request('GET', '/manager/logs/summary', {});
            $scope.summary = data.data.data;
            $scope.loading = false;
            if(!$scope.$$phase) $scope.$digest();
            return;
        } catch (error) {
            errorHandler.handle(error);
            if(!$rootScope.$$phase) $rootScope.$digest();
        }
    }

    initialize();

    // Resetting the factory configuration
    $scope.$on("$destroy", () => $scope.logs.reset());
});