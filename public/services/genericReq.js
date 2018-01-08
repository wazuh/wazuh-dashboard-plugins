const prepError = require('plugins/wazuh/services/prep-error');
import chrome from 'ui/chrome';

require('ui/modules').get('app/wazuh', []).service('genericReq', function ($q, $http) {

    const _request = (method, url, payload = null) => {
        let defered = $q.defer();

        if (!method || !url) {
            defered.reject({
                'error':   -1,
                'message': 'Missing parameters'
            });
            return defered.promise;
        }

        let requestHeaders = { headers: { "Content-Type": 'application/json' }, timeout: 4000 };

        let tmpUrl = chrome.addBasePath(url), tmp = null;

        if (method === "GET")    tmp = $http.get(tmpUrl, requestHeaders);
        if (method === "PUT")    tmp = $http.put(tmpUrl, payload, requestHeaders);
        if (method === "POST")   tmp = $http.post(tmpUrl, payload, requestHeaders);
        if (method === "DELETE") tmp = $http.delete(tmpUrl);
        
        if(!tmp) {
            defered.reject({
                'error': -2,
                'message': 'Error doing a request to Kibana API.'
            });
            return defered.promise;
        }

        tmp
        .then(data => {
            if (data.error && data.error !== '0') {
                defered.reject(data);
            } else {
                defered.resolve(data);
            }
        })
        .catch(error => {
            if(error.status && error.status === -1){
                defered.reject({data: 'request_timeout_genericreq', url });
            }else if (error.error && error.error !== '0') {
                defered.reject(error);
            } else {
                defered.reject(error);
            }
        });

        return defered.promise;
    };

    return {
        request: (method, path, payload = null) => {
            let defered = $q.defer();

            if (!method || !path) {
                defered.reject(prepError({
                    'error': -1,
                    'message': 'Missing parameters'
                }));
                return defered.promise;
            }

            _request(method, path, payload)
            .then((data) => defered.resolve(data))
            .catch(error => defered.reject(prepError(error)));

            return defered.promise;
        }
    };
});
