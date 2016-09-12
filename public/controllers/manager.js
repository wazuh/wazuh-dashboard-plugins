// Require utils
var kuf = require('plugins/wazuh/utils/kibanaUrlFormatter.js');
// Require config
var app = require('ui/modules').get('app/wazuh', []);

app.controller('managerController', function ($scope, DataFactory, genericReq, tabProvider, $mdDialog, $mdToast) {
    //Initialisation
    $scope.load = true;
    $scope.menuNavItem = 'manager';
    $scope.submenuNavItem = 'general';
	$scope.timerFilterString = "Last 24 hours";
	$scope.timerFilterValue = "24h";
	
    $scope.stats = [];
    $scope.stats['/top/agent'] = '-';
    $scope.stats['/overview/alerts'] = { "alerts": 0, "ip": "-", "group": "-" };
    $scope.stats['/overview/fim'] = { "alerts": 0, "agent": "-", "file": "-" };

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

    //Functions
				
    $scope.start = function () {
        $mdToast.show({
            template: '<md-toast>Starting manager...</md-toast>',
            position: 'bottom left',
            hideDelay: 5000,
        });
        DataFactory.getAndClean('put', '/manager/start', {})
            .then(function (data) {
                load();
                $mdToast.show({
                    template: '<md-toast>Manager started successfully</md-toast>',
                    position: 'bottom left',
                    hideDelay: 5000,
                });
            }, printError);
    };

    $scope.stop = function (ev) {
        var confirm = $mdDialog.confirm()
            .title('Stop manager')
            .textContent('Are you sure you want to stop the manager? You will not receive OSSEC alerts while the manager remains stopped.')
            .targetEvent(ev)
            .ok('Stop')
            .cancel('Cancel');

        $mdDialog.show(confirm).then(function () {
            $mdToast.show({
                template: '<md-toast>Stopping manager...</md-toast>',
                position: 'bottom left',
                hideDelay: 5000,
            });
            DataFactory.getAndClean('put', '/manager/stop', {})
                .then(function (data) {
                    load();
                    $mdToast.show({
                        template: '<md-toast>Manager stopped successfully</md-toast>',
                        position: 'bottom left',
                        hideDelay: 5000,
                    });
                }, printError);
        });
    };

    $scope.restart = function (ev) {
        var confirm = $mdDialog.confirm()
            .title('Stop manager')
            .textContent('Do you want to restart the manager? You will not receive OSSEC alerts while the manager is restarting.')
            .targetEvent(ev)
            .ok('Restart')
            .cancel('Cancel');

        $mdDialog.show(confirm).then(function () {
            $mdToast.show({
                template: '<md-toast>Restarting manager...</md-toast>',
                position: 'bottom left',
                hideDelay: 5000,
            });
            DataFactory.getAndClean('put', '/manager/restart', {})
                .then(function (data) {
                    load();
                    $mdToast.show({
                        template: '<md-toast>Manager restarted successfully</md-toast>',
                        position: 'bottom left',
                        hideDelay: 5000,
                    });
                }, printError);
        });
    };
	
	
	$scope.setTimer = function (time) {
        if(time == "24h"){
			$scope.timerFilterString = "Last 24 hours";
			$scope.timerFilterValue = "24h";
		}else if(time == "48h"){
			$scope.timerFilterString = "Last 48 hours";
			$scope.timerFilterValue = "48h";
		}else{
			$scope.timerFilterString = "Last 7 days";
			$scope.timerFilterValue = "7d";
		}
    };


	var load_tops = function () { 
		$scope.topsrcuser = "";
		$scope.topsrcip = "";
		$scope.topgroup = "";
		$scope.toppci = "";
		genericReq.request('GET', '/api/wazuh-elastic/top/srcuser')
                .then(function (data) {
                    $scope.topsrcuser = data.data;
                }, printError);
		genericReq.request('GET', '/api/wazuh-elastic/top/srcip')
                .then(function (data) {
                    $scope.topsrcip = data.data;
                }, printError);
		genericReq.request('GET', '/api/wazuh-elastic/top/rule.groups')
                .then(function (data) {
                    $scope.topgroup = data.data;
                }, printError);
		genericReq.request('GET', '/api/wazuh-elastic/top/rule.PCI_DSS')
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

    //Destroy
    $scope.$on("$destroy", function () {
        //angular.forEach(objectsArray, DataFactory.clean(value));
        tabProvider.clean($scope.pageId);
        $scope.stats.length = 0;
    });

});

app.controller('managerConfigurationController', function ($scope, DataFactory, tabProvider) {
    //Initialisation
    $scope.load = true;
    $scope.menuNavItem = 'manager';
    $scope.submenuNavItem = 'configuration';

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

	$scope.getDaemonStatusClass = function (daemonStatus) {
        if (daemonStatus == "running")
            return "status green"
        else if (daemonStatus == "stopped")
            return "status red";
        else
            return "status red";
    };
	
    //Functions
    var parseConfiguration = function () {
        if ($scope.managerConfiguration.rules.decoder) {
            if (angular.isString($scope.managerConfiguration.rules.decoder)) { $scope.managerConfiguration.rules.decoder = [$scope.managerConfiguration.rules.decoder] }
        }
        if ($scope.managerConfiguration.rules.rule_dir) {
            if (angular.isString($scope.managerConfiguration.rules.rule_dir)) { $scope.managerConfiguration.rules.rule_dir = [$scope.managerConfiguration.rules.rule_dir] }
        }
        if ($scope.managerConfiguration.rules.list) {
            if (angular.isString($scope.managerConfiguration.rules.list)) { $scope.managerConfiguration.rules.list = [$scope.managerConfiguration.rules.list] }
        }
        if ($scope.managerConfiguration.rootcheck.system_audit) {
            if (angular.isString($scope.managerConfiguration.rootcheck.system_audit)) { $scope.managerConfiguration.rootcheck.system_audit = [$scope.managerConfiguration.rootcheck.system_audit] }
        }
    };

	    $scope.getDaemonTooltip = function (daemon) {
        var output = '';
        switch (daemon) {
            case 'ossec-monitord':
                output = '<span style="width: 200px; display: inline-block; text-align: left;">Monitors agent connectivity and compress daily log files.</span>';
                break;
            case 'ossec-logcollector':
                output = '<span style="width: 200px; display: inline-block; text-align: left;">Monitors configured files and commands for new log messages.</span>';
                break;
            case 'ossec-remoted':
                output = '<span style="width: 200px; display: inline-block; text-align: left;">The server side daemon that communicates with the agents.</span>';
                break;
            case 'ossec-syscheckd':
                output = '<span style="width: 200px; display: inline-block; text-align: left;">Checks configured files for changes to the checksums, permissions or ownership.</span>';
                break;
            case 'ossec-analysisd':
                output = '<span style="width: 200px; display: inline-block; text-align: left;">Receives the log messages and compares them to the rules. It will create alerts when a log message matches an applicable rule.</span>';
                break;
            case 'ossec-maild':
                output = '<span style="width: 200px; display: inline-block; text-align: left;">Sends OSSEC alerts via email. Is started by ossec-control when email alerts are configured.</span>';
                break;
            case 'ossec-execd':
                output = '<span style="width: 200px; display: inline-block; text-align: left;">Executes active responses by running the configured scripts.</span>';
                break;
            case 'wazuh-moduled':
                output = '<span style="width: 200px; display: inline-block; text-align: left;">Is on charge of load different Wazuh modules outside of OSSEC code.</span>';
                break;
            default:
                output = '<span style="width: 200px; display: inline-block; text-align: left;">Not description found for this daemon</span>';
                break;
        }
        return output;
    };
	
	
	
    var load = function () {
		DataFactory.getAndClean('get', '/manager/status', {})
            .then(function (data) {
				$scope.daemons = data.data;
				DataFactory.getAndClean('get', '/manager/configuration', {})
					.then(function (data) {
						$scope.managerConfiguration = data.data;
						parseConfiguration();
						$scope.load = false;
					}, printError);
			}, printError);
    };

    //Load
    load();

    //Destroy
    $scope.$on("$destroy", function () {
        //angular.forEach(objectsArray, DataFactory.clean(value));
        tabProvider.clean($scope.pageId);
    });

});