const app = require('ui/modules').get('app/wazuh', []);

// Logs controller
app.controller('blankScreenController', function ($scope, $rootScope, errorHandler) {
    $scope.error = '';
    if($rootScope.blankScreenError) {
        $scope.error = errorHandler.handle($rootScope.blankScreenError,'',false,true);
        delete $rootScope.blankScreenError;
    }
});