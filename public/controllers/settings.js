// Require App
var app = require('ui/modules').get('app/wazuh', []);
// Require utils
var base64 = require('plugins/wazuh/utils/base64.js');

app.controller('settingsController', function ($scope, $http, $q, $sce) {

    $scope.formData = {};

    $scope.formData.user = "";
    // Load settings function
    $scope.loadSettings = function () {
        var defered = $q.defer();
        var promise = defered.promise;
        $http.get("/elasticsearch/.kibana/wazuh-configuration/1").success(function (data, status) {
            $scope.formData.user = data._source.api_user;
            $scope.formData.password = base64.decode(data._source.api_password);
            $scope.formData.url = data._source.api_url;
            defered.resolve(1);
        })
        return promise;
    };

    //Controller first steps...
    $http.get("/elasticsearch/.kibana/wazuh-configuration/1")
        .error(function (data) {
            $scope.messageClass = "settings-message-ok";
            $scope.message = $sce.trustAsHtml("Welcome to Wazuh application for Kibana! Please, set a Wazuh RESTful API URL and valid credentials");
        }).success(function (data) {
            // Call Load settings
            $scope.loadSettings().then(function () {
                var authdata = base64.encode($scope.formData.user + ':' + $scope.formData.password);
                $http.get($scope.formData.url, {
                    headers: {
                        "authorization": "Basic " + authdata,
                        "api-version": 'v1.2'
                    },
                    timeout: 1000
                }).error(function (data, status) {
                    if (status == 401) {
                        $scope.messageClass = "settings-message-error";
                        $scope.message = $sce.trustAsHtml('API could be reached, but provided credentials are not working.');
                    } else {
                        $http.post("/api/wazuh/ssl/verify", {
                            'url': $scope.formData.url
                        })
                            .success(function (data, status) {
                                switch (data.result) {
                                    case 'http':
                                        $scope.messageClass = "settings-message-error";
                                        $scope.message = $sce.trustAsHtml('API couldn\'t be reached with https protocol. Instead it seems to be running with http protocol.');
                                        break;
                                    case 'unauthorized':
                                        $scope.messageClass = "settings-message-error";
                                        $scope.message = $sce.trustAsHtml('API could be reached, but provided credentials are not working.');
                                        break;
                                    case 'not_running':
                                        $scope.messageClass = "settings-message-error";
                                        $scope.message = $sce.trustAsHtml('Timeout exceeded connecting to the API. Is the URL correct?');
                                        break;
                                    case 'self_signed':
                                        $scope.messageClass = "settings-message-error";
                                        $scope.message = $sce.trustAsHtml('Your browser seems to be blocking Wazuh RESTful api, because a <b>selfsigned certificate</b> is being used. Please, <a href="www.wazuh.com" location="_blank">check our docs</a> for more information.');
                                        break;
                                    case 'protocol_error':
                                        $scope.messageClass = "settings-message-error";
                                        $scope.message = $sce.trustAsHtml('Please, specify http or https protocol in the API URL.');
                                        break;                                        
                                    default:
                                        $scope.messageClass = "settings-message-error";
                                        $scope.message = $sce.trustAsHtml('Some error ocurred, API couldn\'t be reached. This error could be for several reasons. Please, <a href="www.wazuh.com" location="_blank">check our docs</a> for more information.');
                                        break;
                                }
                            })
                            .error(function (data, status) {
                                $scope.messageClass = "settings-message-error";
                                $scope.message = $sce.trustAsHtml('Some error ocurred, API couldn\'t be reached. This error could be for several reasons. Please, <a href="www.wazuh.com" location="_blank">check our docs</a> for more information.');
                            })
                    };
                });
            });
        });

    // Unable to connect to the RESTful API, please check the troubleshooting guide: http://documentation.wazuh.oom
    // Save settings function
    $scope.saveSettings = function () {
        //$scope.formData.password = base64.encode($scope.formData.password);
        var data = {
            'api_user': $scope.formData.user,
            'api_password': base64.encode($scope.formData.password),
            'api_url': $scope.formData.url
        };

        $http.put("/elasticsearch/.kibana/wazuh-configuration/1", data).success(function (data, status) {

        }).error(function (data, status) {
            $scope.messageClass = "settings-message-error";
            $scope.message = $sce.trustAsHtml("Some error ocurred, couldn't save data in elasticsearch");
        })
    };

    // Test connection function
    function testSaveConnection() {

        var authdata = base64.encode($scope.formData.user + ':' + $scope.formData.password);
        $http.get($scope.formData.url, {
            headers: {
                "authorization": "Basic " + authdata,
                "api-version": 'v1.2'
            }
        }).success(function (data) {
            $scope.messageClass = "settings-message-ok";
            $scope.message = $sce.trustAsHtml("Connected!");
            $scope.testResult = 1;
            $scope.saveSettings();
        })
            .error(function (data, status) {
                $scope.testResult = 0;
                if (status == 401) {
                    $scope.messageClass = "settings-message-error";
                    $scope.message = $sce.trustAsHtml('API could be reached, but provided credentials are not working.');
                } else {
                    $http.post("/api/wazuh/ssl/verify", {
                        'url': $scope.formData.url
                    })
                        .success(function (data, status) {
                            switch (data.result) {
                                case 'http':
                                    $scope.messageClass = "settings-message-error";
                                    $scope.message = $sce.trustAsHtml('API couldn\'t be reached with https protocol. Instead it seems to be running with http protocol.');
                                    break;
                                case 'unauthorized':
                                    $scope.messageClass = "settings-message-error";
                                    $scope.message = $sce.trustAsHtml('API could be reached, but provided credentials are not working.');
                                    break;
                                case 'not_running':
                                    $scope.messageClass = "settings-message-error";
                                    $scope.message = $sce.trustAsHtml('Timeout exceeded connecting to the API. Is the URL correct?');
                                    break;
                                case 'self_signed':
                                    $scope.messageClass = "settings-message-error";
                                    $scope.message = $sce.trustAsHtml('Your browser seems to be blocking Wazuh RESTful api, because a <b>selfsigned certificate</b> is being used. Please, <a href="www.wazuh.com" location="_blank">check our docs</a> for more information.');
                                    break;
                                case 'protocol_error':
                                    $scope.messageClass = "settings-message-error";
                                    $scope.message = $sce.trustAsHtml('Please, specify http or https protocol in the API URL.');
                                    break;                                        
                                default:
                                    $scope.messageClass = "settings-message-error";
                                    $scope.message = $sce.trustAsHtml('Some error ocurred, API couldn\'t be reached. This error could be for several reasons. Please, <a href="www.wazuh.com" location="_blank">check our docs</a> for more information.');
                                    break;
                            }
                        })
                        .error(function (data, status) {
                            $scope.messageClass = "settings-message-error";
                            $scope.message = $sce.trustAsHtml('Some error ocurred, API couldn\'t be reached. This error could be for several reasons. Please, <a href="www.wazuh.com" location="_blank">check our docs</a> for more information.');
                        })
                };
            });
    };

    // Process form
    $scope.processForm = function () {
        // Test and Save
        testSaveConnection();
    };

});

   

