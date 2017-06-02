// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('pmController', function ($scope, DataFactory, errlog, appState) {
    var ring = document.getElementsByClassName("uil-ring-css");
    ring[0].style.display="block";
	$scope.defaultManagerName = appState.getDefaultManager().name;
});
