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

app.controller('agentsPreviewController', function ($scope, $mdDialog, DataFactory, Notifier, errlog, genericReq, Agents, apiReq) {
    $scope.load = true;
    $scope.agents = [];
    $scope._status = 'all';
    $scope._os = 'all';
	$scope.defaultManager = $scope.$parent.state.getDefaultManager().name;
	$scope.mostActiveAgent = {"name" : "", "id" : ""};
	$scope.osPlatforms = [];
	$scope.osVersions = new Set();
	$scope.agentsStatus = false;
	$scope.newAgent = {
		'name': '', 'ip': ''
	};
	$scope.newAgentKey = '';
	$scope.permissions = {
		'add': false,
		'delete':false,
		'restart': false
	};
	$scope.showingNewAgentDialog = false;
	
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
    
	$scope.agentOSPlatformFilter = function (osName) {
		$scope.$parent._osVersion='all';
		DataFactory.filters.unset(objectsArray['/agents'], 'os.version');

		if (osName == 'all') {
			DataFactory.filters.unset(objectsArray['/agents'], 'os.platform');
		} else {
			DataFactory.filters.set(objectsArray['/agents'], 'os.platform', osName);
		}
		DataFactory.setOffset(objectsArray['/agents'],0);
		DataFactory.get(objectsArray['/agents']).then(function (data) { 
			$scope.agents.items = data.data.items;
		if(osName == 'all'){
			$scope.osVersions = [];
		}
		else{
			var osVersions = new Set();
			$scope.agents.items.forEach(function(agent){
				if(agent.os)
				osVersions.add(agent.os.version);
			});
			$scope.osVersions = Array.from(osVersions);
		}
		});
	};
 
	function bulkOperation(operation){
		var selectedAgents = [];
		angular.forEach($scope.agents.items, function(agent){
			if(agent.selected){
				selectedAgents.push(agent.id);
			}
		});
		var requestData = {
			'ids': selectedAgents
		}
		if(selectedAgents.length > 0){
			switch (operation){
				case "delete":
					apiReq.request('DELETE', '/agents', requestData)
						.then(function (data) {
							if(data.data.ids.length!=0){
								data.data.ids.forEach(function(id) {
									notify.error('The agent ' + id + ' was not deleted.');
								});
							} 
							else{
								notify.info(data.data.msg);
							}
							load();
						}, printError);
					break;

				case "restart":
					apiReq.request('POST', '/agents/restart', requestData)
						.then(function (data) {
							if(data.data.ids.length!=0){
								data.data.ids.forEach(function(id) {
								notify.error('The agent ' + id + ' was not restarted.');
								});
							} 
							else{
								notify.info(data.data.msg);
							}
							load();
						}, printError);
					break;
			}
		}
		$scope.$parent._bulkOperation="nothing";
	}
	
	$scope.changeAgentsStatus = function (){
		angular.forEach($scope.agents.items, function(agent){
			agent.selected = $scope.agentsStatus;
		});
	}

	$scope.saveNewAgent = function (){
		if($scope.newAgent.name != '') {
			var requestData = {
				'name': $scope.newAgent.name,
				'ip': $scope.newAgent.ip == '' ? 'any' : $scope.newAgent.ip
			}
			apiReq.request('POST', '/agents', requestData)
				.then(function (data) {
					if(data.error=='0'){
						notify.info('The agent was added successfully.');
						apiReq.request('GET', '/agents/' + data.data + '/key', {})
							.then(function(data) {
								$scope.newAgentKey = data.data;
								load();
							});
					}
					else{
						$scope.hidePrerenderedDialog();
						notify.error('There was an error adding the new agent.');
					}
				}, 
				function(error){
					printError(error);
					$scope.hidePrerenderedDialog();
				});
		}
		else{
			$scope.hidePrerenderedDialog();
			notify.error('The agent name is mandatory.');
		}
	}
	
	$scope.showNewAgentDialog = function(ev) {
		$scope.showingNewAgentDialog = true;
		$mdDialog.show({
			contentElement: '#newAgentDialog',
			parent: angular.element(document.body),
			targetEvent: ev
		});
	};
	
	$scope.showDeletePrompt = function(ev) {
		// Appending dialog to document.body to cover sidenav in docs app
		var confirm = $mdDialog.prompt()
			.title('Remove selected agents')
			.textContent('Write REMOVE to remove all the selected agents. CAUTION! This action can not be undone.')
			.targetEvent(ev)
			.ok('Remove')
			.cancel('Close');

		$mdDialog.show(confirm).then(function(result) {
			if(result==='REMOVE'){
				bulkOperation('delete');
			};
		});
	};
	
	$scope.showRestartConfirm = function(ev) {
		// Appending dialog to document.body to cover sidenav in docs app
		var confirm = $mdDialog.confirm()
			.title('Restart agents')
			.textContent('Confirm restarting all the selected agents.')
			.targetEvent(ev)
			.ok('Restart')
			.cancel('Close');

		$mdDialog.show(confirm).then(function() {
			bulkOperation('restart');
		});
	};
	
	$scope.hidePrerenderedDialog = function(ev) {
		$scope.newAgentKey = '';
		$scope.showingNewAgentDialog = false;
		$mdDialog.hide('#newAgentDialog');
	};
	
	var getAgentsPermissions = function () {
		genericReq.request('GET', '/api/wazuh-api/agents/permissions')
			.then(function (data, status) {
				$scope.permissions = data;
			}, function (data, status) {
				notify.error("Error while loading agents permissions.");
			})
	}

    var load = function () {
		$scope.newAgent = {
			'name': '', 'ip': ''
		};
		$scope.agentsStatus = false;
		getAgentsPermissions();
        
		DataFactory.initialize('get', '/agents', {}, 30, 0)
            .then(function (data) {
                objectsArray['/agents'] = data;
				DataFactory.filters.register(objectsArray['/agents'], 'search', 'string');
				DataFactory.filters.register(objectsArray['/agents'], 'status', 'string');
                DataFactory.filters.register(objectsArray['/agents'], 'os.platform', 'string');
                DataFactory.filters.register(objectsArray['/agents'], 'os.version', 'string');
				DataFactory.filters.register(objectsArray['/agents'], 'filter-sort', 'string');
                DataFactory.get(objectsArray['/agents'])
                    .then(function (data) {
						$scope.agents = new Agents(objectsArray, data.data.items, data.data.os_list);
						var osPlatforms = new Set();
						$scope.agents.items.forEach(function(agent){
							if(agent.os)
								osPlatforms.add(agent.os.platform);
						});
						$scope.osPlatforms = Array.from(osPlatforms);
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
