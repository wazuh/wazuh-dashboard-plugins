// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('fimController', function ($scope, alertify, sharedProperties, DataFactory, $location, $mdDialog) {
    //Initialisation
    $scope.load = true;
    var objectsArray = [];

    $scope.eventsFetchInfo = [];
    $scope.files = [];
    $scope.agents = [];
    $scope.search = '';
    $scope.menuNavItem = 'fim';
    $scope.submenuNavItem = 'overview';

    //Print Error
    var printError = function (error) {
        alertify.delay(10000).closeLogOnClick(true).error(error.html);
        if ($scope.blocked) {
            $scope.blocked = false;
        }
        if ($scope._files_blocked) {
            $scope._files_blocked = false;
        }
        if ($scope._events_blocked) {
            $scope._events_blocked = false;
        }
    }

    //Functions
    $scope.agentsObj = {
        //Obj with methods for virtual scrolling
        getItemAtIndex: function (index) {
            if ($scope.blocked) {
                return null;
            }
            var _pos = index - DataFactory.getOffset(objectsArray['/agents']);
            if ((_pos > 25) || (_pos < 0)) {
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

    $scope.filesObj = {
        //Obj with methods for virtual scrolling
        getItemAtIndex: function (index) {
            if ($scope._files_blocked) {
                return null;
            }
            var _pos = index - DataFactory.getOffset(objectsArray['/syscheck/files']);
            if ((_pos > 30) || (_pos < 0)) {
                $scope._files_blocked = true;
                DataFactory.scrollTo(objectsArray['/syscheck/files'], index)
                    .then(function (data) {
                        $scope.files.length = 0;
                        $scope.files = data.data.items;
                        $scope._files_blocked = false;
                    }, printError);
            } else {
                return $scope.files[_pos];
            }
        },
        getLength: function () {
            return DataFactory.getTotalItems(objectsArray['/syscheck/files']);
        },
    };

    $scope.eventsObj = {
        //Obj with methods for virtual scrolling
        getItemAtIndex: function (index) {
            if ($scope._events_blocked) {
                return null;
            }
            var _pos = index - DataFactory.getOffset(objectsArray[$scope._agent.id + $scope._file.file]);
            if ((_pos > 30) || (_pos < 0)) {
                $scope._events_blocked = true;
                DataFactory.scrollTo(objectsArray[$scope._agent.id + $scope._file.file], index)
                    .then(function (data) {
                        $scope.eventsFetchInfo.length = 0;
                        $scope.eventsFetchInfo = data.data.items;
                        $scope._events_blocked = false;
                    }, printError);
            } else {
                return $scope.eventsFetchInfo[_pos];
            }
        },
        getLength: function () {
            return DataFactory.getTotalItems(objectsArray[$scope._agent.id + $scope._file.file]);
        },
    };

    $scope.getColorClass = function (event) {
        switch (event) {
            case 'added':
            case 'readded':
                return 'status green';
            case 'modified':
                return 'status orange';
            case 'deleted':
                return 'status red';
            default:
                return '';
        }
    };

    $scope.searchHash = function (hash) {
        if ($scope.search === hash) {
            $scope.search = '';
        } else {
            $scope.search = hash;
        }
        $scope.getFiles();
    };

    $scope.printEventInfo = function (event) {
        var _template = '<div style="width: auto; height: auto; overflow: hidden;"><ul class="popup-ul">';
        _template += '<li><b>File:</b> '+ event.file +'</li>';
        _template += '<li><b>Modification date:</b> '+ event.modificationDate +'</li>';
        _template += '<li><b>Scan date:</b> ' + event.scanDate + '</li>';
        _template += '<li><b>Event:</b> '+ event.event +'</li>';
        _template += '<li><b>MD5:</b> '+ event.md5 +'</li>';
        _template += '<li><b>SHA1:</b> '+ event.sha1 +'</li>';
        _template += '<li><b>Size:</b> '+ event.size +' bytes</li>';
        _template += '<li><b>Permissions:</b> '+ event.octalMode +' ('+ event.permissions +')</li>';
        _template += '<li><b>User:</b> '+ event.user +' (Id: '+ event.uid +')</li>';
        _template += '<li><b>Group ID:</b> '+ event.group +' (Id: '+ event.gid +')</li>';
        _template += '<li><b>Inode:</b> ' + event.inode + '</li>';
        _template += '</ul></div>'
        alertify.alert(_template);
    };

    $scope.loadDiscover = function (file) {
        var _filter = 'SyscheckFile.path:"'+file+'"';
        sharedProperties.setProperty('aa//'+_filter);
        $location.path('/discover');
    };

    $scope.loadDashboard = function (file) {
        var _filter = 'SyscheckFile.path:"' + file+'"';
        sharedProperties.setProperty('ad//' + _filter);
        $location.path('/fim/dashboard');
    };

    $scope.initEvents = function (agent, file) {


        console.log("heeey" + agent + file);
        var body = { 'file' : file.file };
        var tmpBody = DataFactory.getBody(objectsArray['/syscheck/files']);
        if (tmpBody && (tmpBody != { 'summary ': 'yes'})) {
            angular.forEach(tmpBody, function (value, key) {
                if (key !== 'summary')
                body[key] = value;
            });
        }
        DataFactory.initialize('get', '/syscheck/'+agent.id+'/files', body, 30, 0)
            .then(function (data) {
                objectsArray[agent.id+file.file] = data;
                DataFactory.get(objectsArray[agent.id+file.file])
                    .then(function (data) {
                        $scope.eventsFetchInfo.length = 0;
                        $scope.eventsFetchInfo = data.data.items;
                        $scope._file = file;
                    }, printError)
            }, printError);
    };
    $scope.unsetFile = function () {
      $scope._file = "";
    }
    $scope.getEvents = function (agent, file) {
        $scope._events_blocked = true;
        DataFactory.get(objectsArray[agent + file])
            .then(function (data) {
                $scope.eventsFetchInfo[agent + file].length = 0;
                $scope.eventsFetchInfo[agent + file] = data.data.items;
                $scope._events_blocked = false;
            }, printError)
    };



    $scope.setTypeFilter = function () {
        _setFilter();
    };

    $scope.setEventFilter = function (filter) {
        _setFilter();
    };

    var _setFilter = function () {
        var body = {};
        if (($scope.eventFilter !== '') && ($scope.eventFilter != 'all')) {
            body['event'] = $scope.eventFilter;
        }
        if (($scope.typeFilter !== '') && ($scope.typeFilter != 'all')) {
            body['filetype'] = $scope.typeFilter;
        }
        if (body != {}) {
            $scope.getFiles(body);
        } else {
            $scope.getFiles();
        }
    };

    $scope.getAgentStatusClass = function (agentStatus) {
        if (agentStatus == "Active")
            return "green"
        else if (agentStatus == "Disconnected")
            return "red";
        else
            return "red";
    };

    $scope.setAgentFilter = function (agent) {
        if (agent != $scope._agent) {
            $scope._agent = agent;
            $scope.eventFilter = '';
            $scope.typeFilter = '';
            DataFactory.initialize('get', '/syscheck/' + agent.id + '/files', {}, 20, 0)
                .then(function (data) {
                    objectsArray['/syscheck/files'] = data;
                    $scope.getFiles();
                }, printError);
        }
    };

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

    $scope.getFiles = function (body) {
        $scope._files_blocked = true;
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
                    $scope._files_blocked = false;
                }, printError);
        } else {
            body['summary'] = 'yes';
            DataFactory.get(objectsArray['/syscheck/files'], body)
                .then(function (data) {
                    $scope.files.length = 0;
                    $scope.eventsFetchInfo.length = 0;
                    $scope.files = data.data.items;
                    $scope._files_blocked = false;
                }, printError);
        }
    };


    $scope.agentStatusFilter = function () {
        var _status;
        if ($scope.statusFilter === 'all') {
            _status = undefined;
        } else {
            _status = $scope.statusFilter;
        }
        $scope.getAgents({ 'sort': $scope.searchQuery, 'status': _status });
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
            $scope.getAgents({ 'sort': $scope.searchQuery, 'status': $scope.statusFilter });
        } else {
            $scope.getAgents({ 'sort': $scope.searchQuery });
        }
    };
    $scope.getAgents = function (body) {
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

    $scope.showFilesFiltersDialog = function (ev) {
        $mdDialog.show({
            contentElement: '#filtersFilesDialog',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: true
        });
    };

    $scope.showAgentsFiltersDialog = function (ev) {
        $mdDialog.show({
            contentElement: '#filtersAgentsDialog',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: true
        });
    };

    var load = function () {
        var _agent = '000';
        var _init = sharedProperties.getProperty();
        if ((_init != '') && (_init.substring(0, 5) == 'fim//')) {
            _agent = _init.substring(5);
            sharedProperties.setProperty('');
            $scope.agentId = _agent;
        }

        DataFactory.initialize('get', '/syscheck/'+_agent+'/files', {'summary': 'yes'}, 30, 0)
            .then(function (data) {
                objectsArray['/syscheck/files'] = data;
                DataFactory.initialize('get', '/agents', {}, 30, 0)
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
                        $scope._agent = data.data.items[0];
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
        $scope.files.length = 0;
        $scope.eventsFetchInfo.length = 0;
        $scope.agents.length = 0;
    });

});
