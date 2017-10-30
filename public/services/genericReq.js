
import chrome from 'ui/chrome';
require('ui/modules').get('app/wazuh', [])
    .service('genericReq', function ($q, $http) {

        const _request = (method, url, payload = null) => {
            let defered = $q.defer();
  
            if (!method || !url) {
                defered.reject({
                    'error':   -1,
                    'message': 'Missing parameters'
                });
                return defered.promise;
            }

            let requestHeaders = { headers: { "Content-Type": 'application/json' } };

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
            .then((data) => {
                if (data.error && data.error !== '0') {
                    defered.reject(data);
                } else {
                    defered.resolve(data);
                }
            })
            .catch((error) => {
                if (error.error && error.error !== '0') {
                    defered.reject(error);
                } else {
                    defered.reject({
                        'error': -2,
                        'message': 'Error doing a request to Kibana API.'
                    });
                }
            });

            return defered.promise;
        };

        const prepError = (err) => {
            if (err.error < 0) {
                err['html'] = `Unexpected error located on controller. Error: <b>${err.message} (code ${err.error})</b>.`;
                err.message = `Unexpected error located on controller. Error: ${err.message} (code ${err.error}).`;
            } else if (err.error === 1) {
                err['html'] = "<b>Error getting credentials</b> for Wazuh API. Please, check credentials at settings tab.";
                err.message = "Error getting credentials for Wazuh API. Please, check credentials at settings tab.";
            } else if (err.error === 2) {
                err['html'] = "<b>Error getting credentials</b> for Wazuh API. Could not connect with Elasticsearch.";
                err.message = "Error getting credentials for Wazuh API. Could not connect with Elasticsearch.";
            } else if (err.error < 5) {
                err['html'] = `Unexpected error located on Kibana server. Error: <b>${err.message} (code ${err.error})</b>.`;
                err.message = `Unexpected error located on Kibana server. Error: ${err.message} (code ${err.error}).`;
            } else if (err.error === 5) {
                err['html'] = `Could not connect with Wazuh API. Error: ${err.errorMessage}.</br> Please, check the URL at settings tab.`;
                err.message = `Could not connect with Wazuh API. Error: ${err.errorMessage}. Please, check the URL at settings tab.`;
            } else if (err.error === 6) {
                if (err.errorData.statusCode && err.errorData.statusCode === '404') {
                    err['html'] = "Wazuh API URL could not be found on elasticsearch. Please, configure the application properly.";
                    err.message = "Wazuh API URL could not be found on elasticsearch. Please, configure the application properly.";
                } else {
                    err['html'] = `Wazuh API returned an error message. Error: <b>${err.errorData.message}</b>`;
                    err.message = `Wazuh API returned an error message. Error: ${err.errorData.message}`;
                }
            } else if (err.error === 7) {
                err['html'] = `Unexpected error filtering the data. Error <b>${err.message}</b>.`;
                err.message = `Unexpected error filtering the data. Error ${err.message}.`;
            } else {
                err['html'] = "Unexpected error. Please, report this error.";
                err.message = "Unexpected error. Please, report this error.";
            }
        
            return err;
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
                    .catch((error) => defered.reject(prepError(error)));

                    return defered.promise;
            }
        };
    });