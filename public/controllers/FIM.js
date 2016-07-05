// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('fimController', function ($scope, alertify, sharedProperties, DataFactory) {
    //Initialisation
    $scope.load = true;
    var objectsArray = [];

    $scope.eventsFetchInfo = [];
    $scope.files = [];
    $scope.agents = [];
    $scope.search = '';

    $scope.agentId = '000';

    //Print Error
    var printError = function (error) {
        alertify.delay(10000).closeLogOnClick(true).error(error.html);
    }

    //Functions
    $scope.setTypeFilter = function (filter) {
        if ($scope.typeFilter != filter) {
            $scope.typeFilter = filter;
        } else {
            $scope.typeFilter = '';
        }
        _setFilter();
    };

    $scope.setEventFilter = function (filter) {
        if ($scope.eventFilter != filter) {
            $scope.eventFilter = filter;
        } else {
            $scope.eventFilter = '';
        }
        _setFilter();
    };

    var _setFilter = function () {
        var body = {};
        if ($scope.eventFilter !== '') {
            body['event'] = $scope.eventFilter;
        }
        if ($scope.typeFilter !== '') {
            body['filetype'] = $scope.typeFilter;
        }
        if (body != {}) {
            $scope.getFiles(body);
        } else {
            $scope.getFiles();
        }
    };

    $scope.isSetAgentFilter = function (id) {
        return ($scope.agentId === id);
    };

    $scope.setAgentFilter = function (id) {
        $scope.eventFilter = '';
        $scope.typeFilter = '';
        if (id == $scope.agentId) {
            $scope.agentId = '';
            DataFactory.initialize('get', '/syscheck/files', {}, 16, 0)
                .then(function (data) {
                    objectsArray['/syscheck/files'] = data;
                    $scope.getFiles();
                }, printError);

        } else {
            $scope.agentId = id;
            DataFactory.initialize('get', '/syscheck/' + id + '/files', {}, 16, 0)
                .then(function (data) {
                    objectsArray['/syscheck/files'] = data;
                    $scope.getFiles();
                }, printError);
        }
    };

    $scope.searchAgent = function () {
        if ($scope.searchFilesRules === '') {
            $scope.searchFilesRules = undefined;
        }
        DataFactory.get(objectsArray['/agents'], { search: $scope.searchFilesRules })
            .then(function (data) {
                $scope.agents.length = 0;
                $scope.agents = data.data.items;
            }, printError);
    };

    $scope.getFiles = function (body) {
        if (!body) {
            var tmpBody = DataFactory.getBody(objectsArray['/syscheck/files']);
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
            DataFactory.get(objectsArray['/syscheck/files'], {'summary': 'yes'})
                .then(function (data) {
                    $scope.files.length = 0;
                    $scope.eventsFetchInfo.length = 0;
                    $scope.files = data.data.items;
                }, printError);
        } else {
            body['summary'] = 'yes';
            DataFactory.get(objectsArray['/syscheck/files'], body)
                .then(function (data) {
                    $scope.files.length = 0;
                    $scope.eventsFetchInfo.length = 0;
                    $scope.files = data.data.items;
                }, printError);
        }
    };

    $scope.hasNextFiles = function () {
        return DataFactory.hasNext(objectsArray['/syscheck/files']);
    };
    $scope.nextFiles = function () {
        DataFactory.next(objectsArray['/syscheck/files'])
            .then(function (data) {
                $scope.files.length = 0;
                $scope.eventsFetchInfo.length = 0;
                $scope.files = data.data.items;
            }, printError);
    };

    $scope.hasPrevFiles = function () {
        return DataFactory.hasPrev(objectsArray['/syscheck/files']);
    };
    $scope.prevFiles = function () {
        DataFactory.prev(objectsArray['/syscheck/files'])
            .then(function (data) {
                $scope.files.length = 0;
                $scope.eventsFetchInfo.length = 0;
                $scope.files = data.data.items;
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
        alertify.confirm("Are you sure you want to delete the syscheck database in all the agents?", function () {
            DataFactory.getAndClean('delete', '/syscheck', {})
                .then(function (data) {
                    alertify.delay(10000).closeLogOnClick(true).success('Syscheck database deleted successfully.');
                }, printError);
        });
    };

    $scope.startfim = function () {
        alertify.confirm("Are you sure you want to start a scan on all the agents?", function () {
            DataFactory.getAndClean('put', '/syscheck', {})
                .then(function (data) {
                    alertify.delay(10000).closeLogOnClick(true).success('Syscheck started successfully.');
                }, printError);
        });
    };

    var load = function () {
        DataFactory.initialize('get', '/syscheck/000/files', {'summary': 'yes'}, 16, 0)
            .then(function (data) {
                objectsArray['/syscheck/files'] = data;
                DataFactory.initialize('get', '/agents', {}, 10, 0)
                    .then(function (data) {
                        objectsArray['/agents'] = data;
                        load_data();
                    }, printError);
            }, printError);
    };

    var load_data = function () {
        DataFactory.get(objectsArray['/syscheck/files'])
            .then(function (data) {
                $scope.files = data.data.items;
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
    });

});

