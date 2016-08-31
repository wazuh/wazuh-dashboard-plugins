// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('pmController', function ($scope, alertify, sharedProperties, DataFactory, $location, $mdDialog) {
    //Initialisation
    $scope.load = true;
    var objectsArray = [];
	var loadWatch;
	
    $scope.events = [];
    $scope.agents = [];
    $scope.rootcheckSearch = '';

    $scope.menuNavItem = 'policy_monitoring';
    //Print Error
    var printError = function (error) {
        alertify.delay(10000).closeLogOnClick(true).error(error.html);
        if ($scope._eblocked) {
            $scope._eblocked = false;
        }
        if ($scope.blocked) {
            $scope.blocked = false;
        }
    }

    //Functions

    $scope.eventsObj = {
        //Obj with methods for virtual scrolling
        getItemAtIndex: function (index) {
            if ($scope._eblocked) {
                return null;
            }
            var _pos = index - DataFactory.getOffset(objectsArray['/rootcheck']);
            if (DataFactory.filters.flag(objectsArray['/rootcheck'])) {
                $scope._eblocked = true;
                DataFactory.scrollTo(objectsArray['/rootcheck'], 200)
                    .then(function (data) {
                        $scope.events.length = 0;
                        $scope.events = data.data.items;
                        DataFactory.filters.unflag(objectsArray['/rootcheck']);
                        $scope._eblocked = false;
                    }, printError);
            } else if ((_pos > 50) || (_pos < 0)) {
                $scope._eblocked = true;
                DataFactory.scrollTo(objectsArray['/rootcheck'], index)
                    .then(function (data) {
                        $scope.events.length = 0;
                        $scope.events = data.data.items;
                        $scope._eblocked = false;
                    }, printError);
            } else {
                return $scope.events[_pos];
            }
        },
        getLength: function () {
            return DataFactory.getTotalItems(objectsArray['/rootcheck']);
        },
    };

    $scope.setStatusFilter = function (status) {
        if ($scope.statusFilter == status) {
            $scope.statusFilter = 'all';
        } else {
            $scope.statusFilter = status;
        }

        $scope.getEvents({ 'status': $scope.statusFilter });
    };


    $scope.getEvents = function (body) {
        $scope._eblocked = true;
        if (!body) {
            var tmpBody = DataFactory.getBody(objectsArray['/rootcheck']);
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
            DataFactory.get(objectsArray['/rootcheck'])
                .then(function (data) {
                    $scope.events.length = 0;
                    $scope.events = data.data.items;
                    $scope._eblocked = false;
                }, printError);
        } else {
            DataFactory.get(objectsArray['/rootcheck'], body)
                .then(function (data) {
                    $scope.events.length = 0;
                    $scope.events = data.data.items;
                    $scope._eblocked = false;
                }, printError);
        }
    };


    $scope.hasPrevEvents = function () {
        return DataFactory.hasPrev(objectsArray['/rootcheck']);
    };
    $scope.prevEvents = function () {
        DataFactory.prev(objectsArray['/rootcheck'])
            .then(function (data) {
                $scope.events.length = 0;
                $scope.events = data.data.items;
            }, printError);
    };

    $scope.hasNextEvents = function () {
        return DataFactory.hasNext(objectsArray['/rootcheck']);
    };
    $scope.nextEvents = function () {
        DataFactory.next(objectsArray['/rootcheck'])
            .then(function (data) {
                $scope.events.length = 0;
                $scope.events = data.data.items;
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

    $scope.showFiltersDialog = function (ev) {
        $mdDialog.show({
            contentElement: '#filtersAgentsDialog',
            parent: angular.element(document.body),
            targetEvent: ev,
            clickOutsideToClose: true
        });
    };

	$scope.rootcheckSearchFilter = function (search) {
        if (search) {
            DataFactory.filters.set(objectsArray['/rootcheck'], 'search', search);
        } else {
            DataFactory.filters.unset(objectsArray['/rootcheck'], 'search');
        }
    };
	
	var createWatch = function () {
        loadWatch = $scope.$watch(function () {
            return $scope.$parent._agent;
        }, function () {
		DataFactory.initialize('get', '/rootcheck/' + $scope.$parent._agent.id, {}, 200, 0)
			.then(function (data) {
				DataFactory.clean(objectsArray['/rootcheck']);
				objectsArray['/rootcheck'] = data;
				DataFactory.get(objectsArray['/rootcheck'])
				.then(function (data) {
					$scope.events = data.data.items;
				}, printError);
			}, printError);
        });
    };
	
    var load = function () {
		$scope._agent = $scope.$parent._agent;
		$scope.eventFilter = '';
		$scope.typeFilter = '';
		DataFactory.initialize('get', '/rootcheck/' + $scope.$parent._agent.id, {}, 200, 0)
			.then(function (data) {
				objectsArray['/rootcheck'] = data;
				DataFactory.get(objectsArray['/rootcheck'])
				.then(function (data) {
					$scope.events = data.data.items;
					DataFactory.filters.register(objectsArray['/rootcheck'], 'search', 'string');
					$scope.rootcheckSearchFilter($scope._rootcheckSearch);
					createWatch();
					$scope.load = false;
				}, printError);
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
        loadWatch();
    });

})
