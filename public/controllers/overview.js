var app = require('ui/modules').get('app/wazuh', []);

app.controller('overviewGeneralController', function ($scope, DataFactory, genericReq, $mdToast, errlog) {
    //Initialisation
    $scope.load = true;
	$scope.defaultManager = $scope.$parent.state.getDefaultManager().name;

});

app.controller('overviewFimController', function ($scope, DataFactory, genericReq, $mdToast, errlog) {
    //Initialisation
    $scope.load = true;
	$scope.defaultManager = $scope.$parent.state.getDefaultManager().name;

});

app.controller('overviewPMController', function ($scope, DataFactory, genericReq, $mdToast, errlog) {
    //Initialisation
    $scope.load = true;
    $scope.$parent.state.setOverviewState('pm');
	$scope.defaultManager = $scope.$parent.state.getDefaultManager().name;

});

app.controller('overviewOSCAPController', function ($scope, DataFactory, genericReq, $mdToast, errlog) {
    //Initialisation
    $scope.load = true;
    $scope.$parent.state.setOverviewState('oscap');
	$scope.defaultManager = $scope.$parent.state.getDefaultManager().name;

});
