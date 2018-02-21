const app = require('ui/modules').get('app/wazuh', []);
import $ from 'jquery';
// Logs controller
app.controller('blankScreenController', function ($scope, $rootScope, errorHandler) {
    if($rootScope.blankScreenError) {
        $('#result').html(errorHandler.handle($rootScope.blankScreenError,'',false,true));
        delete $rootScope.blankScreenError;
    } else {
        $('#result').html('Something went wrong')
    }
});