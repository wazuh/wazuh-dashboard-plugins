import chrome from 'ui/chrome';
require('ui/modules').get('app/wazuh', [])
    .service('testConnection', function ($q, $http) {
        return {
            check_stored: function () {
                var defered = $q.defer();
                var promise = defered.promise;
                $http.get(chrome.addBasePath("/api/wazuh-api/check"))
                    .success(function (data) {
                        if (data.error) {
                            defered.reject(data);
                        } else {
                            defered.resolve(data);
                        }
                    }).error(function (data) {
                        defered.reject(data);
                    })

                return promise;
            },
			check: function (data) {
                var defered = $q.defer();
                var promise = defered.promise;
                $http.post(chrome.addBasePath("/api/wazuh-api/check"), data)
                    .success(function (data) {
                        if (data.error) {
                            defered.reject(data);
                        } else {
                            defered.resolve(data);
                        }
                    }).error(function (data) {
                        defered.reject(data);
                    })

                return promise;
            }
        };
    });
