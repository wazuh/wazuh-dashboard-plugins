// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('pmController', function ($scope, DataFactory, $mdToast, errlog) {
    //Initialisation
    $scope.load = true;
    var objectsArray = [];
    var loadWatch;

    $scope.events = [];

    //Print Error
    var printError = function (error) {
        $mdToast.show({
            template: '<md-toast>' + error.html + '</md-toast>',
            position: 'bottom left',
            hideDelay: 5000,
        });
        if ($scope._eblocked) {
            $scope._eblocked = false;
        }
    }

    //Functions
	
	$scope.setTimer = function (time) {
        $scope.timerFilterValue = time;
    };
	
	
    $scope.setSort = function (field) {
        if ($scope._sort === field) {
            if ($scope._sortOrder) {
                $scope._sortOrder = false;
                $scope._sort = '';
                DataFactory.filters.unset(objectsArray['/rootcheck'], 'filter-sort');
            } else {
                $scope._sortOrder = true;
                DataFactory.filters.set(objectsArray['/rootcheck'], 'filter-sort', field);
            }
        } else {
            $scope._sortOrder = false;
            $scope._sort = field;
            DataFactory.filters.set(objectsArray['/rootcheck'], 'filter-sort', '-' + field);
        }
    }

    $scope.eventSearchFilter = function (search) {
        if (search) {
            DataFactory.filters.set(objectsArray['/rootcheck'], 'search', search);
        } else {
            DataFactory.filters.unset(objectsArray['/rootcheck'], 'search');
        }
    };

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
            } else if ((_pos > 150) || (_pos < 0)) {
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
                            $scope.events.length = 0;
                            $scope.events = data.data.items;
                            DataFactory.filters.register(objectsArray['/rootcheck'], 'search', 'string');
                            DataFactory.filters.register(objectsArray['/rootcheck'], 'filter-sort', 'string');
                            $scope._sort = '';
                            $scope.eventSearchFilter($scope._eventSearch);
                        }, printError);
                }, printError);
        });
    };

    var load = function () {
        DataFactory.initialize('get', '/rootcheck/' + $scope.$parent._agent.id, {}, 200, 0)
            .then(function (data) {
                objectsArray['/rootcheck'] = data;
                DataFactory.get(objectsArray['/rootcheck'])
                    .then(function (data) {
                        $scope.events = data.data.items;
                        $scope.totalEvents = data.data.totalItems;
                        DataFactory.filters.register(objectsArray['/rootcheck'], 'search', 'string');
                        DataFactory.filters.register(objectsArray['/rootcheck'], 'filter-sort', 'string');
                        createWatch();
                        $scope.load = false;
                    }, printError);
            }, printError);
    };

    //Load
    try {
        load();
		$scope.setTimer($scope.$parent.timeFilter);
    } catch (e) {
        $mdToast.show({
            template: '<md-toast> Unexpected exception loading controller </md-toast>',
            position: 'bottom left',
            hideDelay: 5000,
        });
        errlog.log('Unexpected exception loading controller', e);
    }

	// Timer filter watch
    var loadWatch2 = $scope.$watch(function () {
        return $scope.$parent.timeFilter;
    }, function () {
        $scope.setTimer($scope.$parent.timeFilter);
    });
	
    //Destroy
    $scope.$on("$destroy", function () {
        angular.forEach(objectsArray, function (value) {
            DataFactory.clean(value)
        });
        $scope.events.length = 0;
        loadWatch();
		loadWatch2();
    });

})
