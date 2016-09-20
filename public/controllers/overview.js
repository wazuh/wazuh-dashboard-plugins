var app = require('ui/modules').get('app/wazuh', []);

app.controller('overviewGeneralController', function ($scope, DataFactory, genericReq, $mdToast, errlog) {
    //Initialisation
    $scope.load = true;
    $scope.$parent.state.setOverviewState('general');
    $scope.timeFilter = "24h";

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
        if (time == "24h") {
            $scope.timerFilterValue = "24h";
        } else if (time == "48h") {
            $scope.timerFilterValue = "48h";
        } else {
            $scope.timerFilterValue = "7d";
        }
    };


    var load_tops = function () {
        var daysAgo = 1;
        if ($scope.timerFilterValue == "7d") {
            var daysAgo = 7;
        } else if ($scope.timerFilterValue == "48h") {
            var daysAgo = 2;
        } else {
            var daysAgo = 1;
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
    $scope.timeFilter = "24h";

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
        if (time == "24h") {
            $scope.timerFilterValue = "24h";
        } else if (time == "48h") {
            $scope.timerFilterValue = "48h";
        } else {
            $scope.timerFilterValue = "7d";
        }
    };


    var load_tops = function () {
        var daysAgo = 1;
        if ($scope.timerFilterValue == "7d") {
            var daysAgo = 7;
        } else if ($scope.timerFilterValue == "48h") {
            var daysAgo = 2;
        } else {
            var daysAgo = 1;
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
