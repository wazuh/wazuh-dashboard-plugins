// Require utils
var kuf = require('plugins/wazuh/utils/kibanaUrlFormatter.js');
// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('kibanaIntegrationController', function ($scope) {

    //Print Error
    var printError = function (error) {
        alertify.delay(10000).closeLogOnClick(true).error(error.html);
    }

    $scope.getAlerts = function (agent, time, filters) {
        if (!filter) {
            filter = '';
        }
        if (!time) {
            time = '';
        }
        var rulesUrl = kuf.getAlerts('ossec-*', filter, time);
        return rulesUrl;
    };

    $scope.getDashboard = function (dashboard, filter, time, url) {
        if (!filter) {
            filter = '';
        }
        if (!time) {
            time = '';
        }
        return kuf.getDashboard(dashboard, filter, time, url);
    };

    $scope.getAlerts = function (index, filter, time, url) {
        if (!filter) {
            filter = '';
        }
        if (!time) {
            time = '';
        }
        return kuf.getAlerts(index, filter, time, url);
    };

    $scope.getVisualization = function (visName, filter, time, url) {
        if (!filter) {
            filter = '';
        }
        if (!time) {
            time = '';
        }
        if (url == undefined) {
            url = false;
        }
        return kuf.getVisualization(visName, filter, time, url);
    };
    
});