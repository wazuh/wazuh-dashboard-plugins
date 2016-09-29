require('ui/modules').get('app/wazuh', [])
    .factory('DataFactory', function (apiReq, $q, errlog) {
        var dataObj = {};
        var _instances = [];

        dataObj.initialize = function (method, path, body, pageSize, offset) {
            var defered = $q.defer();
            var promise = defered.promise;

            if (!method || !path || !body) {
                defered.reject(prepError({ 'error': -1, 'message': 'Missing parameters' }));
                return promise;
            }

            var instance = (Math.random().toString(36).substring(3));
            while ((_instances[instance]) && (_instances[instance].length > 0)) {
                instance = (Math.random().toString(36).substring(3));
            }

            var limit;
			var url_params = "?offset=0&limit=1";
			
			if (path.indexOf("?") != -1)
				url_params = "&offset=0&limit=1";
			else
				url_params = "?offset=0&limit=1";

            if ((method === 'get') && (pageSize)) {
                apiReq.request('get', path + url_params, body)
                    .then(function (data) {
                        limit = data.data.totalItems;
                        _instances[instance] = {
                            'method': method, 'path': path, 'body': body, 'pageSize': pageSize,
                            'offset': offset, 'limit': limit, 'pagination': true, 'filters': []
                        };
                        defered.resolve(instance);
                    }, function (data) {
                        defered.reject(prepError(data));
                    });

            } else {
                _instances[instance] = {
                    'method': method, 'path': path, 'body': body, 'pageSize': pageSize,
                    'offset': offset, 'pagination': false, 'filters': []
                };
                defered.resolve(instance);
            }

            return promise;
        };

        dataObj.hasNext = function (instanceId) {
            return ((_instances[instanceId]['offset'] + _instances[instanceId]['pageSize']) < _instances[instanceId]['limit']);
        }

        dataObj.next = function (instanceId) {
            var defered = $q.defer();
            var promise = defered.promise;

            if (!instanceId) {
                defered.reject(prepError({ 'error': -1, 'message': 'Missing parameters' }));
                return promise;
            }

            if (!_instances[instanceId]['pagination']) {
                defered.reject(prepError({ 'error': -10, 'message': 'Pagination disabled for this object' }));
                return promise;
            }

            _instances[instanceId]['offset'] += _instances[instanceId]['pageSize'];

            if ((_instances[instanceId]['offset'] < 0) ||
                (_instances[instanceId]['offset'] >= _instances[instanceId]['limit'])) {
                _instances[instanceId]['offset'] -= _instances[instanceId]['pageSize']
                defered.reject(prepError({ 'error': -11, 'message': 'Pagination out of bounds' }));
                return promise;
            }

            dataObj.get(instanceId)
                .then(function (data) {
                    defered.resolve(data);
                }, function (data) {
                    defered.reject(data);
                });

            return promise;
        };

        dataObj.scrollTo = function (instanceId, index) {
            var defered = $q.defer();
            var promise = defered.promise;

            if (!instanceId) {
                defered.reject(prepError({ 'error': -1, 'message': 'Missing parameters' }));
                return promise;
            }

            if (!_instances[instanceId]['pagination']) {
                defered.reject(prepError({ 'error': -10, 'message': 'Pagination disabled for this object' }));
                return promise;
            }

            _instances[instanceId]['offset'] = index - Math.floor(_instances[instanceId]['pageSize'] / 2);

            if (_instances[instanceId]['offset'] > _instances[instanceId]['limit']) {
                _instances[instanceId]['offset'] = _instances[instanceId]['limit'] - _instances[instanceId]['pageSize'];
            }
            if (_instances[instanceId]['offset'] < 0) {
                _instances[instanceId]['offset'] = 0;
            }

            dataObj.get(instanceId)
                .then(function (data) {
                    defered.resolve(data);
                }, function (data) {
                    defered.reject(data);
                });

            return promise;
        };

        dataObj.hasPrev = function (instanceId) {
            return ((_instances[instanceId]['offset'] - _instances[instanceId]['pageSize']) >= 0);
        }

        dataObj.prev = function (instanceId) {
            var defered = $q.defer();
            var promise = defered.promise;

            if (!instanceId) {
                defered.reject(prepError({ 'error': -1, 'message': 'Missing parameters' }));
                return promise;
            }

            if (!_instances[instanceId]['pagination']) {
                defered.reject(prepError({ 'error': -10, 'message': 'Pagination disabled for this object' }));
                return promise;
            }

            _instances[instanceId]['offset'] -= _instances[instanceId]['pageSize'];

            if ((_instances[instanceId]['offset'] < 0) ||
                (_instances[instanceId]['offset'] >= _instances[instanceId]['limit'])) {
                _instances[instanceId]['offset'] += _instances[instanceId]['pageSize']
                defered.reject(prepError({ 'error': -11, 'message': 'Pagination out of bounds' }));
                return promise;
            }

            dataObj.get(instanceId)
                .then(function (data) {
                    defered.resolve(data);
                }, function (data) {
                    defered.reject(data);
                });

            return promise;
        };

        dataObj.get = function (instanceId) {
            var defered = $q.defer();
            var promise = defered.promise;

            if (!instanceId) {
                defered.reject(prepError({ 'error': -1, 'message': 'Missing parameters' }));
                return promise;
            }

            var preparedBody = _instances[instanceId]['body'];
            if (_instances[instanceId]['pagination']) {
                preparedBody['offset'] = _instances[instanceId]['offset'];
                preparedBody['limit'] = _instances[instanceId]['pageSize'];
            }
			
            apiReq.request(_instances[instanceId]['method'], _instances[instanceId]['path'], preparedBody)
                .then(function (data) {
                    if ((_instances[instanceId]['pagination']) && (data.data.totalItems != _instances[instanceId]['limit'])) {
                        _instances[instanceId]['limit'] = data.data.totalItems;
                    }
                    defered.resolve(data);
                }, function (data) {
                    defered.reject(prepError(data));
                });

            return promise;
        };

        /*Filters start*/
        dataObj.filters = {};

        dataObj.filters.register = function (instanceId, name, type, required, defValue) {
            if (!name || !type || !instanceId) {
                return prepError({ 'error': -1, 'message': 'Missing parameters' });
            }

            switch (type) {
                case 'string': break;
                case 'boolean': break;
                case 'array': break;
                default:
                    return prepError({ 'error': 7, 'message': 'Filter type must be one of the following: String, boolean, array.' });
            };

            if (_instances[instanceId]['filters'][name] != undefined) {
                return prepError({ 'error': 7, 'message': 'Attempt to register duplicated filter' });
            }

            if (required && !defValue) {
                return prepError({ 'error': 7, 'message': 'Required filters must have a default value.' });
            }

            _instances[instanceId]['filters'][name] = { 'type': type, 'required': required, 'defValue': defValue };

            _instances[instanceId]['body'][name.replace('filter-', '')] = _instances[instanceId]['filters'][name]['required'] ?
                _instances[instanceId]['filters'][name]['defValue'] : undefined;

            return true;
        };

        dataObj.filters.unregister = function (instanceId, name) {
            if (!instanceId || !name) {
                return prepError({ 'error': -1, 'message': 'Missing parameters' });
            }

            if (!_instances[instanceId]['filters']) {
                return prepError({ 'error': 7, 'message': 'Attempt to delete an undefined filter' });
            }

            _instances[instanceId]['body'][name.replace('filter-', '')] = undefined;
            _instances[instanceId]['filters'][name].length = 0;
            _instances[instanceId]['filters'][name] = undefined;

            return true;
        };

        dataObj.filters.setOr = function (instanceId, name, filtersArray) {
            if (!instanceId || !name || !filtersArray) {
                return prepError({ 'error': -1, 'message': 'Missing parameters' });
            }

            if (!dataObj.filters.exist(instanceId, name)) {
                return prepError({ 'error': 7, 'message': 'Filters must be registered before setting a value or relation' });
            }

            if (typeof (filtersArray) == 'String') {
                filtersArray = [filtersArray];
            }
            _instances[instanceId]['filters'][name]['or'] = [];
            angular.forEach(filtersArray, function (element) {
                if (dataObj.filters.exist(instanceId, name)) {
                    _instances[instanceId]['filters'][name]['or'].push(element);
                }
            });

            return true;
        };

        dataObj.filters.setAnd = function (instanceId, name, filtersArray) {
            if (!instanceId || !name || !filtersArray) {
                return prepError({ 'error': -1, 'message': 'Missing parameters' });
            }

            if (!dataObj.filters.exist(instanceId, name)) {
                return prepError({ 'error': 7, 'message': 'Filters must be registered before setting a value or relation' });
            }

            if (typeof (filtersArray) == 'String') {
                filtersArray = [filtersArray];
            }

            angular.forEach(filtersArray, function (element) {
                if (!_instances[instanceId]['filters'][element]['required']) {
                    return prepError({ 'error': 7, 'message': 'Attempt to relate not required filters with "AND" expression.' });
                }
                if (dataObj.filters.exist(instanceId, name)) {
                    _instances[instanceId]['filters'][name]['and'].push(element);
                }
            });

            return true;
        };

        dataObj.filters.set = function (instanceId, name, value) {
            if (!instanceId || !name || !value) {
                return prepError({ 'error': -1, 'message': 'Missing parameters' });
            }

            if (!dataObj.filters.exist(instanceId, name)) {
                return prepError({ 'error': 7, 'message': 'Filters must be registered before setting a value or relation' });
            }

            if ((_instances[instanceId]['filters'][name]['type'] == 'boolean') && (typeof (value) != 'boolean')) {
                return prepError({ 'error': 7, 'message': 'Attempt to set non-boolean value in boolean filter' });
            }

            if (_instances[instanceId]['filters'][name]['type'] == 'array') {
                _instances[instanceId]['filters'][name] = ((_instances[instanceId]['filters'][name].split(',')).push(value)).toString();
            } else {
                _instances[instanceId]['body'][name.replace('filter-', '')] = value;
            }

            angular.forEach(_instances[instanceId]['filters'][name]['or'], function (element) {
                if (dataObj.filters.exist(instanceId, element)) {
                    dataObj.filters.unset(instanceId, element);
                } else {
                    _instances[instanceId]['filters'][name]['or'][_instances[instanceId]['filters'][name]['or'].indexOf(element)] = undefined;
                }
            });

            angular.forEach(_instances[instanceId]['filters'][name]['and'], function (element) {
                if (!dataObj.filters.exist(instanceId, element)) {
                    _instances[instanceId]['filters'][name]['and'][_instances[instanceId]['filters'][name]['and'].indexOf(element)] = undefined;
                } else if (!dataObj.filters.hasValue(instanceId, element)) {
                    _instances[instanceId]['body'][element.replace('filter-', '')] = _instances[instanceId]['filters'][element]['defValue'];
                }
            });

            _instances[instanceId]['filterFlag'] = true;

            return true;
        };

        dataObj.filters.unset = function (instanceId, name) {
            if (!instanceId || !name) {
                return prepError({ 'error': -1, 'message': 'Missing parameters' });
            }

            if (!dataObj.filters.exist(instanceId, name)) {
                return prepError({ 'error': 7, 'message': 'Filters must be registered before setting a value or relation' });
            }

            _instances[instanceId]['body'][name.replace('filter-', '')] =
                _instances[instanceId]['filters'][name]['defValue'] ? _instances[instanceId]['filters'][name]['defValue'] : undefined;

            _instances[instanceId]['filterFlag'] = true;

            return true;
        };

        dataObj.filters.flag = function (instanceId) {
            if (!instanceId) {
                return prepError({ 'error': -1, 'message': 'Missing parameters' });
            }
            return _instances[instanceId]['filterFlag'];
        };

        dataObj.filters.unflag = function (instanceId) {
            if (!instanceId) {
                return prepError({ 'error': -1, 'message': 'Missing parameters' });
            }
            _instances[instanceId]['filterFlag'] = false;
            return true;
        };

        dataObj.filters.alternateSet = function (instanceId, name, value) {
            if (!instanceId || !name || !value) {
                return prepError({ 'error': -1, 'message': 'Missing parameters' });
            }

            if (!dataObj.filters.exist(instanceId, name)) {
                return prepError({ 'error': 7, 'message': 'Filters must be registered before setting a value or relation' });
            }

            if (dataObj.filters.isSet(instanceId, name, value)) {
                dataObj.filters.unset(instanceId, name, value);
            } else {
                dataObj.filters.set(instanceId, name, value);
            }

            return true;
        };

        dataObj.filters.exist = function (instanceId, name) {
            if (!instanceId || !name) {
                return prepError({ 'error': -1, 'message': 'Missing parameters' });
            }

            return (_instances[instanceId]['filters'][name] != undefined);
        };

        dataObj.filters.hasValue = function (instanceId, name) {
            if (!instanceId || !name) {
                return prepError({ 'error': -1, 'message': 'Missing parameters' });
            }

            return dataObj.filters.exist(instanceId, name) ? (_instances[instanceId]['body'][name.replace('filter-', '')] != undefined) : false;
        };

        dataObj.filters.isSet = function (instanceId, name, value) {
            if (!instanceId || !name || !value) {
                return prepError({ 'error': -1, 'message': 'Missing parameters' });
            }

            return dataObj.filters.hasValue(instanceId, name) ? (_instances[instanceId]['body'][name.replace('filter-', '')] == value) : false;
        };
        /*Filters end*/

        dataObj.getBody = function (instanceId) {
            return _instances[instanceId]['body'];
        };

        dataObj.getOffset = function (instanceId) {
            return _instances[instanceId]['offset'];
        };

        dataObj.getTotalItems = function (instanceId) {
            if (_instances[instanceId]['limit']) {
                return _instances[instanceId]['limit'];
            } else {
                return 0;
            }
        };

        dataObj.clean = function (instanceId) {
            _instances[instanceId].length = 0;
        };

        dataObj.cleanAll = function () {
            _instances = 0;
        };

        dataObj.getAndClean = function (method, path, body) {
            var defered = $q.defer();
            var promise = defered.promise;

            dataObj.initialize(method, path, body)
                .then(function (_instanceId) {
                    dataObj.get(_instanceId)
                        .then(function (data) {
                            defered.resolve(data);
                            dataObj.clean(_instanceId);
                        }, function (error) {
                            defered.reject(error);
                            dataObj.clean(_instanceId);
                        })
                }, function (error) {
                    defered.reject(error);
                })

            return promise;
        };

        var prepError = function (err) {
            if (err.error < 0) {
                err['html'] = "Unexpected error located on controller. Error: <b>" + err.message + " (code " + err.error + ")</b>.";
                err.message = "Unexpected error located on controller. Error: " + err.message + " (code " + err.error + ").";
            } else if (err.error === 1) {
                err['html'] = "<b>Error getting credentials</b> for Wazuh API. Please, check credentials at settings tab.";
                err.message = "Error getting credentials for Wazuh API. Please, check credentials at settings tab.";
            } else if (err.error === 2) {
                err['html'] = "<b>Error getting credentials</b> for Wazuh API. Could not connect with Elasticsearch.";
                err.message = "Error getting credentials for Wazuh API. Could not connect with Elasticsearch.";
            } else if (err.error < 5) {
                err['html'] = "Unexpected error located on Kibana server. Error: <b>" + err.message + " (code " + err.error + ")</b>.";
                err.message = "Unexpected error located on Kibana server. Error: " + err.message + " (code " + err.error + ").";
            } else if (err.error === 5) {
                err['html'] = "Could not connect with Wazuh API. Error: " + err.errorMessage + ".</br> Please, check the URL at settings tab.";
                err.message = "Could not connect with Wazuh API. Error: " + err.errorMessage + ". Please, check the URL at settings tab.";
            } else if (err.error === 6) {
                if (err.errorData.statusCode && err.errorData.statusCode == '404') {
                    err['html'] = "Wazuh API URL could not be found on elasticsearch. Please, configure the application properly.";
                    err.message = "Wazuh API URL could not be found on elasticsearch. Please, configure the application properly.";
                } else {
                    err['html'] = "Wazuh API returned an error message. Error: <b>" + err.errorData.message + "</b>";
                    err.message = "Wazuh API returned an error message. Error: " + err.errorData.message;
                }
            } else if (err.error === 7) {
                err['html'] = "Unexpected error filtering the data. Error <b>" + err.message + "</b>.";
                err.message = "Unexpected error filtering the data. Error " + err.message + ".";
            } else {
                err['html'] = "Unexpected error. Please, report this error.";
                err.message = "Unexpected error. Please, report this error.";
            }

            errlog.log(err.message, JSON.stringify(err));
            return err;
        };

        return dataObj;
    });
	

	