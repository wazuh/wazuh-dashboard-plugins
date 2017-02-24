// Require App

var app = require('ui/modules').get('app/wazuh');

app.controller('testController', function ($compile, appState, $scope, $rootScope, $http, Notifier) {

const notify = new Notifier({
        location: '*'
    });
	
	notify.error("hehe");
});

