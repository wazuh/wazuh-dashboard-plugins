// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('fimController', function ($scope, $q, DataFactory, errlog) {
    $scope._fimEvent = 'all'
}); 
