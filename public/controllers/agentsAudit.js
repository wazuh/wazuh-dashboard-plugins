// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('auditController', function ($scope, $q, DataFactory, errlog) {
    var ring = document.getElementsByClassName("uil-ring-css");
    ring[0].style.display="block";
}); 
