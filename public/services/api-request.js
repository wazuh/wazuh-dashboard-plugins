import chrome from 'ui/chrome';

const app = require('ui/modules').get('app/wazuh', []);
app.service('apiReq', function ($q, $http, genericReq, appState, $location, $rootScope) {
    return {
        request: (method, path, body) => {
            let defered = $q.defer();

            if (!method || !path || !body) {
                defered.reject({
                    error:   -1,
                    message: 'Missing parameters'
                });
                return defered.promise;
            }

            if (appState.getCurrentAPI() === undefined || appState.getCurrentAPI() === null)
                defered.reject({
                    error:   -3,
                    message: 'No API selected.'
                });
            
            let id = JSON.parse(appState.getCurrentAPI()).id;
            let requestData = { method, path, body, id };

            genericReq.request('POST', '/api/wazuh-api/request', requestData)
            .then(data => {
                if (data.error) {
                    defered.reject(data);
                } else {
                    defered.resolve(data);
                }
            })
            .catch(error => defered.reject(error));

            return defered.promise;
        }
    };
});
