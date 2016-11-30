// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('agentsController', function ($scope, DataFactory, $mdToast) {

    //Initialisation
    $scope.load = true;
    $scope.agentInfo = [];

    var objectsArray = [];
    var loadWatch;

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
	
    $scope.setTimer = function (time) {
        $scope.timerFilterValue = time;
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
        DataFactory.getAndClean('get', '/syscheck/' + agent.id, { 'offset': 0, 'limit': 5 })
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

    //Load
    loadWatch = $scope.$watch(function () {
        return $scope.$parent._agent;
    }, function () {
        $scope.fetchAgent($scope.$parent._agent);
    });

	//Load
    try {
		$scope.setTimer($scope.$parent.timeFilter);
    } catch (e) {
        $mdToast.show({
            template: '<md-toast> Unexpected exception loading controller </md-toast>',
            position: 'bottom left',
            hideDelay: 5000,
        });
        errlog.log('Unexpected exception loading controller', e);
    }
	
    // Timer filter watch
    var loadWatch2 = $scope.$watch(function () {
        return $scope.$parent.timeFilter;
    }, function () {
        $scope.setTimer($scope.$parent.timeFilter);
    });
	
    //Destroy
    $scope.$on("$destroy", function () {
        angular.forEach(objectsArray, function (value) {
            DataFactory.clean(value)
        });
        loadWatch();
		loadWatch2();
    });

});

app.controller('agentsPreviewController', function ($scope, DataFactory, $mdToast, errlog, genericReq) {

    //Initialisation
    $scope.load = true;
    $scope.agents = [];
    $scope._status = 'all';
	$scope.defaultManager = $scope.$parent.state.getDefaultManager().name;
	$scope.mostActiveAgent = {"name" : "", "id" : ""};
    $scope.submenuNavItem = "preview";

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
    $scope.setSort = function (field) {
        if ($scope._sort === field) {
            if ($scope._sortOrder) {
                $scope._sortOrder = false;
                $scope._sort = '';
                DataFactory.filters.unset(objectsArray['/agents'], 'filter-sort');
            } else {
                $scope._sortOrder = true;
                DataFactory.filters.set(objectsArray['/agents'], 'filter-sort', field);
            }
        } else {
            $scope._sortOrder = false;
            $scope._sort = field;
            DataFactory.filters.set(objectsArray['/agents'], 'filter-sort', '-' + field);
        }
    };

    $scope.agentSearchFilter = function (search) {
        if (search) {
            DataFactory.filters.set(objectsArray['/agents'], 'search', search);
        } else {
            DataFactory.filters.unset(objectsArray['/agents'], 'search');
        }
    };

    $scope.agentStatusFilter = function (status) {
        if (status == 'all') {
            DataFactory.filters.unset(objectsArray['/agents'], 'status');
        } else {
            DataFactory.filters.set(objectsArray['/agents'], 'status', status);
        }
    };



    $scope.agentsObj = {
        //Obj with methods for virtual scrolling
        getItemAtIndex: function (index) {
            if ($scope.blocked) {
                return null;
            }
            var _pos = index - DataFactory.getOffset(objectsArray['/agents']);
            if (DataFactory.filters.flag(objectsArray['/agents'])) {
                $scope.blocked = true;
                DataFactory.scrollTo(objectsArray['/agents'], 50)
                    .then(function (data) {
                        $scope.agents.length = 0;
                        $scope.agents = data.data.items;
                        DataFactory.filters.unflag(objectsArray['/agents']);
                        $scope.blocked = false;
                    }, printError);
            } else if ((_pos > 70) || (_pos < 0)) {
                $scope.blocked = true;
                DataFactory.scrollTo(objectsArray['/agents'], index)
                    .then(function (data) {
                        $scope.agents.length = 0;
                        $scope.agents = data.data.items;
                        $scope.blocked = false;
                    }, printError);
            } else {
                return $scope.agents[_pos];
            }
        },
        getLength: function () {
            return DataFactory.getTotalItems(objectsArray['/agents']);
        },
    };



    var load = function () {
        DataFactory.initialize('get', '/agents', {}, 100, 0)
            .then(function (data) {
                objectsArray['/agents'] = data;
                DataFactory.get(objectsArray['/agents'])
                    .then(function (data) {
                        $scope.agents = data.data.items;
                        DataFactory.filters.register(objectsArray['/agents'], 'search', 'string');
                        DataFactory.filters.register(objectsArray['/agents'], 'status', 'string');
                        DataFactory.filters.register(objectsArray['/agents'], 'filter-sort', 'string');
                        $scope.load = false;
                    }, printError);
            }, printError);
			
		DataFactory.getAndClean('get', '/agents', { offset: 0, limit: 1, sort: '-id' })
            .then(function (data) {
                DataFactory.getAndClean('get', '/agents/' + data.data.items[0].id, {})
                    .then(function (data) {
                        $scope.lastAgent = data.data;
                    }, printError);
            }, printError);	
			
		// Tops
		var date = new Date();
        date.setDate(date.getDate() - 1);
        var timeAgo = date.getTime();
        genericReq.request('GET', '/api/wazuh-elastic/top/'+$scope.defaultManager+'/AgentName')
            .then(function (data) {
				if(data.data == ""){
						$scope.mostActiveAgent.name = $scope.defaultManager;
						$scope.mostActiveAgent.id = "000";
						return;
				}
				$scope.mostActiveAgent.name = data.data;
				genericReq.request('GET', '/api/wazuh-elastic/top/'+$scope.defaultManager+'/AgentID')
				.then(function (data) {
					if(data.data == "" && $scope.mostActiveAgent.name != ""){
						$scope.mostActiveAgent.id = "000";
					}else{
						$scope.mostActiveAgent.id = data.data;
					}
								
				}, printError);	
            }, printError);	
			
		DataFactory.getAndClean('get', '/agents/summary', {})
            .then(function (data) {
                $scope.agentsCountActive = data.data.Active;
                $scope.agentsCountDisconnected = data.data.Disconnected;
                $scope.agentsCountNeverConnected = data.data['Never connected'];
                $scope.agentsCountTotal = data.data.Total;
                $scope.agentsCoverity = (data.data.Active / data.data.Total) * 100;
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
            DataFactory.clean(value)
        });
        $scope.agents.length = 0;
    });
});
