// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('agentsOverviewController', function ($scope, DataFactory, $mdToast, appState) {
	$scope.defaultManagerName = appState.getDefaultManager().name;

    //Print Error
    var printError = function (error) {
        $mdToast.show({
            template: '<md-toast>' + error.html + '</md-toast>',
            position: 'bottom left',
            hideDelay: 5000,
        });
    };
});
