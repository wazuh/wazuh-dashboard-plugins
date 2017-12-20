// Require utils
let base64 = require('plugins/wazuh/utils/base64.js');
import chrome from 'ui/chrome';

// Require App
let app = require('ui/modules').get('app/wazuh', []).controller('settingsController', function ($scope, $rootScope, $http, $routeParams, $route, $location, Notifier, testAPI, appState, genericReq, courier) {
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
    $scope.extensions = {
        oscap: true,
        audit: true,
        pci:   true
    };
    $scope.addManagerContainer = false;
    $scope.submenuNavItem      = "api";

    // Getting the index pattern list into the scope
    $scope.indexPatterns = $route.current.locals.ip
    
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

        if (appState.getCurrentAPI() !== undefined && appState.getCurrentAPI() !== null) {
            if ($scope.apiEntries[index]._id === JSON.parse(appState.getCurrentAPI()).id) { // We are trying to remove the one selected as default
                notify.warning("Please remove another API.");
                return;
            }
        }

        genericReq.request('DELETE', `/api/wazuh-api/apiEntries/${$scope.apiEntries[index]._id}`)
        .then(() => {
            $scope.apiEntries.splice(index, 1);
        })
        .catch(() => {
            notify.error("Could not remove manager");
        });
    };

    // Set default API
    $scope.setDefault = (item) => {
        let index = $scope.apiEntries.indexOf(item);

        genericReq.request('PUT', `/api/wazuh-api/apiEntries/${$scope.apiEntries[index]._id}`)
        .then(() => {
            appState.setClusterInfo($scope.apiEntries[index]._source.cluster_info);
            if ($scope.apiEntries[index]._source.cluster_info.status == 'disabled')
                appState.setCurrentAPI(JSON.stringify({name: $scope.apiEntries[index]._source.cluster_info.manager, id: $scope.apiEntries[index]._id }));
            else 
                appState.setCurrentAPI(JSON.stringify({name: $scope.apiEntries[index]._source.cluster_info.cluster, id: $scope.apiEntries[index]._id }));

            $scope.$emit('updateAPI', {});

            $scope.currentDefault = JSON.parse(appState.getCurrentAPI()).id;
            $scope.extensions = $scope.apiEntries[index]._source.extensions;
            notify.info(`API ${$scope.apiEntries[index]._source.cluster_info.manager} set as default`);
        })
        .catch((error) => {
            notify.error("Could not set that manager API as default due to " + error);
        });
    };

    // Get settings function
    $scope.getSettings = () => {
        genericReq.request('GET', '/api/wazuh-api/apiEntries')
        .then((data) => {
            $scope.apiEntries = data.data.length > 0 ? data.data : [];
            if (appState.getCurrentAPI() !== undefined && appState.getCurrentAPI() !== null) 
                $scope.currentDefault = JSON.parse(appState.getCurrentAPI()).id;

        })
        .catch(() => {
            notify.error("Error getting API entries");
        });
    };

    // Save settings function
    $scope.saveSettings = () => {

        let tmpData = {
            'user':         $scope.formData.user,
            'password':     base64.encode($scope.formData.password),
            'url':          $scope.formData.url,
            'port':         $scope.formData.port,
            'cluster_info': {},
            'insecure':     'true',
            'id':           $scope.apiEntries.length
        };

        const userRegEx  = new RegExp(/^[a-zA-Z0-9]{3,100}$/);
        const passRegEx  = new RegExp(/^.{3,100}$/); 
        const urlRegEx   = new RegExp(/^https?:\/\/[a-zA-Z0-9]{1,300}$/); 
        const urlRegExIP = new RegExp(/^https?:\/\/[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/); 
        const portRegEx  = new RegExp(/^[0-9]{2,5}$/); 

        // Validate user
        if(!userRegEx.test($scope.formData.user)){
            $scope.messageError = 'Invalid user field';
            return notify.error('Invalid user field');
        }

        // Validate password
        if(!passRegEx.test($scope.formData.password)){
            $scope.messageError = 'Invalid password field';
            return notify.error('Invalid password field');
        }

        // Validate url
        if(!urlRegEx.test($scope.formData.url) && !urlRegExIP.test($scope.formData.url)){
            $scope.messageError = 'Invalid url field';
            return notify.error('Invalid url field');
        }

        // Validate port
        const validatePort = parseInt($scope.formData.port);
        if(!portRegEx.test($scope.formData.port) || validatePort <= 0 || validatePort >= 99999) {
            $scope.messageError = 'Invalid port field';
            return notify.error('Invalid port field');
        }

        testAPI.check(tmpData)
        .then((data) => {
            // API Check correct. Get Cluster info
            tmpData.cluster_info = data.data;

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

                // Setting current API as default if no one is in the cookies
                if (appState.getCurrentAPI() === undefined || appState.getCurrentAPI() === null) { // No cookie

                    if ($scope.apiEntries[$scope.apiEntries.length - 1]._source.cluster_info.status == 'disabled')
                        appState.setCurrentAPI(JSON.stringify({name: $scope.apiEntries[$scope.apiEntries.length - 1]._source.cluster_info.manager, id: $scope.apiEntries[$scope.apiEntries.length - 1]._id }));
                    else 
                        appState.setCurrentAPI(JSON.stringify({name: $scope.apiEntries[$scope.apiEntries.length - 1]._source.cluster_info.cluster, id: $scope.apiEntries[$scope.apiEntries.length - 1]._id }));

                    $scope.$emit('updateAPI', {});
                    $scope.currentDefault = JSON.parse(appState.getCurrentAPI()).id;
                }

                genericReq.request('GET', '/api/wazuh-api/fetchAgents')
                .then(() => {})
                .catch(() => {
                    notify.error("Error fetching agents");
                });
            })
            .catch((error, status) => {
                if (status === '400') notify.error("Please, fill all the fields in order to connect with Wazuh RESTful API.");
                else notify.error("Some error ocurred, could not save data in elasticsearch.");
            });
        })
        .catch(error => printError(error));
    };

    // Check manager connectivity
    $scope.checkManager = (item) => {
        let index = $scope.apiEntries.indexOf(item);

        var tmpData = {
            'user':     $scope.apiEntries[index]._source.api_user,
            'password': $scope.apiEntries[index]._source.api_password,
            'url':      $scope.apiEntries[index]._source.url,
            'port':     $scope.apiEntries[index]._source.api_port,
            'insecure': "true"
        };
        testAPI.check(tmpData)
        .then((data) => {
            tmpData.cluster_info = data.data;

            let tmpUrl = `/api/wazuh-api/updateApiHostname/${$scope.apiEntries[index]._id}`;
            genericReq.request('PUT', tmpUrl , { "cluster_info": tmpData.cluster_info })
            .then(() => {
                $scope.apiEntries[index]._source.cluster_info = tmpData.cluster_info;
            });

            if (tmpData.cluster_info.status == 'disabled')
                appState.setCurrentAPI(JSON.stringify({name: tmpData.cluster_info.manager, id: $scope.apiEntries[index]._id }));
            else 
                appState.setCurrentAPI(JSON.stringify({name: tmpData.cluster_info.cluster, id: $scope.apiEntries[index]._id }));

            $scope.$emit('updateAPI', {});
            $scope.currentDefault = JSON.parse(appState.getCurrentAPI()).id;

            $rootScope.apiIsDown = null;
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
            genericReq.request('PUT', `/api/wazuh-api/extension/toggle/${$scope.apiEntries[$scope.currentDefault]._id}/${extension}/${state}`)
            .then(() => {})
            .catch(() => {
                notify.error("Invalid request when toggle extension state.");
            });
        }
    };

    $scope.changeIndexPattern = (newIndexPattern) => {
        genericReq.request('GET', `/api/wazuh-elastic/updatePattern/${newIndexPattern}`)
        .then((data) => {
            appState.setCurrentPattern(newIndexPattern);

            courier.indexPatterns.get(newIndexPattern)
            .then((data) => {
                let minimum = ["@timestamp", "full_log", "manager.name", "agent.id"];
                let minimumCount = 0;

                for (var i = 0; i < data.fields.length; i++) {
                    if (minimum.includes(data.fields[i].name)) {
                        minimumCount++;
                    }
                }

                if (minimumCount == minimum.length)
                    notify.info("Successfully changed the default index-pattern");
                else notify.warning("The index-pattern was changed, but it is NOT compatible with Wazuh alerts");

                $scope.selectedIndexPattern = newIndexPattern;
            });
        })
        .catch(() => {
            notify.error("Error while changing the default index-pattern");
        });
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
            case 'request_timeout_checkstored':
                text = 'The request to /api/wazuh-api/checkStoredAPI took too long and was aborted.';
                break;
            case 'request_timeout_checkapi':
                text = 'The request to /api/wazuh-api/checkAPI took too long and was aborted.';
                break;
            case 'wrong_credentials':
                text = 'Wrong Wazuh API credentials, please check them and try again';
                break;
            default:
                text = `Unexpected error. ${error.message}`;
        }
        notify.error(text);
        $scope.messageError = text;
    };

    $scope.getAppInfo = () => {
        genericReq.request('GET', '/api/wazuh-elastic/setup')
        .then((data) => {
            $scope.appInfo = {};
            $scope.appInfo["app-version"]      = data.data.data["app-version"];
            $scope.appInfo["installationDate"] = data.data.data["installationDate"];
            $scope.appInfo["revision"]         = data.data.data["revision"];
            $scope.appInfo["index-pattern"]    = data.data.data["index-pattern"];
            $scope.load = false;

            if (appState.getCurrentPattern() !== undefined && appState.getCurrentPattern() !== null) { // There's a pattern in the cookies
                $scope.selectedIndexPattern = appState.getCurrentPattern();
            } else { // There's no pattern in the cookies, pick the one in the settings
                $scope.selectedIndexPattern = data.data.data["index-pattern"];
            }
        })
        .catch(() => {
            notify.error("Error when loading Wazuh setup info");
        });
    };

    // Loading data
    $scope.getSettings();
    $scope.getAppInfo();
});
