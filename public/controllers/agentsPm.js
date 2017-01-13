// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('pmController', function ($scope, DataFactory, $mdToast, errlog, appState) {
    //Initialisation
	$scope.defaultManagerName = appState.getDefaultManager().name;

    //Print Error
    var printError = function (error) {
        $mdToast.show({
            template: '<md-toast>' + error.html + '</md-toast>',
            position: 'bottom left',
            hideDelay: 5000,
        });
    }

});
