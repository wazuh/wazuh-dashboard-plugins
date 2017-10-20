import chrome from 'ui/chrome';
require('ui/modules').get('app/wazuh', [])
    .service('testAPI', function ($q, $http) {
        return {
            check_stored: function () {
                var defered = $q.defer();
                $http.get(chrome.addBasePath("/api/wazuh-api/checkAPI")).then(function successCallback(response) {
                    if (response.error) {
                        defered.reject(response);
                    } else {
                        defered.resolve(response);
                    }
                }, function errorCallback(response) {
                    if (response.error) {
                        defered.reject(response);
                    }
                });
                return defered.promise;
            },
			check: function (data) {
                var defered = $q.defer();
                $http.post(chrome.addBasePath("/api/wazuh-api/checkAPI"), data).then(function successCallback(response) {
                    if (response.error) {
                        defered.reject(response);
                    } else {
                        defered.resolve(response);
                    }
                }, function errorCallback(response) {
                    if (response.error) {
                        defered.reject(response);
                    }
                });
                return defered.promise;
            }
        };
    });
