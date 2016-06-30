// Require utils
var kuf = require('plugins/wazuh/utils/kibanaUrlFormatter.js');
// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('agentsController', function ($scope, $route, $q, alertify, sharedProperties, $location, $sce, DataFactory, tabProvider) {
    //Initialisation
    $scope.load = true;
    $scope.agentFetchInfo = [];
    $scope.agents = [];

    $scope.pageId = (Math.random().toString(36).substring(3));
    tabProvider.register($scope.pageId);

    var objectsArray = [];

    //Print Error
    var printError = function (error) {
        alertify.delay(10000).closeLogOnClick(true).error(error.html);
    }

    //Tabs
    $scope.setTab = function (tab, group) {
        tabProvider.setTab($scope.pageId, tab, group);
    };

    $scope.isSetTab = function (tab, group) {
        return tabProvider.isSetTab($scope.pageId, tab, group);
    };

    //Functions
    $scope.agentsGet = function (body) {
        if (!body) {
            DataFactory.get(objectsArray['/agents'])
                .then(function (data) {
                    $scope.agents.length = 0;
                    $scope.agentFetchInfo.length = 0;
                    $scope.agents = data.data.items;
                }, printError);
        } else {
            DataFactory.get(objectsArray['/agents'], body)
                .then(function (data) {
                    $scope.agents.length = 0;
                    $scope.agentFetchInfo.length = 0;
                    $scope.agents = data.data.items;
                }, printError);
        }
    };

    $scope.agentsHasNext = function () {
        return DataFactory.hasNext(objectsArray['/agents']);
    };
    $scope.agentsNext = function () {
        DataFactory.next(objectsArray['/agents'])
        .then(function (data) {
            $scope.agents = data.data.items;
        }, printError);
    };

    $scope.agentsHasPrev = function () {
        return DataFactory.hasPrev(objectsArray['/agents']);
    };
    $scope.agentsPrev = function () {
        DataFactory.prev(objectsArray['/agents'])
        .then(function (data) {
            $scope.agents = data.data.items;
        }, printError);
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
                $scope.agentFetchInfo[agent.id] = data.data;
                if (agent.id != '000') {
                    DataFactory.getAndClean('get', '/agents/' + agent.id + '/key', {})
                        .then(function (data) {
                            $scope.agentFetchInfo[agent.id].key = data.data;
                        }, printError);
                }
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

    $scope.copyAgentKey = function (index) {
        var copyTextarea = document.querySelectorAll('.js-copytextarea')[index];
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
        sharedProperties.setProperty(agentId);
        $location.path('/rootcheck');
    };

    $scope.loadFIM = function (agentId) {
        sharedProperties.setProperty(agentId);
        $location.path('/FIM');
    };

    $scope.agentStatusFilter = function (status) {
        if ($scope.statusFilter === status) {
            $scope.statusFilter = '';
            $scope.agentsGet({});
        } else {
            $scope.statusFilter = status;
            $scope.agentsGet({ 'status': status });
        }
    };

    $scope.getAlertsUrl = function (agent, time, filters) {
        if (!time) {
            time = '-24h';
        }
        else if (time == '') {
            time = '-24h';
        }
        if (!filters) {
            filters = '';
            var kibanaFilter = 'AgentName:' + agent;
        } else if (filters == '') {
            var kibanaFilter = 'AgentName:' + agent;
        } else {
            var kibanaFilter = 'AgentName:' + agent + ' AND ' + filters;
        }
        var kibanaTime = 'from:now' + time + ',mode:quick,to:now';
        var rulesUrl = kuf.getAlerts('ossec-*', kibanaFilter, kibanaTime);
        return rulesUrl;
    }

    $scope.getDashboardUrl = function (agent, dashboard, time, filters) {
        if (!time) {
            time = '-24h';
        }
        else if (time == '') {
            time = '-24h';
        }
        if (!filters) {
            filters = '';
            var kibanaFilter = 'AgentName:' + agent;
        } else if (filters == '') {
            var kibanaFilter = 'AgentName:' + agent;
        } else {
            var kibanaFilter = 'AgentName:' + agent + ' AND ' + filters;
        }
        var kibanaTime = 'from:now' + time + ',mode:quick,to:now';
        var rulesUrl = kuf.getDashboard(dashboard, kibanaFilter, kibanaTime, true);
        return rulesUrl;
    }

    //Load
    DataFactory.initialize('get', '/agents', {}, 6, 0, '/agents/total')
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

