import chrome from 'ui/chrome';
require('ui/modules').get('app/wazuh', [])
    .service('apiReq', function ($q, $http, genericReq) {
        return {
            request: function (method, path, body) {
                var defered = $q.defer();
                var promise = defered.promise;

                if (!method || !path || !body) {
                    defered.reject({ 'error': -1, 'message': 'Missing parameters' });
                    return promise;
                }

                var requestData = {
                    'method': method,
                    'path': path,
                    'body': body
                }

                genericReq.request('POST', '/api/wazuh-api/request', requestData)
                    .then(function (data) {
                        if (data.error) {
                            defered.reject(data);
                        } else {
                            defered.resolve(data);
                        }
                    }, function (data) {
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
