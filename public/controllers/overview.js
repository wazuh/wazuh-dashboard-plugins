// Require utils
var base64 = require('plugins/wazuh/utils/base64.js');
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

app.controller('overviewController', function ($scope, $http, Notifier, $route, $q, $interval, $filter) {
    $scope.load = true;
    $http.get("/elasticsearch/wazuh-agents")
        .success(function (data, status) {
            $scope.error = false;
        })
        .error(function (data) {
            $scope.error = true;
        });

    $http.get("/elasticsearch/.kibana/wazuh-configuration/1")
        .success(function (data, status) {
            const notify = new Notifier({
                location: 'Wazuh'
            });
            var api_username = data._source.api_user;
            var api_password = base64.decode(data._source.api_password);
            var api_url = data._source.api_url;
            // Get authorization token
            var authdata = base64.encode(api_username + ':' + api_password);

            $scope.getAgentsCountByStatus = function (statusName) {
                var defered = $q.defer();
                var promise = defered.promise;

                $http.get(api_url + '/agents?status=' + statusName, {
                    headers: {
                        "Authorization": 'Basic ' + authdata,
                        "api-version": 'v1.2'
                    }
                }).success(function (data) {
                    defered.resolve(data.data.length);
                })
                    .error(function (data) {
                        defered.resolve(0);
                    })
                return promise;
            }

            $scope.getAgentsCount = function () {
                var defered = $q.defer();
                var promise = defered.promise;

                $http.get(api_url + '/agents', {
                    headers: {
                        "Authorization": 'Basic ' + authdata,
                        "api-version": 'v1.2'
                    }
                }).success(function (data) {
                    $scope.agentsCountTotal = data.data.length;
                    defered.resolve(1);
                })
                    .error(function (data) {
                        $scope.agentsCountTotal = 0;
                        $scope.message = "Unable to connect to RESTful API, please check the connection at Settings tab.";
                        defered.resolve(0);
                    })
                $scope.getAgentsCountByStatus('active').then(function (data) {
                    $scope.agentsCountActive = data;
                    $scope.statusChartData[0] = [data];
                });
                $scope.getAgentsCountByStatus('disconnected').then(function (data) {
                    $scope.agentsCountDisconnected = data;
                    $scope.statusChartData[1] = [data];
                });
                $scope.getAgentsCountByStatus('never connected').then(function (data) {
                    $scope.agentsCountNeverConnected = data;
                    $scope.statusChartData[2] = [data];
                });
                return promise;
            }

            $scope.getAgents = function () {
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
                        $scope.agents = [];
                        $scope.message = "Unable to connect to RESTful API, please check the connection at Settings tab.";
                        defered.resolve(0);
                    })
                return promise;
            }

            $scope.getDisconnectedAgents = function () {
                var defered = $q.defer();
                var promise = defered.promise;
                $http.get(api_url + '/agents?status=disconnected', {
                    headers: {
                        "Authorization": 'Basic ' + authdata,
                        "api-version": 'v1.2'
                    }
                }).success(function (data) {
                    $scope.disconnectedAgents = data.data;
                    defered.resolve(1);
                })
                    .error(function (data) {
                        $scope.agents = [];
                        $scope.message = "Unable to connect to RESTful API, please check the connection at Settings tab.";
                        defered.resolve(0);
                    })
                return promise;
            }

            $scope.getAgentsStatusChart = function () {
                $scope.statusChartOptions = {
                    legend: {
                        display: true
                    },
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true
                            }
                        }]
                    }
                };
                $scope.statusChartLabels = ['Current status'];
                $scope.statusChartSeries = ['Active', 'Disconnected', 'Never connected'];
                $scope.statusChartData = [0, 0, 0];
            }

            $scope.getAgentsStatusTimeline = function () {
                var defered = $q.defer();
                var promise = defered.promise;

                $scope.statusTlOptions = {
                    legend: {
                        display: true
                    },
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true
                            }
                        }]
                    }
                };
                $scope.statusTlLabels = ['Loading data'];
                $scope.statusTlSeries = ['Active', 'Disconnected', 'Never connected'];
                $scope.statusTlData = [[0], [0], [0]];

                $http.get("/elasticsearch/wazuh-agents/agent/_search?q=*:*&size=10000")
                    .success(function (data) {
                        var arrayConnected = [];
                        var arrayDisconnected = [];
                        var arrayNeverConnected = [];
                        var agentsStatus = data.hits.hits;
                        var groupedAgentsStatus = [];
                        angular.forEach(agentsStatus, function (agent) {
                            agent._source['@timestamp'] = $filter('date')(new Date(agent._source['@timestamp']), 'yyyy/MM/dd HH:mm');;
                            if (groupedAgentsStatus[agent._source['@timestamp']] == undefined) {
                                groupedAgentsStatus[agent._source['@timestamp']] = [];
                            }
                            if (groupedAgentsStatus[agent._source['@timestamp']][agent._source.status] == undefined) {
                                groupedAgentsStatus[agent._source['@timestamp']][agent._source.status] = [];
                            }
                            groupedAgentsStatus[agent._source['@timestamp']][agent._source.status].push(agent._source.id);
                        });
                        $scope.statusTlLabels = Object.keys(groupedAgentsStatus);
                        var group;
                        angular.forEach($scope.statusTlLabels, function (key) {
                            group = groupedAgentsStatus[key];
                            if (group['Active'] != undefined) {
                                arrayConnected.push(group['Active'].length);
                            } else {
                                arrayConnected.push(0);
                            }
                            if (group['Disconnected'] != undefined) {
                                arrayDisconnected.push(group['Disconnected'].length);
                            } else {
                                arrayDisconnected.push(0);
                            }
                            if (group['Never connected'] != undefined) {
                                arrayNeverConnected.push(group['Never connected'].length);
                            } else {
                                arrayNeverConnected.push(0);
                            }
                        });
                        $scope.statusTlData = [arrayConnected, arrayDisconnected, arrayNeverConnected];
                        defered.resolve(1);
                    })
                    .error(function (data) {
                        $scope.statusTlLabels = ['Error'];
                        $notify.error('Error loading agent status historical data');
                        defered.resolve(0);
                    });

                return promise;
            }

            $scope.getTopAgentsTable = function () {
                $scope.topAgents = [];
                var defered = $q.defer();
                var promise = defered.promise;
                $http.post("/elasticsearch/ossec-*/_search", {
                    "size": 0,
                    "aggs": {
                        "group_by_AgentName_time": {
                            "filter": {
                                "range": {
                                    "@timestamp": {
                                        "gt": "now-24h"
                                    }
                                }
                            }, "aggs": {
                                "group_by_AgentName": {
                                    "terms": {
                                        "field": "AgentName"
                                    }
                                }
                            }
                        }
                    }
                })
                    .success(function (data, status) {
                        defered.resolve(1);
                        $scope.topAgents = data.aggregations.group_by_AgentName_time.group_by_AgentName.buckets;
                    })
                    .error(function (data) {
                        defered.resolve(0);
                    });
                return promise;
            }

            //Load data
            $scope.getAgentsStatusChart();
            $scope.getTopAgentsTable().then(function () {
                $scope.getAgentsCount().then(function () {
                    $scope.getAgents().then(function () {
                        $scope.getDisconnectedAgents().then(function () {
                            if (!$scope.error) {
                                $scope.getAgentsStatusTimeline().then(function () {
                                    $scope.load = false;
                                });
                            }
                            else {
                                $scope.load = false;
                            }
                        })
                    })
                })
            });

            //Refresh the page
            $interval(function () {
                $scope.getAgentsStatusChart();
                $scope.getTopAgentsTable().then(function () {
                    $scope.getAgentsCount().then(function () {
                        $scope.getAgents().then(function () {
                            $scope.getDisconnectedAgents().then(function () {
                                if (!$scope.error) {
                                    $scope.getAgentsStatusTimeline().then(function () {
                                        $scope.load = false;
                                    });
                                }
                                else {
                                    $scope.load = false;
                                }
                            })
                        })
                    })
                });
            }, 610000);

            $scope.sortStatus = function (keyname) {
                $scope.sortKeyStatus = keyname;
                $scope.reverseStatus = !$scope.reverseStatus;
            }

            $scope.sortDisconnected = function (keyname) {
                $scope.sortKeyDisconnected = keyname;
                $scope.reverseDisconnected = !$scope.reverseDisconnected;
            }

        })
        .error(function (data) {
            $scope.message = "Unable to connect to RESTful API, please check the connection at Settings tab.";
        });
});