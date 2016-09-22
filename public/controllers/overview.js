var app = require('ui/modules').get('app/wazuh', []);

app.controller('overviewGeneralController', function ($scope, DataFactory, genericReq, $mdToast, errlog) {
    //Initialisation
    $scope.load = true;
    $scope.$parent.state.setOverviewState('general');

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
        genericReq.request('GET', '/api/wazuh-elastic/top/srcuser/' + timeAgo)
            .then(function (data) {
                $scope.topsrcuser = data.data;
            }, printError);
        genericReq.request('GET', '/api/wazuh-elastic/top/srcip/' + timeAgo)
            .then(function (data) {
                $scope.topsrcip = data.data;
            }, printError);
        genericReq.request('GET', '/api/wazuh-elastic/top/rule.groups/' + timeAgo)
            .then(function (data) {
                $scope.topgroup = data.data;
            }, printError);
        genericReq.request('GET', '/api/wazuh-elastic/top/rule.PCI_DSS/' + timeAgo)
            .then(function (data) {
                $scope.toppci = data.data;
            }, printError);
    };

    var load = function () {

    };

    //Load
    try {
        load();
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
	$scope.setTimer($scope.$parent.timeFilter);
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
        genericReq.request('GET', '/api/wazuh-elastic/top/AgentName/'+timeAgo)
            .then(function (data) {
                $scope.topagent = data.data;
            }, printError);
        genericReq.request('GET', '/api/wazuh-elastic/top/SyscheckFile.perm_before/'+timeAgo)
            .then(function (data) {
                $scope.toppermissions = data.data;
            }, printError);
        genericReq.request('GET', '/api/wazuh-elastic/top/rule.PCI_DSS/' + timeAgo)
            .then(function (data) {
                $scope.toppci = data.data;
            }, printError);
		genericReq.request('GET', '/api/wazuh-elastic/top/SyscheckFile.path/' + timeAgo + '/location/syscheck')
            .then(function (data) {
                $scope.topfile = data.data;
            }, printError);	
            
        // Last fields

        genericReq.request('GET', '/api/wazuh-elastic/last/SyscheckFile/SyscheckFile.event/modified')
            .then(function (data) {
            if(data.data != "")
                $scope.last_file_changed = (data.data != "") ? data.data.path : "(no data)";
        }, printError);
        
        genericReq.request('GET', '/api/wazuh-elastic/last/SyscheckFile/SyscheckFile.event/addded')
        .then(function (data) {
                $scope.last_file_added = (data.data != "") ? data.data.path : "(no data)";
        }, printError);
        
        genericReq.request('GET', '/api/wazuh-elastic/last/SyscheckFile/SyscheckFile.event/deleted')
        .then(function (data) {
            if(data.data != "")
                $scope.last_file_deleted = (data.data != "") ? data.data.path : "(no data)";
        }, printError);

    };

    var load = function () {
    };

    //Load
    try {
        load();
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
	$scope.setTimer($scope.$parent.timeFilter);
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
        genericReq.request('GET', '/api/wazuh-elastic/top/AgentName/'+timeAgo)
            .then(function (data) {
                $scope.topagent = data.data;
            }, printError);

            
        // Last fields

        genericReq.request('GET', '/api/wazuh-elastic/last/title/location/rootcheck')
            .then(function (data) {
            if(data.data != "")
                $scope.lastEventTitle = (data.data != "") ? data.data : "(no data)";
        }, printError);
		
		genericReq.request('GET', '/api/wazuh-elastic/last/AgentName/location/rootcheck')
            .then(function (data) {
            if(data.data != "")
                $scope.lastEventAgentName = (data.data != "") ? data.data : "(no data)";
        }, printError);
		
		genericReq.request('GET', '/api/wazuh-elastic/last/AgentID/location/rootcheck')
            .then(function (data) {
            if(data.data != "")
                $scope.lastEventAgentID = (data.data != "") ? data.data : "(no data)";
        }, printError);
		
		genericReq.request('GET', '/api/wazuh-elastic/last/AgentIP/location/rootcheck')
            .then(function (data) {
            if(data.data != "")
                $scope.lastEventAgentIP = (data.data != "") ? data.data : "";
        }, printError);
        


    };

    var load = function () {
    };

    //Load
    try {
        load();
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
	$scope.setTimer($scope.$parent.timeFilter);
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
