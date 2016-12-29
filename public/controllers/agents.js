// Require config
require('plugins/wazuh/utils/infinite_scroll/infinite-scroll.js');
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
				$scope.$parent._agent.status = data.data.status;
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

app.factory('Agents', function($http, DataFactory) {
  var Agents = function(objectsArray, items) {
    this.items = items;
	this.objectsArray = objectsArray;
    this.busy = false;
  };

  Agents.prototype.nextPage = function() {
	
    if (this.busy) return;
    this.busy = true;
	DataFactory.next(this.objectsArray['/agents']).then(function (data) {
			var items = data.data.items;
			for (var i = 0; i < items.length; i++) {
				this.items.push(items[i]);
			}
			this.busy = false;
        }.bind(this), 
		function (data) {
			this.busy = false;
		}.bind(this));
		
	};
  return Agents;
});

app.controller('agentsPreviewController', function ($scope, DataFactory, $mdToast, errlog, genericReq, Agents) {

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
       $scope._sort = field;
		$scope._sortOrder = !$scope._sortOrder;
        if ($scope._sortOrder) {
			DataFactory.filters.set(objectsArray['/agents'], 'filter-sort',field);
		} else {
			DataFactory.filters.set(objectsArray['/agents'], 'filter-sort', '-' + field);
		}
		
		DataFactory.setOffset(objectsArray['/agents'],0);
		DataFactory.get(objectsArray['/agents']).then(function (data) { 
			$scope.agents.items = data.data.items;
		});
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

    var load = function () {
        DataFactory.initialize('get', '/agents', {}, 30, 0)
            .then(function (data) {
                objectsArray['/agents'] = data;
				DataFactory.filters.register(objectsArray['/agents'], 'search', 'string');
				DataFactory.filters.register(objectsArray['/agents'], 'status', 'string');
				DataFactory.filters.register(objectsArray['/agents'], 'filter-sort', 'string');
                DataFactory.get(objectsArray['/agents'])
                    .then(function (data) {
						$scope.agents = new Agents(objectsArray, data.data.items);
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
