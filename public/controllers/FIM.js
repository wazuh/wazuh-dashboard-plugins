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

app.controller('fimController', function ($scope, $http, Notifier, $route, $q, alertify, sharedProperties) {
    $scope.load = true;
    // Load settings
    kwu.getApiCredentials($q, $http).then(function (data) {
            var authdata = data[0];
            var api_url = data[1];
            const notify = new Notifier({
                location: 'Wazuh'
            });
            
            $scope.fetchFilesList = function () {
                if (sharedProperties.getAgentId() != '') {
                    $scope.agentid = sharedProperties.getAgentId();
                    sharedProperties.setAgentId('');
                }

                if (($scope.agentid == undefined) || ($scope.agentid == null) || ($scope.agentid == '')) {
                    $scope.files = [];
                } else {
                    $http.get(api_url + '/syscheck/' + $scope.agentid + '/files/changed', {
                        headers: {
                            "Authorization": 'Basic ' + authdata,
                            "api-version": 'v1.2'
                        }
                    }).success(function (data) {
                        if ((data.data == undefined) || (data.data == []) || (data.data == '') || (data.data == null)) {
                            $scope.files = [];
                            notify.error('Syscheck database is empty');
                        } else {
                            $scope.files = data.data;
                            $scope.fileFetchEvents = [];
                        }
                    })
                        .error(function (data) {
                            $scope.files = [];
                            if (data.error == 600) {
                                notify.error('Not valid agent ID');
                            } else if (data.error == 2) {
                                notify.error('Syscheck database is empty');
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

            $scope.fetchFilesList();
            $scope.fetchAgentsList().then( function (data){
                $scope.load = false;
            });

            $scope.fetchFile = function (file, index) {
                $http.get(api_url + '/syscheck/' + $scope.agentid + '/files/changed?filename=' + file.file, {
                    headers: {
                        "Authorization": 'Basic ' + authdata,
                        "api-version": 'v1.2'
                    }
                }).success(function (data) {
                    if ((data.data == undefined) || (data.data == null)) {
                        notify.error('Error getting info of ' + file.file + ': Nothing found');
                    } else {
                        var lastFive = [];
                        if (data.data.length > 5) {
                            lastFive = data.data.slice(-5, -1);
                        } else {
                            lastFive = data.data;
                        }
                        var eventData = [];
                        var i = 0;
                        angular.forEach(lastFive, function (event, key) {
                            if (event.date <= file.date) {
                                eventData[i] = [];
                                eventData[i]['date'] = event.date;
                                eventData[i]['event'] = event.attrs.event;
                                eventData[i]['size'] = event.attrs.size;
                                eventData[i]['mode'] = event.attrs.mode;
                                eventData[i]['permissions'] = event.attrs.perm;
                                eventData[i]['uid'] = event.attrs.uid;
                                eventData[i]['gid'] = event.attrs.gid;
                                eventData[i]['md5'] = event.attrs.md5;
                                eventData[i]['sha1'] = event.attrs.sha1;
                                i++;
                            }
                        });
                        $scope.fileFetchEvents[index] = eventData;
                    }
                }).error(function (data) {

                })
            }

            $scope.reloadFIM = function () {
                $scope.fetchFilesList();
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

            $scope.deleteSyscheck = function () {
                alertify.confirm("Are you sure you want to clean FIM database for all the agents?", function () {
                    $http.delete(api_url + '/syscheck', {
                        headers: {
                            "Authorization": 'Basic ' + authdata,
                            "api-version": 'v1.2'
                        }
                    }).success(function (data) {
                        notify.info('Syscheck database deleted successfully');
                    })
                        .error(function (data) {
                            notify.error('Error deleting syscheck database');
                            console.log('Error: ' + data);
                        })
                }, function () {

                });
            }

        }, function (data) {
            $scope.message = "Unable to connect to RESTful API, please check the connection at Settings tab.";
        });
});

