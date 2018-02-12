const app = require('ui/modules').get('app/wazuh', []);

app.controller('loginController', function ($scope, $rootScope, $location, appState, genericReq, $window) {
    $scope.submit = password => {
        genericReq.request('POST', '/api/wazuh-api/wlogin', {password: password})
        .then(data => {
            appState.setUserCode(data.data.code);
            $location.path('/overview');
            if(!$scope.$$phase) $scope.$digest();
        })
        .catch (error => {
            $scope.errorFromRequest = 'Wrong password, try again'
        })
    }
});