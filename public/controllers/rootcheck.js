// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('rcController', function ($scope, alertify, sharedProperties, DataFactory, $location) {
    //Initialisation
    $scope.load = true;
    var objectsArray = [];

    $scope.events = [];
    $scope.agents = [];
    $scope.search = '';

    $scope.agentId = '000';

    //Print Error
    var printError = function (error) {
        alertify.delay(10000).closeLogOnClick(true).error(error.html);
    }

    //Functions

    $scope.searchAgent = function () {
        if ($scope.searchAgents === '') {
            $scope.searchAgents = undefined;
        }
        DataFactory.get(objectsArray['/agents'], { search: $scope.searchAgents })
            .then(function (data) {
                $scope.agents.length = 0;
                $scope.agents = data.data.items;
            }, printError);
    };

    $scope.getAgents = function () {
        DataFactory.get(objectsArray['/agents'])
            .then(function (data) {
                $scope.agents.length = 0;
                $scope.agents = data.data.items;
            }, printError);
    };

    $scope.hasNextAgents = function () {
        return DataFactory.hasNext(objectsArray['/agents']);
    };
    $scope.nextAgents = function () {
        DataFactory.next(objectsArray['/agents'])
            .then(function (data) {
                $scope.agents.length = 0;
                $scope.agents = data.data.items;
            }, printError);
    };

    $scope.hasPrevAgents = function () {
        return DataFactory.hasPrev(objectsArray['/agents']);
    };
    $scope.prevAgents = function () {
        DataFactory.prev(objectsArray['/agents'])
            .then(function (data) {
                $scope.agents.length = 0;
                $scope.agents = data.data.items;
            }, printError);
    };

    $scope.cleandb = function () {
        alertify.confirm("Are you sure you want to delete the rootcheck database in all the agents?", function () {
            DataFactory.getAndClean('delete', '/rootcheck', {})
                .then(function (data) {
                    alertify.delay(10000).closeLogOnClick(true).success('Rootcheck database deleted successfully.');
                }, printError);
        });
    };

    $scope.startrc = function () {
        alertify.confirm("Are you sure you want to start a scan on all the agents?", function () {
            DataFactory.getAndClean('put', '/rootcheck', {})
                .then(function (data) {
                    alertify.delay(10000).closeLogOnClick(true).success('Rootcheck started successfully.');
                }, printError);
        });
    };

    var load = function () {
        var _agent = '000';
        var _init = sharedProperties.getProperty();
        if ((_init != '') && (_init.substring(0, 4) == 'rc//')) {
            _agent = _init.substring(4);
            sharedProperties.setProperty('');
            $scope.agentId = _agent;
        }

        DataFactory.initialize('get', '/rootcheck/'+_agent, {}, 16, 0)
            .then(function (data) {
                objectsArray['/rootcheck'] = data;
                DataFactory.initialize('get', '/agents', {}, 10, 0)
                    .then(function (data) {
                        objectsArray['/agents'] = data;
                        load_data();
                    }, printError);
            }, printError);
    };

    var load_data = function () {
        DataFactory.get(objectsArray['/rootcheck'])
            .then(function (data) {
                $scope.events = data.data.items;
                DataFactory.get(objectsArray['/agents'])
                    .then(function (data) {
                        $scope.agents = data.data.items;
                        $scope.load = false;
                    });
            }, printError);
    };

    //Load
    load();

    //Destroy
    $scope.$on("$destroy", function () {
        angular.forEach(objectsArray, function (value) {
            DataFactory.clean(value)
        });
        $scope.events.length = 0;
        $scope.agents.length = 0;
    });

})