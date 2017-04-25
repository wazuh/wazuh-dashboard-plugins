// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('dashboardController', function ($scope, $location) {
	$scope.dashboardURL = "/app/kibana#/dashboards?embed=true";
});
