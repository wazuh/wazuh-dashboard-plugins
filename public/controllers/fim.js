// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('fimController', function ($scope, alertify, sharedProperties, DataFactory, $location, $mdDialog, $q) {
    //Initialisation
    $scope.load = true;
    var objectsArray = [];

    $scope.eventsFetchInfo = [];
    $scope.files = [];
    $scope.agents = [];
    $scope.search = '';
    $scope.menuNavItem = 'fim';
    $scope.submenuNavItem = 'overview';

	
    $scope.$parent.submenuNavItem = 'fim';
	
	

    //Print error
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
	



    $scope.setFileSelected = function (file) {
        DataFactory.filters.set(objectsArray['/files/events'], 'file', file.file);
    };
	
    $scope.filesObj = {
        //Obj with methods for virtual scrolling
        getItemAtIndex: function (index) {
            if ($scope._files_blocked) {
                return null;
            }
            var _pos = index - DataFactory.getOffset(objectsArray['/files']);
            if ((_pos > 30) || (_pos < 0)) {
                $scope._files_blocked = true;
                DataFactory.scrollTo(objectsArray['/files'], index)
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

            return DataFactory.getTotalItems(objectsArray['/files']);
        },
    };

    $scope.eventsObj = {
        //Obj with methods for virtual scrolling
        getItemAtIndex: function (index) {
            if ($scope._events_blocked) {
                return null;
            }
            var _pos = index - DataFactory.getOffset(objectsArray[$scope.$parent._agent.id + $scope._file.file]);
            if ((_pos > 30) || (_pos < 0)) {
                $scope._events_blocked = true;
                DataFactory.scrollTo(objectsArray[$scope.$parent._agent.id + $scope._file.file], index)
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
            return DataFactory.getTotalItems(objectsArray[$scope.$parent._agent.id + $scope._file.file]);
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
	
    $scope.unsetFile = function () {
      $scope._file = "";
    }

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


    var load = function () {
        DataFactory.initialize('get', '/syscheck/' + $scope.$parent._agent.id + '/files', { 'summary': 'no' }, 30, 0)
            .then(function (data) {
                objectsArray['/files'] = data;

				DataFactory.get(objectsArray['/files'])
				.then(function (data) {
					console.log(data);
					$scope.files = data.data.items;
					$scope.load = true;
					console.log(DataFactory.get(objectsArray['/files']));
					console.log(DataFactory.getTotalItems(objectsArray['/files']));					
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
        $scope._eventSelected.length = 0;
    });

});
