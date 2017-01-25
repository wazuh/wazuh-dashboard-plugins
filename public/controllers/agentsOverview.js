// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('agentsOverviewController', function ($scope, DataFactory, $mdToast) {

    //Initialization 
    $scope.load = true;
    $scope.agentInfo = $scope.$parent._agent;
	
	var loadWatch;
    //Print Error
    var printError = function (error) {
        $mdToast.show({
            template: '<md-toast>' + error.html + '</md-toast>',
            position: 'bottom left',
            hideDelay: 5000,
        });
    };

    //Functions
    $scope.fetchAgent = function (agent) {
        DataFactory.getAndClean('get', '/agents/' + agent.id, {})
            .then(function (data) {
                $scope.agentInfo = data.data;
				$scope.$parent._agent.status = data.data.status;
                if (agent.id != '000') {
                    DataFactory.getAndClean('get', '/agents/' + agent.id + '/key', {})
                        .then(function (data) {
                            $scope.agentInfo.key = data.data;
                            $scope.load = false;
                            $scope.$parent.load = false;
                        }, printError);
                }
            }, printError);
    };
	
	loadWatch = $scope.$watch(function () {
        return $scope.$parent._agent;
    }, function () {
        $scope.fetchAgent($scope.$parent._agent);
    });
	
	//Destroy
    $scope.$on("$destroy", function () {
        loadWatch();
    });

});
