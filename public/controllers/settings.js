// Require App
var app = require('ui/modules').get('app/wazuh', []);
// Require utils
var base64 = require('plugins/wazuh/utils/base64.js');

app.controller('settingsController', function ($scope, $http, $q, testConnection, alertify) {

    $scope.formData = {};
    $scope.formData.user = "";
    $scope.formData.password = "";
    $scope.formData.url = "";
    $scope.formData.insecure = true;
    $scope.editConfiguration = true;

    testConnection.test()
        .then(function (data) {
            $scope.editConfiguration = false;
        });

    // Save settings function
    $scope.saveSettings = function (test) {
        var data = {
            'api_user': $scope.formData.user,
            'api_password': base64.encode($scope.formData.password),
            'api_url': $scope.formData.url,
            'insecure': $scope.formData.insecure
        };

        $http.put("/api/wazuh-api/settings", data).success(function (data, status) {
            if (test) {
                makeTest();
            }
        }).error(function (data, status) {
            if (status == '400') {
                alertify.delay(5000).closeLogOnClick(true).error("Please, fill all the fields in order to connect with Wazuh RESTful API.");
            } else {
                alertify.delay(5000).closeLogOnClick(true).error("Some error ocurred, could not save data in elasticsearch.");
            }
        })
    };

    // Test connection function
    function testSaveConnection() {
        $scope.saveSettings(true);
    };

    // Process form
    $scope.processForm = function () {
        // Test and Save
        testSaveConnection();
    };

    var makeTest = function () {
        testConnection.test()
            .then(function (data) {
                $scope.editConfiguration = false;
                alertify.delay(5000).closeLogOnClick(true).success('<b>Successfully connected!</b>');
            }, printTest);
    };

    var printTest = function (data) {
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
                text = 'The given URL does not contains a valid Wazuh RESTful API installation.';
                break;
            case 'self_signed':
                text = 'The request to Wazuh RESTful API was blocked, because it is using a selfsigned SSL certificate. Please, enable <b>"Accept selfsigned SSL"</b> option if you want to connect anyway.';
                break;
            case 'not_running':
                text = 'There are not services running in the given URL.';
                break;
            default:
                text = 'Unexpected error. Please, report this to the Wazuh Team.';
        }
        alertify.delay(5000).closeLogOnClick(true).error(text);
    };

});



