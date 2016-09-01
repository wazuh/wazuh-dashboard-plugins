require('ui/modules').get('app/wazuh', [])
    .service('testConnection', function ($q, $http) {
        return {
            test: function () {
                var defered = $q.defer();
                var promise = defered.promise;

                $http.get("/api/wazuh-api/test")
                    .success(function (data) {
                        if (data.error) {
                            defered.reject(data);
                        } else {
                            defered.resolve(data);
                        }
                    })
                    .error(function (data) {
                        defered.reject(data);
                    })

                return promise;
            }
        };
    });