// Require libs
//require('plugins/wazuh/utils/base64.js');

// Settings

// Load settings function
/*
$scope.loadSettings = function () {
    $http.get("/elasticsearch/.kibana/wazuh-configuration/1").success(function(data, status) {
        api_username = data._source.api_user;
        api_password = base64.decode(data._source.api_password);
        api_url = data._source.api_url;
    })
};
$scope.loadSettings*/
// Process settings *DO NOT EDIT*
// *DO NOT EDIT*
// *DO NOT EDIT*


module.exports = { 
    api_username: function (){return api_username},
    api_password: function (){return api_password},
    api_url: function (){return api_url}
};

