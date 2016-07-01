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

app.controller('rootcheckController', function ($scope, $http, Notifier, $route, $q, alertify, sharedProperties) {
/*    $scope.load = true;
    // Load settings
    getApiCredentials($q, $http).then(function (data) {
            var authdata = data[0];
            var api_url = data[1];
            const notify = new Notifier({
                location: 'Wazuh'
            });
            
            $scope.fetchAuditsList = function () {
                if (sharedProperties.getAgentId() != '') {
                    $scope.agentid = sharedProperties.getAgentId();
                    sharedProperties.setAgentId('');
                }

                if (($scope.agentid == undefined) || ($scope.agentid == null) || ($scope.agentid == '')) {
                    $scope.audits = [];
                } else {
                    $http.get(api_url + '/rootcheck/' + $scope.agentid, {
                        headers: {
                            "Authorization": 'Basic ' + authdata,
                            "api-version": 'v1.2'
                        }
                    }).success(function (data) {
                        if ((data.data == undefined) || (data.data == []) || (data.data == '') || (data.data == null)) {
                            notify.error('Rootcheck database is empty');
                            $scope.audits = [];
                        } else {
                            $scope.audits = data.data;
                        }
                    })
                        .error(function (data) {
                            $scope.audits = [];
                            if (data.error == 600) {
                                notify.warning('Please, specify a valid agent ID');
                            } else if (data.error == 2) {
                                notify.error('Rootcheck database is empty');
                            } else {
                                $scope.message = "Unable to connect to RESTful API, please check the connection at Settings tab.";
                            }
                        })
                }
            };

            $scope.fetchAgentsList = function () {
                var defered = $q.defer();
                var promise = defered.promise;

                $http.get(api_url + '/agents', {
                    headers: {
                        "Authorization": 'Basic ' + authdata,
                        "api-version": 'v1.2'
                    }
                }).success(function (data) {
                    $scope.agents = data.data;
                    defered.resolve(1);
                })
                    .error(function (data) {
                        $scope.message = "Unable to connect to RESTful API, please check the connection at Settings tab.";
                        defered.resolve(0);
                    })
                    return promise;
            }


            $scope.fetchAuditsList();
            $scope.fetchAgentsList().then( function(data) {
                $scope.load = false;
            });


            $scope.reloadRC = function () {
                $scope.fetchAuditsList();
            }

            $scope.sort = function (keyname) {
                $scope.sortKey = keyname;
                $scope.reverse = !$scope.reverse;
            }

            $scope.runSyscheck = function () {
                notify.info('Restarting syscheck and rootcheck...');
                $http.put(api_url + '/syscheck', {}, {
                    headers: {
                        "Authorization": 'Basic ' + authdata,
                        "api-version": 'v1.2'
                    }
                }).success(function (data) {
                    notify.info('Syscheck and rootcheck restarted successfully');
                })
                    .error(function (data) {
                        notify.error('Error restarting syscheck/rootcheck on agent');
                        console.log('Error: ' + data);
                    })
            }

            $scope.deleteRootcheck = function ($agent) {
                alertify.confirm("Are you sure you want to clean rootcheck database for all the agents?", function () {
                    $http.delete(api_url + '/rootcheck', {
                        headers: {
                            "Authorization": 'Basic ' + authdata,
                            "api-version": 'v1.2'
                        }
                    }).success(function (data) {
                        notify.info('Rootcheck database deleted successfully');
                    })
                        .error(function (data) {
                            notify.error('Error deleting rootcheck database');
                            console.log('Error: ' + data);
                        })
                }, function () {

                });
            }

        }, function (data) {
            $scope.message = "Unable to connect to RESTful API, please check the connection at Settings tab.";
        });*/
});

