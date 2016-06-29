var base64 = require('plugins/wazuh/utils/base64.js');

exports.getApiCredentials = function ($q, $http) {
    var defered = $q.defer();
    var promise = defered.promise;

    $http.get("/elasticsearch/.kibana/wazuh-configuration/1")
        .success(function (data, status) {
            var api_username = data._source.api_user;
            var api_password = base64.decode(data._source.api_password);
            var api_url = data._source.api_url;
            // Get authorization token
            var authdata = base64.encode(api_username + ':' + api_password);
            defered.resolve([authdata, api_url]);
        })
        .error(function (data, status) {
            defered.reject('Error');
        })
    return promise;
};

exports.existApiCredentials = function ($q, $http) {
    var defered = $q.defer();
    var promise = defered.promise;

    $http.get("/elasticsearch/.kibana/wazuh-configuration/1")
        .success(function (data, status) {
            defered.resolve(true);
        })
        .error(function (data, status) {
            defered.resolve(false);
        })
    return promise;
};