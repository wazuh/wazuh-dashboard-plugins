import chrome from 'ui/chrome';
require('ui/modules').get('app/wazuh', [])
    .service('testConnection', function ($q, $http, genericReq) {
        return {
            check_stored: function () {
                var defered = $q.defer();
                var promise = defered.promise;

                genericReq.request("GET", "/api/wazuh-api/check")
                    .then(function (data) {
                        if (data.error) {
                            defered.reject(data);
                        } else {
                            defered.resolve(data);
                        }
                    }, function (data) {
                        defered.reject(data);
                    })

                return promise;
            },
			check: function (data) {
                var defered = $q.defer();
                var promise = defered.promise;
                genericReq.request("POST", "/api/wazuh-api/check", data)
                    .then(function (data) {
                        if (data.error) {
                            defered.reject(data);
                        } else {
                            defered.resolve(data);
                        }
                    }, function (data) {
                        defered.reject(data);
                    })

                return promise;
            }
        };
    });
