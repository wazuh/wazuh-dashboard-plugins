// Require App

var app = require('ui/modules').get('app/wazuh');



app.controller('testController', function (appState, $scope, $mdToast, $rootScope, genericReq) {
	// GET /api/wazuh-elastic/top/{manager}/{field}/{fieldFilter}/{fieldValue}/{time?}
	$scope.state = appState;
	$scope.defaultManager = $scope.state.getDefaultManager().name;
	
	var daysAgo = 1;
	var date = new Date();
	date.setDate(date.getDate() - daysAgo);
	var timeAgo = date.getTime();
	
	// Check if rule group exists on last timeAgo.
	// Input: rule group. Output: true / false
	$scope.dynamicTab_exists = function (group) {
		 genericReq.request('GET', '/api/wazuh-elastic/top/'+$scope.defaultManager+'/rule.groups/rule.groups/'+group+'/'+timeAgo)
			.then(function (data) {
				if(data.data != ""){
					console.log(data);
					console.log("there is data");
				}else{
					console.log(data);
					console.log("there is NOT data");
				}
            });	
    };	
	$scope.dynamicTab_exists("oscap");	
});

