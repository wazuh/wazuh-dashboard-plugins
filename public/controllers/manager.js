// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('managerController', function ($scope, DataFactory, genericReq, $mdDialog, $mdToast, errlog) {
    //Initialization
    $scope.load = true;
    $scope.$parent.state.setManagerState('status');
    $scope.defaultManager = $scope.$parent.state.getDefaultManager().name;
    $scope.timeFilter = "24h";

    $scope.stats = [];
    $scope.stats['/top/agent'] = '-';
    $scope.stats['/overview/alerts'] = { "alerts": 0, "ip": "-", "group": "-" };
    $scope.stats['/overview/fim'] = { "alerts": 0, "agent": "-", "file": "-" };

    //Print Error
    var printError = function (error) {
        $mdToast.show({
            template: '<md-toast>' + error.html + '</md-toast>',
            position: 'bottom left',
            hideDelay: 5000,
        });
    };

    //Functions
    $scope.getDaemonStatusClass = function (daemonStatus) {
        if (daemonStatus == "running")
            return "status green"
        else if (daemonStatus == "stopped")
            return "status red";
        else
            return "status red";
    };


    var load = function () {
        DataFactory.getAndClean('get', '/agents/summary', {})
            .then(function (data) {
                $scope.agentsCountActive = data.data.Active;
                $scope.agentsCountDisconnected = data.data.Disconnected;
                $scope.agentsCountNeverConnected = data.data['Never connected'];
                $scope.agentsCountTotal = data.data.Total;
                $scope.agentsCoverity = (data.data.Active / data.data.Total) * 100;
            }, printError);
        DataFactory.getAndClean('get', '/manager/status', {})
            .then(function (data) {
                $scope.daemons = data.data;
            }, printError);
        DataFactory.getAndClean('get', '/manager/info', {})
            .then(function (data) {
                $scope.managerInfo = data.data;
                DataFactory.getAndClean('get', '/rules', { offset: 0, limit: 1 })
                    .then(function (data) {
                        $scope.totalRules = data.data.totalItems;
                        DataFactory.getAndClean('get', '/decoders', { offset: 0, limit: 1 })
                            .then(function (data) {
                                $scope.totalDecoders = data.data.totalItems;
                                $scope.load = false;
                            }, printError);
                    }, printError);
            }, printError);
        DataFactory.getAndClean('get', '/agents', { offset: 0, limit: 1, sort: '-id' })
            .then(function (data) {
                DataFactory.getAndClean('get', '/agents/' + data.data.items[0].id, {})
                    .then(function (data) {
                        $scope.agentInfo = data.data;
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

    // Timer filter watch
    var loadWatch = $scope.$watch(function () {
        return $scope.$parent.timeFilter;
    }, function () {
        $scope.setTimer($scope.$parent.timeFilter);
        load_tops();
    });


    //Destroy
    $scope.$on("$destroy", function () {
        $scope.stats.length = 0;
        loadWatch();
    });

});

app.controller('managerConfigurationController', function ($scope, DataFactory, errlog) {
    //Initialization
    $scope.load = true;
    $scope.$parent.state.setManagerState('configuration');

    //Print Error
    var printError = function (error) {
        $mdToast.show({
            template: '<md-toast>' + error.html + '</md-toast>',
            position: 'bottom left',
            hideDelay: 5000,
        });
    };

    //Functions
    var parseConfiguration = function () {
        if ($scope.managerConfiguration.rules.decoder) {
            if (angular.isString($scope.managerConfiguration.rules.decoder)) { $scope.managerConfiguration.rules.decoder = [$scope.managerConfiguration.rules.decoder] }
        }
        if ($scope.managerConfiguration.rules.rule_dir) {
            if (angular.isString($scope.managerConfiguration.rules.rule_dir)) { $scope.managerConfiguration.rules.rule_dir = [$scope.managerConfiguration.rules.rule_dir] }
        }
        if ($scope.managerConfiguration.rules.list) {
            if (angular.isString($scope.managerConfiguration.rules.list)) { $scope.managerConfiguration.rules.list = [$scope.managerConfiguration.rules.list] }
        }
        if ($scope.managerConfiguration.rootcheck.system_audit) {
            if (angular.isString($scope.managerConfiguration.rootcheck.system_audit)) { $scope.managerConfiguration.rootcheck.system_audit = [$scope.managerConfiguration.rootcheck.system_audit] }
        }
    };

    var load = function () {
        DataFactory.getAndClean('get', '/manager/status', {})
            .then(function (data) {
                $scope.daemons = data.data;
                DataFactory.getAndClean('get', '/manager/configuration', {})
                    .then(function (data) {
                        $scope.managerConfiguration = data.data;
                        parseConfiguration();
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
        $scope.managerConfiguration.length = 0;
    });

});