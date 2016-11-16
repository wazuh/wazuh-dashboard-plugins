var app = require('ui/modules').get('app/wazuh', []);

app.controller('overviewGeneralController', function ($scope, DataFactory, genericReq, $mdToast, errlog) {
    //Initialisation
    $scope.load = true;
    $scope.$parent.state.setOverviewState('general');
	$scope.defaultManager = $scope.$parent.state.getDefaultManager().name;
    $scope.stats = [];

    //Print Error
    var printError = function (error) {
        $mdToast.show({
            template: '<md-toast>' + error.html + '</md-toast>',
            position: 'bottom left',
            hideDelay: 5000,
        });
    };

    //Functions
    $scope.setTimer = function (time) {
        $scope.timerFilterValue = time;
    };


    var load_tops = function () {
        var daysAgo = 1;
        if ($scope.timerFilterValue == "24h") {
            daysAgo = 1;
        } else if ($scope.timerFilterValue == "7d") {
            daysAgo = 7;
		} else if ($scope.timerFilterValue == "30d") {
            daysAgo = 30;	
        } else {
            daysAgo = 1;
        }
		
        var date = new Date();
        date.setDate(date.getDate() - daysAgo);
        var timeAgo = date.getTime();
        genericReq.request('GET', '/api/wazuh-elastic/top/'+$scope.defaultManager+'/srcuser/' + timeAgo)
            .then(function (data) {
                $scope.topsrcuser = (data.data != "") ? data.data : "(no data)";
            }, printError);
        genericReq.request('GET', '/api/wazuh-elastic/top/'+$scope.defaultManager+'/srcip/' + timeAgo)
            .then(function (data) {
                $scope.topsrcip = (data.data != "") ? data.data : "(no data)";
            }, printError);
        genericReq.request('GET', '/api/wazuh-elastic/top/'+$scope.defaultManager+'/rule.groups/' + timeAgo)
            .then(function (data) {
                $scope.topgroup = (data.data != "") ? data.data : "(no data)";
            }, printError);
        genericReq.request('GET', '/api/wazuh-elastic/top/'+$scope.defaultManager+'/rule.PCI_DSS/' + timeAgo)
            .then(function (data) {
                $scope.toppci = (data.data != "") ? data.data : "(no data)";
            }, printError);
    };

    //Load
    try {
        $scope.setTimer($scope.$parent.timeFilter);
        load_tops();
    } catch (e) {
        $mdToast.show({
            template: '<md-toast> Unexpected exception loading controller </md-toast>',
            position: 'bottom left',
            hideDelay: 5000,
        });
        errlog.log('Unexpected exception loading controller', e);
    }

    // Timer filter watch
    var loadWatch = $scope.$watch(function () {
        return $scope.$parent.timeFilter;
    }, function () {
        $scope.setTimer($scope.$parent.timeFilter);
        load_tops();
    });


    //Destroy
    $scope.$on("$destroy", function () {
        $scope.stats.length = 0;
        loadWatch();
    });

});


