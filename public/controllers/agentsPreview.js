// Require config
require('plugins/wazuh/utils/infinite_scroll/infinite-scroll.js');
var app = require('ui/modules').get('app/wazuh', []);

app.factory('Agents', function($http, DataFactory) {
  var Agents = function(objectsArray, items, os_list) {
    this.items = items;
	this.objectsArray = objectsArray;
    this.busy = false;
    this.os_list = os_list;
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

app.controller('agentsPreviewController', function ($scope, DataFactory, Notifier, errlog, genericReq, Agents) {
    var ring = document.getElementsByClassName("uil-ring-css");
    ring[0].style.display="block";
    $scope.load = true;
    $scope.agents = [];
    $scope._status = 'all';
    $scope._os = 'all';
	$scope.defaultManager = $scope.$parent.state.getDefaultManager().name;
	$scope.mostActiveAgent = {"name" : "", "id" : ""};
	const notify = new Notifier({location: 'Agents - Preview'});
	
    var objectsArray = [];

    //Print Error
    var printError = function (error) {
        notify.error(error.message);
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
		DataFactory.setOffset(objectsArray['/agents'],0);
		DataFactory.get(objectsArray['/agents']).then(function (data) { 
			$scope.agents.items = data.data.items;
		});
    };

    $scope.agentStatusFilter = function (status) {
        if (status == 'all') {
            DataFactory.filters.unset(objectsArray['/agents'], 'status');
        } else {
            DataFactory.filters.set(objectsArray['/agents'], 'status', status);
        }
		DataFactory.setOffset(objectsArray['/agents'],0);
		DataFactory.get(objectsArray['/agents']).then(function (data) { 
			$scope.agents.items = data.data.items;
		});
    };
    
    $scope.agentOSFilter = function (os) {
        if (os == 'all') {
            DataFactory.filters.unset(objectsArray['/agents'], 'os');
        } else {
            DataFactory.filters.set(objectsArray['/agents'], 'os', os);
        }
		DataFactory.setOffset(objectsArray['/agents'],0);
		DataFactory.get(objectsArray['/agents']).then(function (data) { 
			$scope.agents.items = data.data.items;
		});
    };

    var load = function () {
        DataFactory.initialize('get', '/agents', {}, 30, 0)
            .then(function (data) {
                objectsArray['/agents'] = data;
				DataFactory.filters.register(objectsArray['/agents'], 'search', 'string');
				DataFactory.filters.register(objectsArray['/agents'], 'status', 'string');
                DataFactory.filters.register(objectsArray['/agents'], 'os', 'string');
				DataFactory.filters.register(objectsArray['/agents'], 'filter-sort', 'string');
                DataFactory.get(objectsArray['/agents'])
                    .then(function (data) {
						$scope.agents = new Agents(objectsArray, data.data.items, data.data.os_list);
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
        genericReq.request('GET', '/api/wazuh-elastic/top/'+$scope.defaultManager+'/agent.name')
            .then(function (data) {
				if(data.data == ""){
						$scope.mostActiveAgent.name = $scope.defaultManager;
						$scope.mostActiveAgent.id = "000";
						return;
				}
				$scope.mostActiveAgent.name = data.data;
				genericReq.request('GET', '/api/wazuh-elastic/top/'+$scope.defaultManager+'/agent.id')
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
		notify.error("Unexpected exception loading controller");
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
