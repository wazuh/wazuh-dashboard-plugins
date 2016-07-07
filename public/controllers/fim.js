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
    $scope.printEventInfo = function (event) {
        var _template = '<div style="width: auto; height: auto; overflow: hidden;"><ul class="popup-ul">';
        _template += '<li><b>File:</b> '+event.file+'</li>';
        _template += '<li><b>Date:</b> '+event.date+'</li>';
        _template += '<li><b>Event:</b> '+event.event+'</li>';
        _template += '<li><b>MD5:</b> '+event.md5+'</li>';
        _template += '<li><b>SHA1:</b> '+event.sha1+'</li>';
        _template += '<li><b>Size:</b> '+event.size+' bytes</li>';
        _template += '<li><b>Permissions:</b> '+event.perm+'</li>';
        _template += '<li><b>User ID:</b> '+event.uid+'</li>';
        _template += '<li><b>Group ID:</b> '+event.gid+'</li>';
        _template += '</ul></div>'
        alertify.okBtn("Close").alert(_template);
    };

    $scope.initEvents = function (agent, file) {
        var body = { 'file' : file };
        var tmpBody = DataFactory.getBody(objectsArray['/syscheck/files']);
        if (tmpBody && (tmpBody != { 'summary ': 'yes'})) {
            angular.forEach(tmpBody, function (value, key) {
                if (key !== 'summary')
                body[key] = value;
            });
        }
        DataFactory.initialize('get', '/syscheck/'+agent+'/files', body, 10, 0)
            .then(function (data) {
                objectsArray[agent+file] = data;
                DataFactory.get(objectsArray[agent+file])
                    .then(function (data) {
                        $scope.eventsFetchInfo[agent + file].length = 0;
                        $scope.eventsFetchInfo[agent + file] = data.data.items;
                    }, printError)
            }, printError);
    };

    $scope.getEvents = function (agent, file) {
        DataFactory.get(objectsArray[agent + file])
            .then(function (data) {
                $scope.eventsFetchInfo[agent + file].length = 0;
                $scope.eventsFetchInfo[agent + file] = data.data.items;
            }, printError)
    };

    $scope.hasNextEvents = function (agent, file) {
        if (!objectsArray[agent + file])
            return false;
        return DataFactory.hasNext(objectsArray[agent + file]);
    };
    $scope.nextEvents = function (agent, file) {
        DataFactory.next(objectsArray[agent + file])
            .then(function (data) {
                $scope.eventsFetchInfo[agent + file].length = 0;
                $scope.eventsFetchInfo[agent + file] = data.data.items;
            }, printError)
    };

    $scope.hasPrevEvents = function (agent, file) {
        if (!objectsArray[agent + file])
            return false;
        return DataFactory.hasPrev(objectsArray[agent + file]);
    };
    $scope.prevEvents = function (agent, file) {
        DataFactory.prev(objectsArray[agent + file])
            .then(function (data) {
                $scope.eventsFetchInfo[agent + file].length = 0;
                $scope.eventsFetchInfo[agent + file] = data.data.items;
            }, printError)
    };

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
        if (id != $scope.agentId) {
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
        $scope.eventsFetchInfo.length = 0;
    });

});

