// Require App
var app = require('ui/modules').get('app/wazuh', []);
// Require utils
var base64 = require('plugins/wazuh/utils/base64.js');
import chrome from 'ui/chrome';

app.controller('settingsController', function ($scope, $http, testConnection, appState, Notifier, $routeParams, $location, genericReq) {

	// Initialize
	const notify = new Notifier({location: 'Settings'});
	$scope.formData = {};
	$scope.formData.user = "";
	$scope.formData.password = "";
	$scope.formData.url = "";
	$scope.accept_ssl = true;
	$scope.editConfiguration = true;
	$scope.menuNavItem = 'settings';
	$scope.load = true;
	$scope.currentDefault = 0;
	$scope.extensions = {};
	$scope.extensions.oscap = true;
	$scope.extensions.audit = true;
	$scope.extensions.pci = true;
	$scope.addManagerContainer = false;

	// Tabs

	// Default tab
	$scope.submenuNavItem = "api";

	// URL Tab
	var tab = "";
	var view = "";
    if($routeParams.tab)
		$scope.submenuNavItem  = $routeParams.tab;

	// Watch tab change
	$scope.$watch('submenuNavItem', function() {
		$location.search('tab', $scope.submenuNavItem);
	});

	// Remove API entry
	$scope.removeManager = function(item) {
		var index = $scope.apiEntries.indexOf(item);
		if($scope.apiEntries[index]._source && $scope.apiEntries[index]._source.active == "true" && $scope.apiEntries.length != 1){
			notify.error("Please set another default manager before removing this one");
			return;
		}

        genericReq.request('DELETE', '/api/wazuh-api/apiEntries/'+$scope.apiEntries[index]._id).then(function (data) {
			$scope.apiEntries.splice(index, 1);
		}, function (data, status) {
			notify.error("Could not remove manager");
		});
	}

	// Set manager default
	$scope.setDefault = function(item) {
		var index = $scope.apiEntries.indexOf(item);
        genericReq.request('PUT', '/api/wazuh-api/apiEntries/'+$scope.apiEntries[index]._id).then(function (data) {
				appState.setClusterInfo($scope.apiEntries[index]._source.cluster);
				$scope.apiEntries[$scope.currentDefault]._source.active	= "false";
				$scope.apiEntries[index]._source.active	= "true";
				$scope.currentDefault = index;
				$scope.extensions = $scope.apiEntries[$scope.currentDefault]._source.extensions;
				notify.info("Manager "+$scope.apiEntries[index]._source.cluster_info.manager+" set as default");
		}, function (data, status) {
			notify.error("Could not set that manager as default");
		});
	}

    // Get settings function
    $scope.getSettings = function () {
			genericReq.request('GET', '/api/wazuh-api/apiEntries').then(function (data, status) {
				$scope.apiEntries = data.data;
				angular.forEach($scope.apiEntries, function (value, key) {
					if(value._source && value._source.active == "true"){
						$scope.currentDefault = key;
						if(value._source.extensions){
							$scope.extensions = value._source.extensions;
						}else{
							$scope.extensions.oscap = true;
							$scope.extensions.audit = true;
							$scope.extensions.pci = true;
						}
					}

				});

			},function (data, status) {
				notify.error("Error getting API entries");
			});
    };

    // Save settings function
    $scope.saveSettings = function () {
			var activeStatus = "false";
			if($scope.apiEntries.length == 0)
				activeStatus = "true";

			var tmpData = {
				'user': $scope.formData.user,
				'password': base64.encode($scope.formData.password),
				'url': $scope.formData.url,
				'port': $scope.formData.port,
				'cluster_info': {},
				'insecure': "true",
				'active': activeStatus
			};

        testConnection.check(tmpData).then(function (data) {
            // API Check correct. Get Cluster info
            tmpData.cluster_info = data.data;

            if(activeStatus){
                appState.setClusterInfo(tmpData.clusterInfo);
            }

            tmpData.extensions = {"oscap": true, "audit": true, "pci": true};
            // Insert new API entry
            genericReq.request('PUT', '/api/wazuh-api/settings', tmpData).then(function (data) {
                var newEntry = {
                    '_id': data.data.response._id,
                    _source: {
                        cluster_info: tmpData.cluster_info,
                        active: tmpData.active,
                        url: tmpData.url,
                        api_user: tmpData.user,
                        api_port: tmpData.port
                    }
                };
                $scope.apiEntries.push(newEntry);
                notify.info('Wazuh API successfully added');
                $scope.addManagerContainer = false;
                $scope.formData.user = "";
                $scope.formData.password = "";
                $scope.formData.url = "";
                $scope.formData.port = "";
                // Fetch agents on demand
                genericReq.request('GET', '/api/wazuh-api/fetchAgents').then(function(data){} , function (data, status) {
                notify.error("Error fetching agents");
                });
            }, function (data, status) {
                if (status == '400') {
                    notify.error("Please, fill all the fields in order to connect with Wazuh RESTful API.");
                } else {
                    notify.error("Some error ocurred, could not save data in elasticsearch.");
                }
            });
        }, printError);
    };

	// Check manager connectivity
    $scope.checkManager = function (item) {

		var index = $scope.apiEntries.indexOf(item);
		var tmpData = {
			'user': $scope.apiEntries[$scope.currentDefault]._source.api_user,
			'password': $scope.apiEntries[$scope.currentDefault]._source.api_password,
			'url': $scope.apiEntries[$scope.currentDefault]._source.url,
			'port': $scope.apiEntries[$scope.currentDefault]._source.api_port,
			'insecure': "true"
		};

    testConnection.check(tmpData).then(function (data) {
        tmpData.cluster_info = data;
        var index = $scope.apiEntries.indexOf(item);
        genericReq.request('PUT', '/api/wazuh-api/updateApiHostname/' + $scope.apiEntries[index]._id, {"cluster_info":tmpData.cluster_info}).then(function (data) {
						$scope.apiEntries[index]._source.cluster_info = tmpData.cluster_info;
        });
        notify.info("Connection success");
    }, printError);
    };

    // Process form
    $scope.processForm = function () {
			$scope.messageError = "";
	    // Test and Save if OK
			$scope.saveSettings();
    };

	// Toggle extension
	$scope.toggleExtension = function(extension,state) {
		if(extension == "oscap" || extension == "audit" || extension == "pci"){
            genericReq.request('PUT', '/api/wazuh-api/extension/toggle/'+$scope.apiEntries[$scope.currentDefault]._id + '/' + extension + '/' + state)
				.then(function(){},
				function (data, status) {
					notify.error("Invalid request when toggle extension state.");
				});
		}
	};

    var printError = function (data) {
        var text;
        switch (data.data) {
            case 'no_elasticsearch':
                text = 'Could not connect with elasticsearch in order to retrieve the credentials.';
                break;
            case 'no_credentials':
                text = 'Valid credentials not found in elasticsearch. It seems the credentials were not saved.';
                break;
            case 'protocol_error':
                text = 'Invalid protocol in the API url. Please, specify <b>http://</b> or <b>https://</b>.';
                break;
            case 'unauthorized':
                text = 'Credentials were found, but they are not valid.';
                break;
            case 'bad_url':
                text = 'The given URL does not contain a valid Wazuh RESTful API installation.';
                break;
            case 'self_signed':
                text = 'The request to Wazuh RESTful API was blocked, because it is using a selfsigned SSL certificate. Please, enable <b>"Accept selfsigned SSL"</b> option if you want to connect anyway.';
                break;
            case 'not_running':
                text = 'There are not services running in the given URL.';
                break;
            default:
                text = 'Unexpected error. '+data.message;
        }
        notify.error(text);
		$scope.messageError = text;
    };

	$scope.getAppInfo = function () {
		$http.get("/api/wazuh-elastic/setup").then(function (data, status) {
			$scope.appInfo = {};
			$scope.appInfo["app-version"] = data.data["app-version"];
			$scope.appInfo["installationDate"] = data.data["installationDate"];
			$scope.appInfo["revision"] = data.data["revision"];
		}).catch(function (data, status) {
			notify.error("Error when loading Wazuh setup info");
		})
	}

	// Loading data
	$scope.getSettings();
	$scope.getAppInfo();

});
