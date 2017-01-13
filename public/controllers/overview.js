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

    //Print Error
    var printError = function (error) {
        $mdToast.show({
            template: '<md-toast>' + error.html + '</md-toast>',
            position: 'bottom left',
            hideDelay: 5000,
        });
    };

    //Functions

    var load_tops = function () {
        
        // Last fields

        genericReq.request('GET', '/api/wazuh-elastic/last/'+$scope.defaultManager+'/SyscheckFile/SyscheckFile.event/modified')
            .then(function (data) {
                $scope.last_file_changed = (data.data != "") ? data.data.path : "(no data)";
        }, printError);
        
        genericReq.request('GET', '/api/wazuh-elastic/last/'+$scope.defaultManager+'/SyscheckFile/SyscheckFile.event/added')
        .then(function (data) {
                $scope.last_file_added = (data.data != "") ? data.data.path : "(no data)";
        }, printError);
        
        genericReq.request('GET', '/api/wazuh-elastic/last/'+$scope.defaultManager+'/SyscheckFile/SyscheckFile.event/deleted')
        .then(function (data) {
                $scope.last_file_deleted = (data.data != "") ? data.data.path : "(no data)";
        }, printError);

    };

    //Load
    try {
        load_tops();
    } catch (e) {
        $mdToast.show({
            template: '<md-toast> Unexpected exception loading controller </md-toast>',
            position: 'bottom left',
            hideDelay: 5000,
        });
        errlog.log('Unexpected exception loading controller', e);
    }

});


app.controller('overviewPMController', function ($scope, DataFactory, genericReq, $mdToast, errlog) {
    //Initialisation
    $scope.load = true;
    $scope.$parent.state.setOverviewState('pm');
	$scope.defaultManager = $scope.$parent.state.getDefaultManager().name;

    //Print Error
    var printError = function (error) {
        $mdToast.show({
            template: '<md-toast>' + error.html + '</md-toast>',
            position: 'bottom left',
            hideDelay: 5000,
        });
    };



    var load_tops = function () {
            
        // Last fields

        genericReq.request('GET', '/api/wazuh-elastic/last/'+$scope.defaultManager+'/title/location/rootcheck')
            .then(function (data) {
                $scope.lastEventTitle = (data.data != "") ? data.data : "(no data)";
        }, printError);
		
		genericReq.request('GET', '/api/wazuh-elastic/last/'+$scope.defaultManager+'/AgentName/location/rootcheck')
            .then(function (data) {
                $scope.lastEventAgentName = (data.data != "") ? data.data : "(no data)";
        }, printError);
		
		genericReq.request('GET', '/api/wazuh-elastic/last/'+$scope.defaultManager+'/AgentID/location/rootcheck')
            .then(function (data) {
                $scope.lastEventAgentID = (data.data != "") ? data.data : "";
        }, printError);
		
		genericReq.request('GET', '/api/wazuh-elastic/last/'+$scope.defaultManager+'/AgentIP/location/rootcheck')
            .then(function (data) {
                $scope.lastEventAgentIP = (data.data != "") ? data.data : "";
        }, printError);

    };

    //Load
    try {
        load_tops();
    } catch (e) {
        $mdToast.show({
            template: '<md-toast> Unexpected exception loading controller </md-toast>',
            position: 'bottom left',
            hideDelay: 5000,
        });
        errlog.log('Unexpected exception loading controller', e);
    }


});
