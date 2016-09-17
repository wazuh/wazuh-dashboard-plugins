// Require utils
var kuf = require('plugins/wazuh/utils/kibanaUrlFormatter.js');
// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('generalController', function ($scope, $q, DataFactory, tabProvider, $mdToast, appState, errlog) {
    //Initialisation
    $scope.load = true;
    $scope.search = '';
    $scope.menuNavItem = 'agents';
    $scope.submenuNavItem = '';
    $scope.state = appState;

	/*
    if ($scope.state.getAgentsState().data) {
        $scope.submenuNavItem = $scope.state.getAgentsState().subtab;
        $scope._agent = $scope.state.getAgentsState().data;
        $scope.search = $scope._agent.name;
    }
	*/
	
    var objectsArray = [];

    $scope.pageId = (Math.random().toString(36).substring(3));
    tabProvider.register($scope.pageId);

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

    //Tabs
    $scope.setTab = function (tab, group) {
        tabProvider.setTab($scope.pageId, tab, group);
    };

    $scope.isSetTab = function (tab, group) {
        return tabProvider.isSetTab($scope.pageId, tab, group);
    };

    //Functions

    $scope.getAgentStatusClass = function (agentStatus) {
        if (agentStatus == "active")
            return "green"
        else if (agentStatus == "disconnected")
            return "red";
        else
            return "red";
    };
	
	$scope.formatAgentStatus = function (agentStatus) {
        if (agentStatus == "active")
            return "Active"
        else if (agentStatus == "disconnected")
            return "Disconnected";
        else
            return "Never connected";
    };

    $scope.agentsSearch = function (search) {
        var defered = $q.defer();
        var promise = defered.promise;
		
        if (search) {
            DataFactory.filters.set(objectsArray['/agents'], 'search', search);
        } else {
            DataFactory.filters.unset(objectsArray['/agents'], 'search');
        }

        DataFactory.get(objectsArray['/agents'])
            .then(function (data) {
                defered.resolve(data.data.items);
            }, function (data) {
                printError(data);
                defered.reject();
            });
        return promise;
    };
	
	$scope.watchAgents = function(){
		  $scope.$watch('[]', function () {}, true);    
		  $scope.submenuNavItem = 'preview';
		  $scope._agent = "";
          $scope.search = "";
	}	

    $scope.applyAgent = function (agent) {
        if (agent) {
            $scope.submenuNavItem = 'overview';
            $scope._agent = agent;
            $scope.search = agent.name;
        }
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

    
    var load = function () {
        DataFactory.initialize('get', '/agents', {}, 256, 0)
            .then(function (data) {
                objectsArray['/agents'] = data;
                DataFactory.get(data).then(function (data) {
                    DataFactory.filters.register(objectsArray['/agents'], 'search', 'string');
                    $scope.load = false;
                }, printError);
            }, printError);
    };

    //Load
    try {
        load();
    } catch (e) {
        $mdToast.show({
            template: '<md-toast> Unexpected exception loading controller </md-toast>',
            position: 'bottom left',
            hideDelay: 5000,
        });
        errlog.log('Unexpected exception loading controller', e);
    }

    //Destroy
    $scope.$on("$destroy", function () {
        angular.forEach(objectsArray, function (value) {
            DataFactory.clean(value)});
        tabProvider.clean($scope.pageId);
    });


});

app.controller('stateController', function ($scope, appState) {
    $scope.state = appState;
});