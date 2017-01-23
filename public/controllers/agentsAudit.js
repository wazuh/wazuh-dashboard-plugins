// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('auditController', function ($scope, $q, DataFactory, $mdToast, errlog) {

    //Print error
    var printError = function (error) {
        $mdToast.show({
            template: '<md-toast>' + error.html + '</md-toast>',
            position: 'bottom left',
            hideDelay: 5000,
        });
    };
}); 