// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('fimController', function ($scope, alertify, sharedProperties, DataFactory, $location, $mdDialog, $q) {
    //Initialisation
    $scope.load = true;
    var objectsArray = [];

    $scope.files = [];
    $scope.fileSearch = '';

    $scope.$parent.submenuNavItem = 'fim';

    //Print error
    var printError = function (error) {
        $mdToast.show({
            template: '<md-toast>' + error.html + '</md-toast>',
            position: 'bottom left',
            hideDelay: 5000,
        });
        if ($scope._files_blocked) {
            $scope._files_blocked = false;
        }
    };

    //Functions

    $scope.fileSearchFilter = function (search) {
        if (search) {
            DataFactory.filters.set(objectsArray['/files'], 'search', search);
        } else {
            DataFactory.filters.unset(objectsArray['/files'], 'search');
        }
    };

    $scope.fileEventFilter = function (event) {
        if (event == 'all') {
            DataFactory.filters.unset(objectsArray['/files'], 'event');
        } else {
            DataFactory.filters.unset(objectsArray['/files'], 'event', event);
        }
    };

    $scope.filesObj = {
        //Obj with methods for virtual scrolling
        getItemAtIndex: function (index) {
            if ($scope._files_blocked) {
                return null;
            }
            var _pos = index - DataFactory.getOffset(objectsArray['/files']);
            if ((_pos > 70) || (_pos < 0)) {
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

    var load = function () {
        DataFactory.initialize('get', '/syscheck/' + $scope.$parent._agent.id + '/files', {}, 100, 0)
            .then(function (data) {
                objectsArray['/files'] = data;
                DataFactory.get(objectsArray['/files'])
                    .then(function (data) {
                        $scope.files = data.data.items;
                        DataFactory.filters.register(objectsArray['/files'], 'search', 'string');
                        DataFactory.filters.register(objectsArray['/files'], 'event', 'string');
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
        $scope.files.length = 0;
        $scope.showFile.length = 0;
    });

});
