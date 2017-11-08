// Require utils
let base64 = require('plugins/wazuh/utils/base64.js');
import chrome from 'ui/chrome';

// Require App
let app = require('ui/modules')
.get('app/wazuh', [])
.controller('settingsController', 
function ($scope, $rootScope, $http, $routeParams, $location, Notifier, testAPI, appState, genericReq) {
	$rootScope.page = "settings";

	// Initialize
	const notify = new Notifier({ location: 'Settings' });
	$scope.formData          = {};
	$scope.formData.user     = "";
	$scope.formData.password = "";
	$scope.formData.url      = "";
	$scope.accept_ssl        = true;
	$scope.editConfiguration = true;
	$scope.menuNavItem       = 'settings';
	$scope.load              = true;
	$scope.currentDefault    = 0;
	$scope.extensions = {
		oscap: true,
		audit: true,
		pci:   true
	};
	$scope.addManagerContainer = false;
	$scope.submenuNavItem      = "api";

	if ($routeParams.tab){
		$scope.submenuNavItem = $routeParams.tab;
    }

	// Watch tab change
	$scope.$watch('submenuNavItem', () => {
		$location.search('tab', $scope.submenuNavItem);
	});

	// Remove API entry
	$scope.removeManager = (item) => {
		let index = $scope.apiEntries.indexOf(item);
        
        if ($scope.apiEntries[index]._source && 
            $scope.apiEntries[index]._source.active === "true" && 
            $scope.apiEntries.length !== 1) {
			notify.error("Please set another default manager before removing this one");
			return;
		}

        let tmpUrl = `/api/wazuh-api/apiEntries/${$scope.apiEntries[index]._id}`;
        genericReq.request('DELETE', tmpUrl)
        .then(() => {
			$scope.apiEntries.splice(index, 1);
        })
        .catch(() => {
			notify.error("Could not remove manager");
		});
	};

	// Set manager default
	$scope.setDefault = (item) => {
        let index = $scope.apiEntries.indexOf(item);
        
        let tmpUrl = `/api/wazuh-api/apiEntries/${$scope.apiEntries[index]._id}`;
        genericReq.request('PUT', tmpUrl)
        .then(() => {
			appState.setClusterInfo($scope.apiEntries[index]._source.cluster);
			$scope.apiEntries[$scope.currentDefault]._source.active = 'false';
			$scope.apiEntries[index]._source.active = 'true';
			$scope.currentDefault = index;
			$scope.extensions = $scope.apiEntries[$scope.currentDefault]._source.extensions;
            notify.info(`Manager ${$scope.apiEntries[index]._source.cluster_info.manager}` + 
                        ` set as default`);
        })
        .catch(() => {
			notify.error("Could not set that manager as default");
		});
	};

	// Get settings function
	$scope.getSettings = () => {
        genericReq.request('GET', '/api/wazuh-api/apiEntries')
        .then((data) => {
			$scope.apiEntries = data.data.length > 0 ? data.data : [];
			angular.forEach($scope.apiEntries, (value, key) => {
				if (value._source && value._source.active === 'true') {
					$scope.currentDefault = key;
					if (value._source.extensions) {
						$scope.extensions = value._source.extensions;
					} else {
						$scope.extensions.oscap = true;
						$scope.extensions.audit = true;
						$scope.extensions.pci   = true;
					}
				}
			});
        })
        .catch(() => {
			notify.error("Error getting API entries");
		});
	};

	// Save settings function
	$scope.saveSettings = () => {
		let activeStatus = ($scope.apiEntries.length === 0) ? 'true' : 'false';

		let tmpData = {
			'user':         $scope.formData.user,
			'password':     base64.encode($scope.formData.password),
			'url':          $scope.formData.url,
			'port':         $scope.formData.port,
			'cluster_info': {},
			'insecure':     'true',
			'active':       activeStatus,
			'id':           $scope.apiEntries.length
		};

        testAPI.check(tmpData)
        .then((data) => {
			// API Check correct. Get Cluster info
			tmpData.cluster_info = data.data;
			if (activeStatus) {
				appState.setClusterInfo(tmpData.cluster_info);
			}

			tmpData.extensions = {
				"oscap": true,
				"audit": true,
				"pci":   true
			};

			// Insert new API entry
            genericReq.request('PUT', '/api/wazuh-api/settings', tmpData)
            .then((data) => {
				let newEntry = {
					_id: data.data.response._id,
					_source: {
						cluster_info: tmpData.cluster_info,
						active:       tmpData.active,
						url:          tmpData.url,
						api_user:     tmpData.user,
						api_port:     tmpData.port
					}
				};
				$scope.apiEntries.push(newEntry);
				notify.info('Wazuh API successfully added');
				$scope.addManagerContainer = false;
				$scope.formData.user       = "";
				$scope.formData.password   = "";
				$scope.formData.url        = "";
				$scope.formData.port       = "";
				// Fetch agents on demand

                genericReq.request('GET', '/api/wazuh-api/fetchAgents')
                .then(() => {})
                .catch(() => {
					notify.error("Error fetching agents");
				});
            })
            .catch((error, status) => {
				if (status === '400') {
                    notify.error("Please, fill all the fields in order to connect " + 
                                "with Wazuh RESTful API.");
				} else {
					notify.error("Some error ocurred, could not save data in elasticsearch.");
				}
			});
        })
        .catch((error) => printError(error));
	};

	// Check manager connectivity
	$scope.checkManager = (item) => {
		var tmpData = {
			'user':     $scope.apiEntries[$scope.currentDefault]._source.api_user,
			'password': $scope.apiEntries[$scope.currentDefault]._source.api_password,
			'url':      $scope.apiEntries[$scope.currentDefault]._source.url,
			'port':     $scope.apiEntries[$scope.currentDefault]._source.api_port,
			'insecure': "true"
		};
        testAPI.check(tmpData)
        .then((data) => {
			tmpData.cluster_info = data.data;
            let index  = $scope.apiEntries.indexOf(item);
            let tmpUrl = `/api/wazuh-api/updateApiHostname/${$scope.apiEntries[index]._id}`;
			genericReq.request('PUT',tmpUrl , { "cluster_info": tmpData.cluster_info })
            .then(() => {
				$scope.apiEntries[index]._source.cluster_info = tmpData.cluster_info;
			});
			notify.info("Connection success");
        })
        .catch((error) => printError(error));
	};

	// Process form
	$scope.processForm = () => {
		$scope.messageError = "";
		$scope.saveSettings();
	};

	// Toggle extension
	$scope.toggleExtension = (extension, state) => {
		if (['oscap','audit','pci'].includes(extension)) {
            let tmpUrl = `/api/wazuh-api/extension/toggle/` + 
                        `${$scope.apiEntries[$scope.currentDefault]._id}/` + 
                        `${extension}/${state}`;

            genericReq.request('PUT', tmpUrl)
            .then(() => {})
            .catch(() => {
                notify.error("Invalid request when toggle extension state.");
            });
		}
	};

	const printError = (error) => {
		let text;
		switch (error.data) {
			case 'no_elasticsearch':
				text = 'Could not connect with elasticsearch in order to retrieve the credentials.';
				break;
			case 'no_credentials':
                text = 'Valid credentials not found in elasticsearch. It seems the credentials ' + 
                       'were not saved.';
				break;
			case 'protocol_error':
                text = 'Invalid protocol in the API url. Please, specify <b>http://</b> or ' + 
                       '<b>https://</b>.';
				break;
			case 'unauthorized':
				text = 'Credentials were found, but they are not valid.';
				break;
			case 'bad_url':
				text = 'The given URL does not contain a valid Wazuh RESTful API installation.';
				break;
			case 'self_signed':
                text = 'The request to Wazuh RESTful API was blocked, because it is using a ' + 
                       'selfsigned SSL certificate. Please, enable <b>"Accept selfsigned SSL"</b> ' + 
                       'option if you want to connect anyway.';
				break;
			case 'not_running':
				text = 'There are not services running in the given URL.';
				break;
			default:
				text = `Unexpected error. ${error.message}`;
		}
		notify.error(text);
		$scope.messageError = text;
	};

	$scope.getAppInfo = () => {
        $http.get("/api/wazuh-elastic/setup")
        .then((data) => {
			$scope.appInfo = {};
			$scope.appInfo["app-version"]      = data.data.data["app-version"];
			$scope.appInfo["installationDate"] = data.data.data["installationDate"];
			$scope.appInfo["revision"]         = data.data.data["revision"];
        })
        .catch(() => {
			notify.error("Error when loading Wazuh setup info");
		});
	};

	// Loading data
	$scope.getSettings();
	$scope.getAppInfo();
});