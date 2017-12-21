import chrome from 'ui/chrome';
require('ui/modules').get('app/wazuh', [])
.service('testAPI', function ($q, $http) {
    return {
        check_stored: data => {
            let defered = $q.defer();
            $http.post(chrome.addBasePath('/api/wazuh-api/checkStoredAPI'), data,{timeout: 4000})
            .then((response) => {
                if (response.error) {
                    defered.reject(response);
                } else {
                    defered.resolve(response);
                }
            })
            .catch(error => {
                if(error.status && error.status === -1){
                    defered.reject({data: 'request_timeout_checkstored'});
                } else if (error.error) {
                    defered.reject(error);
                }
            });
            return defered.promise;
        },
        check: data => {
            let defered = $q.defer();
            $http.post(chrome.addBasePath("/api/wazuh-api/checkAPI"), data, {timeout: 4000})
            .then((response) => {
                if (response.error) {
                    defered.reject(response);
                } else {
                    defered.resolve(response);
                }
            })
            .catch(error => {
                if(error.data && error.data.message && error.data.message.includes('ENOTFOUND')) {   
                    defered.reject({data: 'invalid_url'}); 
                } else if(error.data && error.data.message && error.data.message.includes('ECONNREFUSED')) {   
                    defered.reject({data: 'invalid_port'}); 
                } else if(error.status && error.status === -1){
                    defered.reject({data: 'request_timeout_checkapi'});
                } else if (error.data && error.data.message && error.data.message === 'wrong_credentials') {
                    defered.reject({data: 'wrong_credentials'});
                } else if (error.error) {
                    defered.reject(error);
                }
            });
            return defered.promise;
        }
    };
});
