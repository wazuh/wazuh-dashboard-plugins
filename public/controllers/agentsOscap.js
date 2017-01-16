// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('oscapController', function ($scope, DataFactory, $mdToast, errlog, appState) {
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
