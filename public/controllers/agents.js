// Require utils
var kuf = require('plugins/wazuh/utils/kibanaUrlFormatter.js');
// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('agentsController', function ($scope, $route, alertify, sharedProperties, $location, $sce, DataFactory, tabProvider, $mdToast, $mdSidenav, $mdDialog) {
    //Initialisation
    $scope.load = true;
    $scope.agentInfo = [];
    $scope.agents = [];
    $scope.search = '';
    $scope.currentNavItem = 'overview';
    $scope.blocked = false;

    $scope.pageId = (Math.random().toString(36).substring(3));
    tabProvider.register($scope.pageId);

    var objectsArray = [];

    //Print Error
    var printError = function (error) {
        $mdToast.show({
            template: '<md-toast>' + error.html + '</md-toast>',
            position: 'bottom left',
            hideDelay: 5000
        });
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

    $scope.toggleSidenav = function () {
        $mdSidenav('agentsNav')
          .toggle();
    };

    $scope.closeSidenav = function () {
        $mdSidenav('agentsNav')
            .close();
    };

    $scope.agentsGet = function (body) {
        if ($scope.blocked) {
            return null;
        }
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
        if (body['search'] === '') {
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

    //New functions

    $scope.agentsObj = {
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
        $scope._agent = agent;
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
        alertify.delay(5000).closeLogOnClick(true).log('Restarting agent...');
        DataFactory.getAndClean('put', '/agents/'+agent.id+'/restart', {})
        .then(function(data) {
            alertify.delay(10000).closeLogOnClick(true).success('Agent restarted successfully');
        }, printError);
    };

    $scope.delete = function (agent) {
        alertify.confirm("Are you sure you want to delete the agent with ID " + agent.id + "?", function () {
            DataFactory.getAndClean('delete', '/agents/'+agent.id, {})
            .then(function (data) {
                alertify.delay(10000).closeLogOnClick(true).success('Agent deleted successfully');
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
            alertify.delay(10000).closeLogOnClick(true).success('Key copied successfully');
        } catch (err) {
            alertify.delay(10000).closeLogOnClick(true).error('Error: Copy button in this browser is not supported. Please, press Ctrl+C to copy');
        }
    };

    $scope.runSyscheck = function (agent) {
        alertify.delay(5000).closeLogOnClick(true).log('Restarting syscheck and rootcheck...');
        DataFactory.getAndClean('put', '/syscheck/'+agent.id, {})
        .then(function (data) {
            alertify.delay(10000).closeLogOnClick(true).success('Syscheck and rootcheck restarted successfully');
        }, printError);
    };
    
    $scope.deleteSyscheck = function (agent) {
        alertify.confirm("Are you sure you want to clear FIM database in agent with ID " + agent.id + "?", function () {
            DataFactory.getAndClean('delete', '/syscheck/'+agent.id, {})
            .then(function (data) {
                alertify.delay(10000).closeLogOnClick(true).success('Syscheck database deleted successfully');
            }, printError);
        });
    };

    $scope.deleteRootcheck = function (agent) {
        alertify.confirm("Are you sure you want to clear Rootcheck database in agent with ID " + agent.id + "?", function () {
            DataFactory.getAndClean('delete', '/rootcheck/'+agent.id, {})
            .then(function (data) {
                alertify.delay(10000).closeLogOnClick(true).success('Rootcheck database deleted successfully');
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
                alertify.delay(10000).closeLogOnClick(true).success('Agent added successfully');
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

    $scope.agentStatusFilter = function (status) {
        if ($scope.statusFilter === status) {
            $scope.statusFilter = '';
            if ($scope.searchQuery != '') {
                $scope.agentsGet({'sort': $scope.searchQuery});
            } else {
                $scope.agentsGet({});
            }
        } else {
            $scope.statusFilter = status;
            if ($scope.searchQuery != '') {
                $scope.agentsGet({ 'sort': $scope.searchQuery, 'status': status });
            } else {
                $scope.agentsGet({ 'status': status });
            }
        }
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

    //Load
    DataFactory.initialize('get', '/agents', {}, 20, 0)
        .then(function (data) {
            objectsArray['/agents'] = data;
            DataFactory.get(data).then(function (data) {
                $scope.agents = data.data.items;
                $scope.load = false;
            }, printError);
        }, printError);

    //Destroy
    $scope.$on("$destroy", function () {
        angular.forEach(objectsArray, function (value) {
            DataFactory.clean(value)});
        tabProvider.clean($scope.pageId);
    });

});

