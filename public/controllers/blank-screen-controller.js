import * as modules from 'ui/modules'

const app = modules.get('app/wazuh', []);

// Logs controller
app.controller('blankScreenController', function ($scope, $rootScope, errorHandler,$location) {
    if($rootScope.blankScreenError) {
        $scope.errorToShow = $rootScope.blankScreenError;
        delete $rootScope.blankScreenError;
        if(!$scope.$$phase) $scope.$digest();
    } 
    $scope.goOverview = () => {
        $location.path('/overview'); 
    }
});