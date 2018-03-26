import chrome from 'ui/chrome';
const app = require('ui/modules').get('app/wazuh', []);

app.service('testAPI', function ($q, $http, $location, $rootScope, appState, genericReq) {
    return {
        check_stored: data => {
            
            let defered = $q.defer();
            
            const headers = {headers:{ "Content-Type": 'application/json' },timeout: $rootScope.userTimeout || 8000};
            
            /** Checks for outdated cookies */
            const current     = appState.getCreatedAt();
            const lastRestart = $rootScope.lastRestart;

            if(current && lastRestart && lastRestart > current){
                appState.removeCurrentPattern();
                appState.removeCurrentAPI();
                appState.removeClusterInfo();
                appState.removeCreatedAt();
                delete $rootScope.lastRestart;
                genericReq.request('GET', '/api/wazuh-api/configuration', {})
                .then(configuration => {
                    appState.setPatternSelector(typeof configuration.data.data['ip.selector'] !== 'undefined' ? configuration.data.data['ip.selector'] : true)
                    defered.resolve('cookies_outdated');
                })
                .catch(error => defered.reject(error));            

                /** End of checks for outdated cookies */
            } else {
                if(appState.getUserCode()) headers.headers.code = appState.getUserCode();
                
                Promise.all([
                    genericReq.request('GET', '/api/wazuh-api/configuration', {}),
                    $http.post(chrome.addBasePath('/api/wazuh-api/checkStoredAPI'), data,headers)
                ])
                .then(data => {
                    appState.setPatternSelector(typeof data[0].data.data['ip.selector'] !== 'undefined' ? data[0].data.data['ip.selector'] : true)
                    if (data[1].error) {
                        defered.reject(data[1]);
                    } else {
                        defered.resolve(data[1]);
                    }
                })
                .catch(error => {
                    if(error.status && error.status === -1){
                        $rootScope.apiIsDown = true;
                        defered.reject({data: 'request_timeout_checkstored'});
                    } else {
                        defered.reject(error);
                    }
                });
            }
            return defered.promise;
        },
        check: data => {
            const headers = {headers:{ "Content-Type": 'application/json' },timeout: $rootScope.userTimeout || 8000};
            if(appState.getUserCode()) headers.headers.code = appState.getUserCode();
            let defered = $q.defer();
            const url = chrome.addBasePath("/api/wazuh-api/checkAPI");
            $http
            .post(url, data, headers)
            .then(response => {
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
                } else if(error.data && ((error.data.message && error.data.message === 'socket hang up') || (parseInt(error.data.error) === 5))) {
                    defered.reject({data:'socket_hang_up',extraMessage: `Wazuh API throws ${error.data.message}`, https: (data.url && data.url.includes('https'))});
                } else {
                    defered.reject(error);
                }
            });
            return defered.promise;
        }
    };
});