app.controller('overviewFimController', function ($scope, DataFactory, genericReq, $mdToast, errlog) {
    //Initialisation
    $scope.load = true;
    $scope.$parent.state.setOverviewState('fim');
	$scope.defaultManager = $scope.$parent.state.getDefaultManager().name;
    $scope.stats = [];

    //Print Error
    var printError = function (error) {
        $mdToast.show({
            template: '<md-toast>' + error.html + '</md-toast>',
            position: 'bottom left',
            hideDelay: 5000,
        });
    };

    //Functions
    $scope.setTimer = function (time) {
		$scope.timerFilterValue = time;
    };


    var load_tops = function () {
		
        var daysAgo = 1;
        if ($scope.timerFilterValue == "24h") {
            daysAgo = 1;
        } else if ($scope.timerFilterValue == "7d") {
            daysAgo = 7;
		} else if ($scope.timerFilterValue == "30d") {
            daysAgo = 30;	
        } else {
            daysAgo = 1;
        }
		
        var date = new Date();
        date.setDate(date.getDate() - daysAgo);
        var timeAgo = date.getTime();
        
        // Top fields
        genericReq.request('GET', '/api/wazuh-elastic/top/'+$scope.defaultManager+'/AgentName/'+timeAgo)
            .then(function (data) {
                $scope.topagent = (data.data != "") ? data.data : "(no data)";
            }, printError);
        genericReq.request('GET', '/api/wazuh-elastic/top/'+$scope.defaultManager+'/SyscheckFile.perm_before/'+timeAgo)
            .then(function (data) {
                $scope.toppermissions = (data.data != "") ? data.data : "(no data)";
            }, printError);
        genericReq.request('GET', '/api/wazuh-elastic/top/'+$scope.defaultManager+'/rule.PCI_DSS/' + timeAgo)
            .then(function (data) {
                $scope.toppci = (data.data != "") ? data.data : "(no data)";
            }, printError);
		genericReq.request('GET', '/api/wazuh-elastic/top/'+$scope.defaultManager+'/SyscheckFile.path/' + timeAgo + '/location/syscheck')
            .then(function (data) {
                $scope.topfile = (data.data != "") ? data.data : "(no data)";
            }, printError);	
            
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
        $scope.setTimer($scope.$parent.timeFilter);
        load_tops();
    } catch (e) {
        $mdToast.show({
            template: '<md-toast> Unexpected exception loading controller </md-toast>',
            position: 'bottom left',
            hideDelay: 5000,
        });
        errlog.log('Unexpected exception loading controller', e);
    }

    // Timer filter watch
    var loadWatch = $scope.$watch(function () {
        return $scope.$parent.timeFilter;
    }, function () {
        $scope.setTimer($scope.$parent.timeFilter);
        load_tops();
    });

    //Destroy
    $scope.$on("$destroy", function () {
        $scope.stats.length = 0;
        loadWatch();
    });

});


app.controller('overviewPMController', function ($scope, DataFactory, genericReq, $mdToast, errlog) {
    //Initialisation
    $scope.load = true;
    $scope.$parent.state.setOverviewState('pm');
	$scope.defaultManager = $scope.$parent.state.getDefaultManager().name;
    $scope.stats = [];

    //Print Error
    var printError = function (error) {
        $mdToast.show({
            template: '<md-toast>' + error.html + '</md-toast>',
            position: 'bottom left',
            hideDelay: 5000,
        });
    };

    //Functions
    $scope.setTimer = function (time) {
		$scope.timerFilterValue = time;
    };


    var load_tops = function () {
		
        var daysAgo = 1;
        if ($scope.timerFilterValue == "24h") {
            daysAgo = 1;
        } else if ($scope.timerFilterValue == "7d") {
            daysAgo = 7;
		} else if ($scope.timerFilterValue == "30d") {
            daysAgo = 30;	
        } else {
            daysAgo = 1;
        }
		
        var date = new Date();
        date.setDate(date.getDate() - daysAgo);
        var timeAgo = date.getTime();
        
        // Top fields
        genericReq.request('GET', '/api/wazuh-elastic/top/'+$scope.defaultManager+'/AgentName/'+timeAgo)
            .then(function (data) {
                $scope.topagent = data.data;
            }, printError);

            
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
	    $scope.setTimer($scope.$parent.timeFilter);
        load_tops();
    } catch (e) {
        $mdToast.show({
            template: '<md-toast> Unexpected exception loading controller </md-toast>',
            position: 'bottom left',
            hideDelay: 5000,
        });
        errlog.log('Unexpected exception loading controller', e);
    }

    // Timer filter watch
    var loadWatch = $scope.$watch(function () {
        return $scope.$parent.timeFilter;
    }, function () {
        $scope.setTimer($scope.$parent.timeFilter);
        load_tops();
    });

    //Destroy
    $scope.$on("$destroy", function () {
        $scope.stats.length = 0;
        loadWatch();
    });

});
