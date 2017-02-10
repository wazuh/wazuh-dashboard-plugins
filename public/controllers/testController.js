// Require App

var app = require('ui/modules').get('app/wazuh');

app.controller('testController', function ($compile, appState, $scope, $mdToast, $rootScope, $http) {
var payload = {};
var fields = {"fields" : [{"field": "rule.groups", "value": "oscap"},{"field": "agent.name", "value": "localCentos2"}]};
var managerName = {"manager" : "ubuntu5"};
var timeInterval = {"timeinterval": {"gte" : "now-1d", "lt": "now"}};

angular.extend(payload, fields, managerName, timeInterval );
console.log(payload);

$http.post('/api/wazuh-elastic/alerts-count/', payload).then(function (data) {
	console.log(data);
});
});

