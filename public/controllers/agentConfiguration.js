// Require config
let app = require('ui/modules').get('app/wazuh', []);

app.controller('agentConfigurationController', function($scope, $rootScope, Notifier, apiReq) {
    //Initialization
    const notify   = new Notifier({ location: 'Agent - Configuration' });
    $scope.load    = true;
    $scope.isArray = angular.isArray;
    $scope.groupName = $scope.agent.group;

    //Functions
    const load = () => {
        apiReq
        .request('GET', `/agents/groups/${$scope.groupName}/configuration`, {})
        .then(data => {
            $scope.groupConfiguration = data.data.data.items[0];
            $scope.load = false;
        })
        .catch(error => notify.error(error.message));
    };

    //Load
    try {
        load();
    } catch (e) {
        notify.error("Unexpected exception loading controller");
    }
});
