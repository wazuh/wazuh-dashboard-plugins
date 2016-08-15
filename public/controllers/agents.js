// Require utils
var kuf = require('plugins/wazuh/utils/kibanaUrlFormatter.js');
// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('agentsController', function ($scope, $q, $route, alertify, sharedProperties, $location, $sce, DataFactory, tabProvider, $mdToast, $mdSidenav, $mdDialog) {
    //Initialisation
    $scope.load = true;
    $scope.agentInfo = [];
    $scope.agents = [];
    $scope.search = '';
    $scope.menuNavItem = 'agents';
    $scope.submenuNavItem = 'overview';
    $scope.statusFilter = 'all';
    $scope.blocked = false;

    $scope.pageId = (Math.random().toString(36).substring(3));
    tabProvider.register($scope.pageId);

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

    //Tabs
    $scope.setTab = function (tab, group) {
        tabProvider.setTab($scope.pageId, tab, group);
    };

    $scope.isSetTab = function (tab, group) {
        return tabProvider.isSetTab($scope.pageId, tab, group);
    };

    //Functions
    $scope.showFiltersDialog = function (ev) {
        $mdDialog.show({
            contentElement: '#filtersDialog',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: true
        });
    };

    $scope.agentsGet = function (body) {
        $scope.blocked = true;
        //Search agent body modification
        if (!body) {
            var tmpBody = DataFactory.getBody(objectsArray['/agents']);
            if ($scope.search !== tmpBody['search']) {
                tmpBody['search'] = $scope.search;
                body = tmpBody;
            }
        } else if ($scope.search !== body['search']) {
            body['search'] = $scope.search;
        }
        if ((body) && (body['search'] === '')) {
            body['search'] = undefined;
        }

        if (!body) {
            DataFactory.get(objectsArray['/agents'])
                .then(function (data) {
                    $scope.agents.length = 0;
                    $scope.agents = data.data.items;
                    $scope.blocked = false;
                }, printError);
        } else {
            DataFactory.get(objectsArray['/agents'], body)
                .then(function (data) {
                    $scope.agents.length = 0;
                    $scope.agents = data.data.items;
                    $scope.blocked = false;
                }, printError);
        }
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
                $scope.agents.length = 0;
                $scope.agents = data.data.items;
                $scope.blocked = false;
                if (data.data.items.length > 0) {
                    defered.resolve(data.data.items);
                } else {
                    defered.reject();
                }
            }, function (data) {
                defered.reject();
                printError(data);
            });
        return promise;
    };

    $scope.agentsObj = {
        //Obj with methods for virtual scrolling
        getItemAtIndex: function (index) {
            if ($scope.blocked) {
                return null;
            }
            var _pos = index - DataFactory.getOffset(objectsArray['/agents']);
            if ((_pos > 15) || (_pos < 0)) {
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
        $mdToast.show($mdToast.simple().textContent('Restarting agent...'));
        DataFactory.getAndClean('put', '/agents/'+agent.id+'/restart', {})
        .then(function(data) {
            $mdToast.show($mdToast.simple().textContent('Agent restarted successfully.'));
        }, printError);
    };

    $scope.delete = function (agent, ev) {
         var confirm = $mdDialog.confirm()
          .title("Delete agent")
          .textContent("Are you sure you want to delete the agent with ID " + agent.id + "?")
          .ariaLabel('Delete agent')
          .targetEvent(ev)
          .ok('Yes')
          .cancel('No');

        $mdDialog.show(confirm).then(function () {
            DataFactory.getAndClean('delete', '/agents/'+agent.id, {})
            .then(function (data) {
                $scope._agent = undefined;
                $mdToast.show($mdToast.simple().textContent('Agent deleted successfully.'));
                $scope.agentsGet();
            }, printError);
        });
    };

    //DEPRECATED
    $scope.copyAgentKey = function () {
        var copyTextarea = document.querySelectorAll('.js-copytextarea')[0];
        copyTextarea.select();
        try {
            var successful = document.execCommand('copy');
            $mdToast.show($mdToast.simple().textContent('Key copied successfully.'));
        } catch (err) {
            $mdToast.show($mdToast.simple().textContent('Error: Copy button in this browser is not supported. Please, press Ctrl+C to copy.'));
        }
    };

    $scope.runSyscheck = function (agent) {
        $mdToast.show($mdToast.simple().textContent('Restarting FIM and rootcheck scan...'));
        DataFactory.getAndClean('put', '/syscheck/'+agent.id, {})
        .then(function (data) {
            $mdToast.show($mdToast.simple().textContent('FIM and rootcheck restarted successfully.'));
        }, printError);
    };

    $scope.deleteSyscheck = function (agent, ev) {
        var confirm = $mdDialog.confirm()
          .title("Delete file integrity monitoring database")
          .textContent("Are you sure to clear it in the agent " + agent.id + "? You can't undo this action.")
          .ariaLabel('Delete file integrity monitoring database')
          .targetEvent(ev)
          .ok('Yes')
          .cancel('No');

        $mdDialog.show(confirm).then(function () {
            DataFactory.getAndClean('delete', '/syscheck/'+agent.id, {})
            .then(function (data) {
                $mdToast.show($mdToast.simple().textContent('FIM database deleted successfully.'));
            }, printError);
        });
    };

    $scope.deleteRootcheck = function (agent, ev) {
        var confirm = $mdDialog.confirm()
          .title("Delete rootcheck database")
          .textContent("Are you sure to clear it in the agent " + agent.id + "? You can't undo this action.")
          .ariaLabel('Delete rootcheck database')
          .targetEvent(ev)
          .ok('Yes')
          .cancel('No');

        $mdDialog.show(confirm).then(function () {
            DataFactory.getAndClean('delete', '/rootcheck/'+agent.id, {})
            .then(function (data) {
                $mdToast.show($mdToast.simple().textContent('Rootcheck database deleted successfully.'));
            }, printError);
        });
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

    $scope.loadRootcheck = function (agentId) {
        sharedProperties.setProperty('rc//'+agentId);
        $location.path('/compliance');
    };

    $scope.loadFIM = function (agentId) {
        sharedProperties.setProperty('fim//'+agentId);
        $location.path('/fim');
    };

    $scope.agentStatusFilter = function () {
        var _status;
        if ($scope.statusFilter === 'all') {
            _status = undefined;
        } else {
            _status = $scope.statusFilter;
        }
        $scope.agentsGet({ 'sort': $scope.searchQuery, 'status': _status });
    };

    $scope.sort = function (keyname) {
        $scope.sortKey = keyname;
        $scope.reverse = !$scope.reverse;
        $scope.searchQuery = '';
        if (!$scope.reverse) {
            $scope.searchQuery += '-';
        }

        $scope.searchQuery += $scope.sortKey;
        if ($scope.statusFilter != '') {
            $scope.agentsGet({ 'sort': $scope.searchQuery, 'status': $scope.statusFilter });
        } else {
            $scope.agentsGet({ 'sort': $scope.searchQuery });
        }
    };

    $scope.loadAlertsUrl = function (agent, filters) {
        if (filters && filters != '') {
            var _filter = 'AgentName:'+agent + ' AND ' + filters;
        } else {
            var _filter = 'AgentName:'+agent;
        }
        sharedProperties.setProperty('aa//'+_filter);
        $location.path('/discover');
    };

    $scope.loadDashboardUrl = function (agent, filters) {
        if (filters && filters != '') {
            var _filter = 'AgentName:'+agent + ' AND ' + filters;
        } else {
            var _filter = 'AgentName:'+agent;
        }
        sharedProperties.setProperty('ad//'+_filter);
        $location.path('/dashboard');
    };

    $scope.loadComplianceDashboardUrl = function (agent, dashboard, filters) {
        if (filters && filters != '') {
            var _filter = 'AgentName:' + agent + ' AND ' + filters;
        } else {
            var _filter = 'AgentName:' + agent;
        }
        if (dashboard == 'pci') {
            sharedProperties.setProperty('ad//' + _filter);
            $location.path('/compliance/pci');
        } else if (dashboard == 'cis') {
            sharedProperties.setProperty('ad//' + _filter);
            $location.path('/compliance/cis');
        }
    };

    $scope.loadAgentMetrics = function (agent, filters) {
        if (filters && filters != '') {
            var _filter = 'AgentName:' + agent + ' AND ' + filters;
        } else {
            var _filter = 'AgentName:' + agent;
        }
        sharedProperties.setProperty('av//' + _filter);
        $location.path('/agents/metrics');
    };

    $scope.unitTest = function () {
        DataFactory.initialize('get', '/agents', {}, 200, 0)
            .then(function (instanceId) {
                //Start filters testing
                console.log('REGISTER 1 ' + JSON.stringify(DataFactory.filters.register(instanceId, 'search', 'string')));
                console.log('REGISTER 2 ' + JSON.stringify(DataFactory.filters.register(instanceId, 'status', 'string', true, 'all')));
                console.log('REGISTER 3 ' + JSON.stringify(DataFactory.filters.register(instanceId, 'filter-sort', 'string', true, 'status')));
                console.log('SETOR ' + JSON.stringify(DataFactory.filters.setOr(instanceId, 'status', 'search')));
                console.log('ALTERNATESET ' + JSON.stringify(DataFactory.filters.alternateSet(instanceId, 'filter-sort', '-status')));
                DataFactory.get(instanceId).then(function (data) {
                    console.log('BODY 1' + JSON.stringify(DataFactory.getBody(instanceId)));
                    console.log('TEST 1 ' + JSON.stringify(data));
                    DataFactory.filters.alternateSet(instanceId, 'filter-sort', '-status');
                    DataFactory.get(instanceId).then(function (data) {
                        console.log('BODY 2' + JSON.stringify(DataFactory.getBody(instanceId)));
                        console.log('TEST 2 ' + JSON.stringify(data));
                        DataFactory.filters.unset(instanceId, 'filter-sort');
                        DataFactory.filters.set(instanceId, 'search', 'agent');
                        DataFactory.get(instanceId).then(function (data) {
                            console.log('BODY 3' + JSON.stringify(DataFactory.getBody(instanceId)));
                            console.log('TEST 3 ' + JSON.stringify(data));
                            DataFactory.filters.set(instanceId, 'search', '16');
                            DataFactory.get(instanceId).then(function (data) {
                                console.log('BODY 4' + JSON.stringify(DataFactory.getBody(instanceId)));
                                console.log('TEST 4 ' + JSON.stringify(data));
                                DataFactory.filters.set(instanceId, 'search', 'Kibana');
                                DataFactory.get(instanceId).then(function (data) {
                                    console.log('BODY 5' + JSON.stringify(DataFactory.getBody(instanceId)));
                                    console.log('TEST 5 ' + JSON.stringify(data));
                                    DataFactory.filters.set(instanceId, 'status', 'enabled');
                                    DataFactory.get(instanceId).then(function (data) {
                                        console.log('BODY 6' + JSON.stringify(DataFactory.getBody(instanceId)));
                                        console.log('TEST 6 ' + JSON.stringify(data));
                                        console.log('TEST 7 ' + DataFactory.filters.isSet(instanceId, 'status', 'enabled'));
                                        DataFactory.filters.unregister(instanceId, 'search');
                                        DataFactory.filters.unregister(instanceId, 'status');
                                        DataFactory.filters.unregister(instanceId, 'filter-sort');
                                        DataFactory.get(instanceId).then(function (data) {
                                            console.log('BODY 8' + JSON.stringify(DataFactory.getBody(instanceId)));
                                            console.log('TEST 8 ' + JSON.stringify(data));
                                        }, printError);
                                    }, printError);

                                }, printError);

                            }, printError);

                        }, printError);

                    }, printError);

                }, printError);
            }, printError);
    };

    //Load
    DataFactory.initialize('get', '/agents', {}, 20, 0)
        .then(function (data) {
            objectsArray['/agents'] = data;
            DataFactory.get(data).then(function (data) {
                $scope.agents = data.data.items;
                $scope.agentsGet();
                DataFactory.filters.register(objectsArray['/agents'], 'search', 'string');
                $scope.load = false;
                //$scope.unitTest();
            }, printError);
        }, printError);

    //Destroy
    $scope.$on("$destroy", function () {
        angular.forEach(objectsArray, function (value) {
            DataFactory.clean(value)});
        $scope.agents.length = $scope.agentInfo.length = 0;
        tabProvider.clean($scope.pageId);
    });


});
