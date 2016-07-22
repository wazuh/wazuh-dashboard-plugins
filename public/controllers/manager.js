// Require utils
var kuf = require('plugins/wazuh/utils/kibanaUrlFormatter.js');
// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('managerController', function ($scope, $route, $q, alertify, sharedProperties, $location, $sce, DataFactory, tabProvider, $filter) {
    //Initialisation
    $scope.load = true;
    $scope.menuNavItem = 'manager';
    $scope.submenuNavItem = 'general';

    $scope.pageId = (Math.random().toString(36).substring(3));
    tabProvider.register($scope.pageId);

    var objectsArray = [];

    //Print Error
    var printError = function (error) {
        alertify.delay(10000).closeLogOnClick(true).error(error.html);
    }

    //Tabs
    $scope.setTab = function (tab, group) {
        tabProvider.setTab($scope.pageId, tab, group);
    };

    $scope.isSetTab = function (tab, group) {
        return tabProvider.isSetTab($scope.pageId, tab, group);
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

    $scope.start = function () {
        alertify.delay(10000).closeLogOnClick(true).log('Starting manager');
        DataFactory.getAndClean('put', '/manager/start', {})
            .then(function (data) {
                load();
                alertify.delay(10000).closeLogOnClick(true).success('Manager started successfully');
            }, printError);
    };

    $scope.stop = function () {
        alertify.confirm("Are you sure you want to stop the manager? You will not receive OSSEC alerts while the manager remains stopped.", function () {
            alertify.delay(10000).closeLogOnClick(true).log('Stopping manager...');
            DataFactory.getAndClean('put', '/manager/stop', {})
                .then(function (data) {
                    load();
                    alertify.delay(10000).closeLogOnClick(true).success('Manager stopped successfully');
                }, printError);
        });
    };

    $scope.restart = function () {
        alertify.confirm("Are you sure you want to restart the manager?", function () {
            alertify.delay(10000).closeLogOnClick(true).log('Restarting manager...');
            DataFactory.getAndClean('put', '/manager/restart', {})
                .then(function (data) {
                    load();
                    alertify.delay(10000).closeLogOnClick(true).success('Manager restarted successfully');
                }, printError);
        });
    };

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

    $scope.ruleDetail = function (file, isRule) {
        if (isRule) {
            sharedProperties.setProperty('r//' + file);
        } else {
            sharedProperties.setProperty('d//' + file);
        }
        $location.path('/ruleset');
    };

    $scope.agentsRedirect = function () {
        $location.path('/agents');
    };

    $scope.getDaemonTooltip = function (daemon) {
        var output = '';
        switch (daemon) {
            case 'ossec-monitord':
                output = '<span style="width: 200px; display: inline-block; text-align: left;">Monitors agent connectivity and compress daily log files.</span>';
                break;
            case 'ossec-logcollector':
                output = '<span style="width: 200px; display: inline-block; text-align: left;">Monitors configured files and commands for new log messages.</span>';
                break;
            case 'ossec-remoted':
                output = '<span style="width: 200px; display: inline-block; text-align: left;">The server side daemon that communicates with the agents.</span>';
                break;
            case 'ossec-syscheckd':
                output = '<span style="width: 200px; display: inline-block; text-align: left;">Checks configured files for changes to the checksums, permissions or ownership.</span>';
                break;
            case 'ossec-analysisd':
                output = '<span style="width: 200px; display: inline-block; text-align: left;">Receives the log messages and compares them to the rules. It will create alerts when a log message matches an applicable rule.</span>';
                break;
            case 'ossec-maild':
                output = '<span style="width: 200px; display: inline-block; text-align: left;">Sends OSSEC alerts via email. Is started by ossec-control when email alerts are configured.</span>';
                break;
            case 'ossec-execd':
                output = '<span style="width: 200px; display: inline-block; text-align: left;">Executes active responses by running the configured scripts.</span>';
                break;
            case 'wazuh-moduled':
                output = '<span style="width: 200px; display: inline-block; text-align: left;">Is on charge of load different Wazuh modules outside of OSSEC code.</span>';
                break;
            default:
                output = '<span style="width: 200px; display: inline-block; text-align: left;">Not description found for this daemon</span>';
                break;
        }
        return output;
    };

    var load = function () {
        DataFactory.getAndClean('get', '/manager/status', {})
            .then(function (data) {
                $scope.daemons = data.data;
                        DataFactory.getAndClean('get', '/agents/summary', {})
                            .then(function (data) {
                                $scope.agentsCountActive = data.data.active;
                                $scope.agentsCountDisconnected = data.data.disconnected;
                                $scope.agentsCountNeverConnected = data.data.neverConnected;
                                $scope.agentsCountTotal = data.data.total;
                                $scope.load = false;
                            }, printError);
            }, printError);
    };

    //Load
    load();

    //Destroy
    $scope.$on("$destroy", function () {
        //angular.forEach(objectsArray, DataFactory.clean(value));
        tabProvider.clean($scope.pageId);
    });

});

app.controller('managerConfigurationController', function ($scope, $route, $q, alertify, sharedProperties, $location, $sce, DataFactory, tabProvider, $filter) {
    //Initialisation
    $scope.load = true;

    $scope.pageId = (Math.random().toString(36).substring(3));
    tabProvider.register($scope.pageId);

    var objectsArray = [];

    //Print Error
    var printError = function (error) {
        alertify.delay(10000).closeLogOnClick(true).error(error.html);
    }

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
        DataFactory.getAndClean('get', '/manager/configuration', {})
            .then(function (data) {
                $scope.managerConfiguration = data.data;
                parseConfiguration();
            }, printError);
        $scope.load = false;
    };
    
    //Load
    load();

    //Destroy
    $scope.$on("$destroy", function () {
        //angular.forEach(objectsArray, DataFactory.clean(value));
        tabProvider.clean($scope.pageId);
    });

});