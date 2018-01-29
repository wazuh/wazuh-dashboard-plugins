const app = require('ui/modules').get('app/wazuh', []);

// Logs controller
app.controller('managerLogController', function ($scope, Logs, apiReq,Notifier) {
    const notify = new Notifier({ location: 'Manager - Logs' });
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
            if(error.data && error.data.errorData && error.data.errorData.error === 1000){
                //console.log(error.data.errorData.message);
            } else {
                notify.error(error.message);
            }
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
            notify.error(error.message)
        }
    }

    initialize();

    // Resetting the factory configuration
    $scope.$on("$destroy", () => $scope.logs.reset());
});