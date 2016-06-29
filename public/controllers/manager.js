// Require utils
var kwu = require('plugins/wazuh/utils/kibanaWazuhUtils.js');
// Require config
var config = require('plugins/wazuh/config/config.js');
require('ui/notify');
var app = require('ui/modules').get('app/wazuh', [
    'elasticsearch',
    'ngRoute',
    'kibana/courier',
    'kibana/config',
    'kibana/notify',
    'kibana/typeahead'
]);

app.controller('managerController', function ($scope, $http, Notifier, $route, $q, alertify, $interval, $filter, sharedProperties, $location, apiCall, $sce) {
    $scope.load = true;
    // Load settings
    kwu.getApiCredentials($q, $http).then(function (data) {
        var authdata = data[0];
        var api_url = data[1];
        const notify = new Notifier({
            location: 'Wazuh'
        });

        $scope.fetchDaemonsList = function () {
            var defered = $q.defer();
            var promise = defered.promise;

            apiCall.getApiCall(api_url, '/manager/status', authdata, $q, $http)
                .then(function (data) {
                    $scope.daemons = data.data;
                    defered.resolve(1);
                }, function (data) {
                    $scope.message = $sce.trustAsHtml(apiCall.errorControl(data));
                    defered.resolve(0);
                });
            return promise;
        };

        $scope.fetchDaemonsList().then(function () {
            $scope.getConfiguration().then(function () {
                $scope.getAgentsCount().then(function () {
                    $scope.load = false;
                });
            });
        });

        $interval(function () { $scope.fetchDaemonsList() }, 610000);

        $scope.getDaemonStatusClass = function (daemonStatus) {
            if (daemonStatus == "running")
                return "icon_agent_status_green"
            else if (daemonStatus == "stopped")
                return "icon_agent_status_red";
            else
                return "icon_agent_status_red";
        };

        $scope.start = function () {
            notify.info('Starting manager...');
            apiCall.putApiCall(api_url, '/manager/start', {}, authdata, $q, $http)
                .then(function (data) {
                    $route.reload();
                    notify.info('Manager started successfully');
                }, function (data) {
                    $scope.message = $sce.trustAsHtml(apiCall.errorControl(data));
                    notify.error('Error starting manager');
                });
        };

        $scope.stop = function () {
            alertify.confirm("Are you sure you want to stop the manager? You will not receive OSSEC alerts while the manager remains stopped.", function () {
                notify.info('Stopping manager...');
                apiCall.putApiCall(api_url, '/manager/stop', {}, authdata, $q, $http)
                    .then(function (data) {
                        $route.reload();
                        notify.info('Manager stopped successfully');
                    }, function (data) {
                        $scope.message = $sce.trustAsHtml(apiCall.errorControl(data));
                        notify.error('Error stopping manager');
                    });
            }, function () {
                //Do nothing
            });
        };

        $scope.restart = function () {
            alertify.confirm("Are you sure you want to restart the manager?", function () {
                notify.info('Restarting manager...');
                apiCall.putApiCall(api_url, '/manager/restart', {}, authdata, $q, $http)
                    .then(function (data) {
                        $route.reload();
                        notify.info('Manager restarted successfully');
                    }, function (data) {
                        $scope.message = $sce.trustAsHtml(apiCall.errorControl(data));
                        notify.error('Error restarting manager');
                    });
            }, function () {
                //Do nothing
            });
        };

        $scope.testConfig = function () {
            apiCall.getApiCall(api_url, '/manager/configuration/test', authdata, $q, $http)
                .then(function (data) {
                    if (data.data == 'OK') {
                        notify.info('Manager configuration works correctly');
                    } else {
                        notify.warning('Configuration error found: ' + data.message);
                    }
                }, function (data) {
                    $scope.message = $sce.trustAsHtml(apiCall.errorControl(data));
                    notify.error('Error testing configuration');
                });
        };

        $scope.getAgentsCount = function () {
            var defered = $q.defer();
            var promise = defered.promise;

            apiCall.getApiCall(api_url, '/agents', authdata, $q, $http)
                .then(function (data) {
                    $scope.agentsCountActive = $filter('filter')(data.data, { status: 'active' }).length;
                    $scope.agentsCountDisconnected = $filter('filter')(data.data, { status: 'disconnected' }).length;
                    $scope.agentsCountNeverConnected = $filter('filter')(data.data, { status: 'never connected' }).length;
                    $scope.agentsCountTotal = data.data.length;
                    defered.resolve(0);
                }, function (data) {
                    $scope.message = $sce.trustAsHtml(apiCall.errorControl(data));
                    defered.resolve(1);
                });

            return promise;
        };

        $scope.parseConfiguration = function () {
            if ($scope.managerConfiguration.rules.decoder) {
                if (angular.isString($scope.managerConfiguration.rules.decoder)) { $scope.managerConfiguration.rules.decoder = [$scope.managerConfiguration.rules.decoder] }
            }
            if ($scope.managerConfiguration.rules.rule_dir) {
                if (angular.isString($scope.managerConfiguration.rules.rule_dir)) { $scope.managerConfiguration.rules.rule_dir = [$scope.managerConfiguration.rules.rule_dir] }
            }
            if ($scope.managerConfiguration.rules.list) {
                if (angular.isString($scope.managerConfiguration.rules.list)) { $scope.managerConfiguration.rules.list = [$scope.managerConfiguration.rules.list] }
            }
        };

        $scope.getConfiguration = function () {
            var defered = $q.defer();
            var promise = defered.promise;

            apiCall.getApiCall(api_url, '/manager/configuration', authdata, $q, $http)
                .then(function (data) {
                    $scope.managerConfiguration = data.data;
                    $scope.parseConfiguration();
                    defered.resolve(1);
                }, function (data) {
                    $scope.message = $sce.trustAsHtml(apiCall.errorControl(data));
                    defered.resolve(0);
                });
            return promise;
        };

        //isRule -> true: rule, false: decoder
        $scope.ruleDetail = function (file, isRule) {
            sharedProperties.setRuleFileName(file);
            sharedProperties.setIsRule(isRule);
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

        // Tabs
        $scope.tab = 1;

        $scope.setTab = function (newTab) {
            $scope.tab = newTab;
        };

        $scope.isSet = function (tabNum) {
            return $scope.tab === tabNum;
        };

    }, function (data) {
        $scope.message = $sce.trustAsHtml('Could not get the API credentials. Is elasticsearch working?');
    });

});

