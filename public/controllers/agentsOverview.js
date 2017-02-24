// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('agentsOverviewController', function ($scope, DataFactory, appState) {
	$scope.defaultManagerName = appState.getDefaultManager().name;
});
