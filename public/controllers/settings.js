// Require App
var app = require('ui/modules').get('app/wazuh', []);
// Require utils
var base64 = require('plugins/wazuh/utils/base64.js');

app.controller('settingsController', function ($scope, $http, testConnection, $mdToast) {

    $scope.formData = {};
    $scope.formData.user = "";
    $scope.formData.password = "";
    $scope.formData.url = "";
    $scope.accept_ssl = true;
    $scope.editConfiguration = true;
    $scope.menuNavItem = 'settings';
	$scope.load = true;
	
	// Remove API entry
	
	$scope.removeManager = function(item) {
		var index = $scope.apiEntries.indexOf(item);
		console.log($scope.apiEntries[index]);
		
		$http.delete("/api/wazuh-api/apiEntries/"+$scope.apiEntries[index]._id).success(function (data, status) {
			$scope.apiEntries.splice(index, 1);   
		}).error(function (data, status) {
			$mdToast.show($mdToast.simple().textContent("Could not remove manager"));
		})
			
	    
	}

    // Get settings function
    $scope.getSettings = function () {
			$http.get("/api/wazuh-api/apiEntries").success(function (data, status) {
				$scope.apiEntries = data;
				console.log(data);
			}).error(function (data, status) {
				$mdToast.show($mdToast.simple().textContent("Error getting API entries"));
			})
    };

	$scope.getSettings();
	

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
			'insecure': "true",
			'active': activeStatus
		};

       // testConnection.test_tmp(tmpData).then(function (data) {
			
			$http.put("/api/wazuh-api/settings", tmpData).success(function (data, status) {
				console.log(data);
				var newEntry = {'_id': data.response._id, _source: { active: tmpData.active, url: tmpData.url, api_user: tmpData.user, api_port: tmpData.port } };
				$scope.apiEntries.push(newEntry);
				$mdToast.show($mdToast.simple().textContent('Successfully added'));
				$scope.addManagerContainer = false;
				$scope.formData.user = "";
				$scope.formData.password = "";
				$scope.formData.url = "";
				$scope.formData.port = "";
			}).error(function (data, status) {
				if (status == '400') {
					$mdToast.show($mdToast.simple().textContent("Please, fill all the fields in order to connect with Wazuh RESTful API."));
				} else {
					$mdToast.show($mdToast.simple().textContent("Some error ocurred, could not save data in elasticsearch."));
				}
			})
		//}, printTest);
    };


    // Process form
    $scope.processForm = function () {
        // Test and Save if OK
		$scope.saveSettings();
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
        $mdToast.show($mdToast.simple().textContent(text));
    };

});



