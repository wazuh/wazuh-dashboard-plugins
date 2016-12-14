// Require App
var app = require('ui/modules').get('app/wazuh', []);


app.controller('testController', function ($scope, $http, testConnection, appState, $mdToast, $rootScope) {

var date = new Date(Date.now()).toISOString();
console.log(date);
		
});