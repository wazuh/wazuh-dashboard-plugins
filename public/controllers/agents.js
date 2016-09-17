// Require config

var app = require('ui/modules').get('app/wazuh', []);



app.controller('agentsController', function ($scope, DataFactory, $mdToast) {

    //Initialisation

    $scope.load = true;
    $scope.agentInfo = [];
	$scope._agent = "";
	
    //$scope.$parent.state.setAgentsState('overview');
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
    $scope.getAgentStatusClass = function (agentStatus) {
        if (agentStatus == "active")
            return "green"
        else if (agentStatus == "disconnected")
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



    $scope.getDiscoverByAgent = function (agent) {

        var _urlStr = '/app/kibana#/discover?_g=(refreshInterval:(display:Off,pause:!f,value:0),time:(from:now-7d,mode:quick,to:now))&_a=(columns:!(_source),filters:!((\'$state\':(store:appState),meta:(alias:!n,disabled:!f,index:\'ossec-*\',key:AgentName,negate:!f,value:\'';
        var _urlStrSf = '\'),query:(match:(AgentName:(query:\'';
        var _urlStrSSf = '\',type:phrase))))),index:\'ossec-*\',interval:auto,query:(query_string:(analyze_wildcard:!t,query:\'*\')),sort:!(\'@timestamp\',desc),vis:(aggs:!((params:(field:AgentName,orderBy:\'2\',size:20),schema:segment,type:terms),(id:\'2\',schema:metric,type:count)),type:histogram))&indexPattern=ossec-*&type=histogram';
       
        return _urlStr + agent.name + _urlStrSf + agent.name + _urlStrSSf;

    }



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

    loadWatch = $scope.$watch(function () {
        return $scope.$parent._agent;
    }, function () {
        $scope.fetchAgent($scope.$parent._agent);

    });



    //Destroy

    $scope.$on("$destroy", function () {
        angular.forEach(objectsArray, function (value) {
            DataFactory.clean(value)
        });
        loadWatch();

    });



});



app.controller('agentsPreviewController', function ($scope, DataFactory, $mdToast, errlog) {

    //Initialisation
    $scope.load = true;
    $scope.agents = [];
    $scope._status = 'all';
	
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



    $scope.getAgentStatusClass = function (agentStatus) {
        if (agentStatus == "active")
            return "green"
        else if (agentStatus == "disconnected")
            return "red";
        else
            return "red";

    };



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

    }



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
