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

app.controller('cisController', function ($scope, $http, Notifier, $route) {
    // Load settings
    kwu.getApiCredentials($q, $http).then(function (data) {
            var authdata = data[0];
            var api_url = data[1];
            const notify = new Notifier({
                location: 'Wazuh'
            });
            
            $scope.fetchAuditsList = function () {

                if (($scope.agentid == undefined) || ($scope.agentid == null) || ($scope.agentid == '')) {
                    notify.warning('Please, specify a valid agent ID');
                } else {
                    $http.get(api_url + '/rootcheck/' + $scope.agentid, {
                        headers: {
                            "Authorization": 'Basic ' + authdata,
                            "api-version": 'v1.2'
                        }
                    }).success(function (data) {
                        if ((data.data == undefined) || (data.data == []) || (data.data == '') || (data.data == null)) {
                            notify.error('Agent ID not found, or rootcheck database is empty');
                        } else {
                            $scope.audits = data.data;
                        }
                    })
                        .error(function (data) {
                            if (data.error == 600) {
                                notify.warning('Please, specify a valid agent ID');
                            } else if (data.error == 2) {
                                notify.error('Agent ID not found, or rootcheck database is empty');  
                            } else {
                                $scope.message = "Unable to connect to RESTful API, please check the connection at Settings tab.";
                            }
                        })
                }
            };

            $scope.fetchAuditsList();

            $scope.reloadCIS = function () {
                $scope.fetchAuditsList();
            }

        }, function (data) {
            $scope.message = "Unable to connect to RESTful API, please check the connection at Settings tab.";
        });
});

