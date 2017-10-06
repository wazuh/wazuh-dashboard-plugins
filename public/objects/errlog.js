import chrome from 'ui/chrome';
require('ui/modules').get('app/wazuh', [])
    .service('errlog', function ($q, $http) {
        return {
            log: function (message, details) {
                var defered = $q.defer();
                var promise = defered.promise;

                if (!message) {
                    defered.reject({ 'error': -1, 'message': 'Missing parameters' });
                    return promise;
                }

                var requestData = {
                    'message': message,
                    'details': details
                }

                $http.post(chrome.addBasePath('/api/wazuh-api/errlog'), requestData)
                    .then(function () {
                        defered.resolve();
                    }).catch(function (data) {
                        if (data.error) {
                            defered.reject(data);
                        } else {
                            defered.reject({ 'error': -2, 'message': 'Error doing a request to Kibana API.' });
                        }
                    });

                return promise;
            }
        };
    });
