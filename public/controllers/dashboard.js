// Require config
var app = require('ui/modules').get('app/wazuh', []);
import chrome from 'ui/chrome';

app.controller('dashboardController', function ($scope, $location) {
	$scope.dashboardURL = chrome.addBasePath("/app/kibana#/dashboards?embed=true");
});
