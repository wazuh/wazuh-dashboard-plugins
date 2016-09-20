// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('generalController', function ($scope, $q, DataFactory, $mdToast, appState, errlog) {
    //Initialisation
    $scope.load = true;
    $scope.search = '';
    $scope.menuNavItem = 'agents';
    $scope.submenuNavItem = '';
    $scope.state = appState;

    var objectsArray = [];

    //Print Error
    var printError = function (error) {
        $mdToast.show({
            template: '<md-toast>' + error.html + '</md-toast>',
            position: 'bottom left',
            hideDelay: 5000,
        });
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

    $scope.applyAgent = function (agent) {
        if (agent) {
            $scope.submenuNavItem = 'overview';
            $scope._agent = agent;
            $scope.search = agent.name;
        }
    };

    $scope.getDiscoverByAgent = function (agent) {
        var _urlStr = '/app/kibana#/discover?_g=(refreshInterval:(display:Off,pause:!f,value:0),time:(from:now-7d,mode:quick,to:now))&_a=(columns:!(_source),filters:!((\'$state\':(store:appState),meta:(alias:!n,disabled:!f,index:\'ossec-*\',key:AgentName,negate:!f,value:\'';
        var _urlStrSf = '\'),query:(match:(AgentName:(query:\'';
        var _urlStrSSf = '\',type:phrase))))),index:\'ossec-*\',interval:auto,query:(query_string:(analyze_wildcard:!t,query:\'*\')),sort:!(\'@timestamp\',desc),vis:(aggs:!((params:(field:AgentName,orderBy:\'2\',size:20),schema:segment,type:terms),(id:\'2\',schema:metric,type:count)),type:histogram))&indexPattern=ossec-*&type=histogram';

        return _urlStr + agent.name + _urlStrSf + agent.name + _urlStrSSf;
    }


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
            DataFactory.clean(value)
        });
    });

});

app.controller('stateController', function ($scope, appState) {
    $scope.state = appState;
});