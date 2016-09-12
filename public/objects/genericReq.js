require('ui/modules').get('app/wazuh', [])
    .service('genericReq', function ($q, $http) {
        return {
            request: function (method, url) {
                var defered = $q.defer();
                var promise = defered.promise;
                if (!method || !url) {
                    defered.reject({ 'error': -1, 'message': 'Missing parameters' });
                    return promise;
                }
                var requestHeaders = {
                    headers: {
                        "Content-Type": 'application/json'
                    }
                }
				if(method == "GET"){
					$http.get(url, requestHeaders)
						.success(function (data) {
							if (data.error) {
								defered.reject(data);
							} else {
								defered.resolve(data);
							}
						})
						.error(function (data) {	
							if (data.error) {
								defered.reject(data);
							} else {
								defered.reject({ 'error': -2, 'message': 'Error doing a request to Kibana API.' });
							}
						});
				}
                return promise;
            }
        };
    });