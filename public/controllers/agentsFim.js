// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('fimController', function ($scope, $q, DataFactory, errlog) {
    var ring = document.getElementsByClassName("uil-ring-css");
    ring[0].style.display="block";
    $scope._fimEvent = 'all'
}); 
