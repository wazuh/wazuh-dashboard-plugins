// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('dashboardController', function ($scope, $location) {
	$scope.dashboardURL = "http://"+$location.host()+":"+$location.port()+"/app/kibana#/dashboard/OSSEC-Alerts?embed=true";
});
