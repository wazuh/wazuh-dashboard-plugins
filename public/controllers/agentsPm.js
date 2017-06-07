// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('pmController', function ($scope, DataFactory, errlog, appState) {
	$scope.defaultManagerName = appState.getDefaultManager().name;
});
