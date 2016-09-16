// Require utils
var kuf = require('plugins/wazuh/utils/kibanaUrlFormatter.js');
// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('overviewController', function ($scope, DataFactory, genericReq, tabProvider, $mdDialog, $mdToast) {
    //Initialisation
    $scope.load = true;
    $scope.$parent.state.setOverviewState('general');
	$scope.timeFilter = "24h";
	
    $scope.stats = [];


    $scope.pageId = (Math.random().toString(36).substring(3));
    tabProvider.register($scope.pageId);

    var objectsArray = [];

    //Print Error
    var printError = function (error) {
        $mdToast.show({
            template: '<md-toast>' + error.html + '</md-toast>',
            position: 'bottom left',
            hideDelay: 5000,
        });
    };

    //Tabs
    $scope.setTab = function (tab, group) {
        tabProvider.setTab($scope.pageId, tab, group);
    };

    $scope.isSetTab = function (tab, group) {
        return tabProvider.isSetTab($scope.pageId, tab, group);
    };

	
	$scope.setTimer = function (time) {			
        if(time == "24h"){
			$scope.timerFilterValue = "24h";
		}else if(time == "48h"){
			$scope.timerFilterValue = "48h";
		}else{
			$scope.timerFilterValue = "7d";
		}
    };


	var load_tops = function () { 

		var daysAgo = 1;
		
		if($scope.timerFilterValue == "7d"){
			var daysAgo = 7;
		}else if($scope.timerFilterValue == "48h"){
			var daysAgo = 2;
		}else{
			var daysAgo = 1;
		}
		
		var date = new Date();
		date.setDate(date.getDate()-daysAgo);
		var timeAgo = date.getTime();
		
		//timeAgo = "";
		
		genericReq.request('GET', '/api/wazuh-elastic/top/srcuser/'+timeAgo)
                .then(function (data) {
                    $scope.topsrcuser = data.data;
                }, printError);
		genericReq.request('GET', '/api/wazuh-elastic/top/srcip/'+timeAgo)
                .then(function (data) {
                    $scope.topsrcip = data.data;
                }, printError);
		genericReq.request('GET', '/api/wazuh-elastic/top/rule.groups/'+timeAgo)
                .then(function (data) {
                    $scope.topgroup = data.data;
                }, printError);
		genericReq.request('GET', '/api/wazuh-elastic/top/rule.PCI_DSS/'+timeAgo)
                .then(function (data) {
                    $scope.toppci = data.data;
                }, printError);		
	}
	load_tops();			
    var load = function () {
		DataFactory.getAndClean('get', '/agents/summary', {})
			.then(function (data) {
				$scope.agentsCountActive = data.data.active;
				$scope.agentsCountDisconnected = data.data.disconnected;
				$scope.agentsCountNeverConnected = data.data.neverConnected;
				$scope.agentsCountTotal = data.data.total;
				$scope.load = false;
		}, printError);
    };

    //Load
    load();

	// Timer filter watch
	var loadWatch = $scope.$watch(function () {
        return $scope.$parent.timeFilter;
    }, function () {
        $scope.setTimer($scope.$parent.timeFilter);
		load_tops();
    });
	

    //Destroy
    $scope.$on("$destroy", function () {
        //angular.forEach(objectsArray, DataFactory.clean(value));
        tabProvider.clean($scope.pageId);
        $scope.stats.length = 0;
		loadWatch();
    });

});
