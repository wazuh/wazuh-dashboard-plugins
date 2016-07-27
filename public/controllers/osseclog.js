// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('osseclogController', function ($scope, alertify, DataFactory, $sce, $interval) {
    //Initialisation
    $scope.load = true;
    $scope.text = [];
    $scope.summary = [];
    $scope.realtime = false;

    $scope.menuNavItem = 'manager';
    $scope.submenuNavItem = 'logs';

    $scope.filterString = 'Category: all > Type log: all';

    var objectsArray = [];

    var _fKey = '';
    var _fValue = '';
    var _promise;

    //Print Error
    var printError = function (error) {
        alertify.delay(10000).closeLogOnClick(true).error(error.html);
    }

    //Functions

    $scope.textObj = {
        //Obj with methods for virtual scrolling
        getItemAtIndex: function (index) {
            if ($scope.blocked) {
                return null;
            }
            var _pos = index - DataFactory.getOffset(objectsArray['/manager/logs']);
            if ((_pos > 125) || (_pos < 0)) {
                $scope.blocked = true;
                DataFactory.scrollTo(objectsArray['/manager/logs'], index)
                    .then(function (data) {
                        $scope.text.length = 0;
                        $scope.text = data.data.items;
                        $scope.blocked = false;
                    }, printError);
            } else {
                return $scope.text[_pos];
            }
        },
        getLength: function () {
            if ($scope.realtime) {
                return 120;
            }
            return DataFactory.getTotalItems(objectsArray['/manager/logs']);
        },
    };

    var loadSummary = function () {
        DataFactory.getAndClean('get', '/manager/logs/summary', {})
            .then(function (data) {
                $scope.summary = data.data;
                $scope.load = false;
            }, printError);
    };

    $scope.isSetFilter = function (key, value) {
        return ((key === _fKey) && (value === _fValue));
    };

    $scope.filter = function (key, value) {
        var body;
        if ((key === _fKey) && (value === _fValue)) {
            _fKey = _fValue = '';
            body = {};
        } else {
            _fKey = key;
            _fValue = value;
            body = {
                'category': _fKey,
                'type_log': _fValue
            }
        }
        $scope.filterString = 'Daemon: ' + _fKey + ' > Type log: ' + _fValue;
        DataFactory.get(objectsArray['/manager/logs'], body)
            .then(function (data) {
                $scope.text = data.data.items;
            }, printError);
    };

    $scope.hasNext = function () {
        return DataFactory.hasNext(objectsArray['/manager/logs']);
    };
    $scope.next = function () {
        DataFactory.next(objectsArray['/manager/logs'])
            .then(function (data) {
                $scope.text = data.data.items;
            }, printError);
    };

    $scope.hasPrev = function () {
        return DataFactory.hasPrev(objectsArray['/manager/logs']);
    };
    $scope.prev = function () {
        DataFactory.prev(objectsArray['/manager/logs'])
            .then(function (data) {
                $scope.text = data.data.items;
            }, printError);
    };

    $scope.colorLine = function (line) {
        if ((!line) || (line == null)) {
            return $sce.trustAsHtml('-');
        }
        line = line.replace('INFO', '<span style="color:#0066ff">INFO</span>');
        line = line.replace('ERROR', '<span style="color:#ff0000">ERROR</span>');
        line = line.replace('ossec-remoted', '<span style="color:#827e7d">ossec-remoted</span>');
        line = line.replace('ossec-testrule', '<span style="color:#827e7d">ossec-testrule</span>');
        line = line.replace('wazuh-moduled', '<span style="color:#827e7d">wazuh-moduled</span>');
        line = line.replace('ossec-monitord', '<span style="color:#827e7d">ossec-monitord</span>');
        line = line.replace('ossec-logcollector', '<span style="color:#827e7d">ossec-logcollector</span>');
        line = line.replace('ossec-execd', '<span style="color:#827e7d">ossec-execd</span>');
        line = line.replace('ossec-rootcheck', '<span style="color:#827e7d">ossec-rootcheck</span>');
        line = line.replace('rootcheck', '<span style="color:#827e7d">rootcheck</span>');
        line = line.replace('ossec-syscheckd', '<span style="color:#827e7d">ossec-syscheckd</span>');
        line = line.replace('ossec-analysisd', '<span style="color:#827e7d">ossec-analysisd</span>');
        line = line.replace('ossec-maild', '<span style="color:#827e7d">ossec-maild</span>');
        line = line.replace(line.substring(0, 19), '<b>'+line.substring(0, 19)+'</b>');
        return $sce.trustAsHtml(line);
    };

    $scope.playRealtime = function () {
        $scope.realtime = !$scope.realtime;
        if (!$scope.realtime) {
            $interval.cancel(_promise);
        } else {
            _promise = $interval(function () {
                var body;
                if ((_fKey != '') && (_fValue != '')) {
                    body = {
                        'category': _fKey,
                        'type_log': _fValue
                    }
                } else {
                    body = {};
                }
                DataFactory.get(objectsArray['/manager/logs'], body)
                    .then(function (data) {
                        $scope.text.length = 0;
                        $scope.text = data.data.items;
                    }, printError);
            }, 1000);
        }
    };

    //Load
    DataFactory.initialize('get', '/manager/logs', {}, 150, 0)
        .then(function (data) {
            objectsArray['/manager/logs'] = data;
            DataFactory.get(data).then(function (data) {
                $scope.text = data.data.items;
                loadSummary();
            }, printError);
        }, printError);


    //Destroy
    $scope.$on("$destroy", function () {
        $interval.cancel(_promise);
        angular.forEach(objectsArray, function (value) {
            DataFactory.clean(value)
        });
    });
});