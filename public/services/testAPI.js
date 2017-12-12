import chrome from 'ui/chrome';
require('ui/modules').get('app/wazuh', [])
.service('testAPI', function ($q, $http) {
    return {
        check_stored: (data) => {
            let defered = $q.defer();
            $http.post(chrome.addBasePath('/api/wazuh-api/checkStoredAPI'), data)
            .then((response) => {
                if (response.error) {
                    defered.reject(response);
                } else {
                    defered.resolve(response);
                }
            })
            .catch((error) => {
                if (error.error) {
                    defered.reject(error);
                }
            });
            return defered.promise;
        },
        check: (data) => {
            let defered = $q.defer();
            $http.post(chrome.addBasePath("/api/wazuh-api/checkAPI"), data)
            .then((response) => {
                if (response.error) {
                    defered.reject(response);
                } else {
                    defered.resolve(response);
                }
            })
            .catch((error) => {
                if (error.error) {
                    defered.reject(error);
                }
            });
            return defered.promise;
        }
    };
});
