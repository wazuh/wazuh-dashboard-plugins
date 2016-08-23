// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('agentsController', function ($scope, DataFactory, $mdToast) {
    //Initialisation
    $scope.load = true;
    $scope.agentInfo = [];
    $scope.menuNavItem = 'agents';
    $scope.submenuNavItem = 'overview';

    var objectsArray = [];

    //Print Error
    var printError = function (error) {
        $mdToast.show({
            template: '<md-toast>' + error.html + '</md-toast>',
            position: 'bottom left',
            hideDelay: 5000,
        });
        if ($scope.blocked) {
            $scope.blocked = false;
        }
    };

    //Functions

    $scope.getAgentStatusClass = function (agentStatus) {
        if (agentStatus == "Active")
            return "green"
        else if (agentStatus == "Disconnected")
            return "red";
        else
            return "red";
    };

    $scope.fetchAgent = function (agent) {
        DataFactory.getAndClean('get', '/agents/' + agent.id, {})
            .then(function (data) {
                $scope.agentInfo = data.data;
                if (agent.id != '000') {
                    DataFactory.getAndClean('get', '/agents/' + agent.id + '/key', {})
                        .then(function (data) {
                            $scope.agentInfo.key = data.data;
                            $scope.load = false;
                        }, printError);
                }
            }, printError);
        $scope.fetchFim(agent);
        $scope.fetchRootcheck(agent);
    };

    $scope.fetchFim = function (agent) {
        DataFactory.getAndClean('get', '/syscheck/' + agent.id + '/files', { 'offset': 0, 'limit': 5 })
            .then(function (data) {
                $scope.agentInfo.syscheckEvents = data.data.items;
            }, printError);
    };

    $scope.fetchRootcheck = function (agent) {
        DataFactory.getAndClean('get', '/rootcheck/' + agent.id, { 'offset': 0, 'limit': 5 })
            .then(function (data) {
                $scope.agentInfo.rootcheckEvents = data.data.items;
            }, printError);
    };

    $scope.restart = function (agent) {
        $mdToast.show({
            template: '<md-toast>Restarting agent...</md-toast>',
            position: 'bottom left',
            hideDelay: 5000,
        });
        DataFactory.getAndClean('put', '/agents/' + agent.id + '/restart', {})
            .then(function (data) {
                $mdToast.show({
                    template: '<md-toast>Restarted successfully.</md-toast>',
                    position: 'bottom left',
                    hideDelay: 5000,
                });
            }, printError);
    };

    $scope.addAgent = function () {
        if ($scope.newName == undefined) {
            notify.error('Error adding agent: Specify an agent name');
        }
        else if ($scope.newIp == undefined) {
            notify.error('Error adding agent: Specify an IP address');
        }
        else {
            DataFactory.getAndClean('post', '/agents', {
                name: $scope.newName,
                ip: $scope.newIp
            }).then(function (data) {
                $mdToast.show($mdToast.simple().textContent('Agent added successfully.'));
                $scope.agentsGet();
            }, printError);
        }
    };

    //Load
    $scope.fetchAgent($scope.$parent._agent);

    //Destroy
    $scope.$on("$destroy", function () {
        angular.forEach(objectsArray, function (value) {
            DataFactory.clean(value)
        });
    });

});
