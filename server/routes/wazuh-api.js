module.exports = function (server, options) {

    const config = server.config();
    var _elurl = config.get('elasticsearch.url');
    var _eluser = config.get('elasticsearch.username');
    var _elpass = config.get ('elasticsearch.password');

    //Handlers - Generic

    var getConfig = function (callback) {
        var needle = require('needle');

        if (_eluser && _elpass) {
            var options = {
                username: _eluser,
                password: _elpass,
                rejectUnauthorized: false
            };
        } else {
            var options = {
                rejectUnauthorized: false
            };
        }

        var elasticurl = _elurl+'/.kibana/wazuh-configuration/1';
        needle.get(elasticurl, options, function (error, response) {
            if (!error) {
                if (response.body.found) {
                    callback({ 'user': response.body._source.api_user, 'password': new Buffer(response.body._source.api_password, 'base64').toString("ascii"), 'url': response.body._source.api_url, 'insecure': response.body._source.insecure });
                } else {
                    callback({ 'error': 'no credentials', 'error_code': 1 });
                }
            } else {
                callback({ 'error': 'no elasticsearch', 'error_code': 2 });
            }
        });
    };

    //Handlers - Test API

    var testApiAux2 = function (error, response, insecure) {
        if (!error && response && response.body.data == 'Welcome to Wazuh HIDS API') {
            return { 'statusCode': 200, 'data': 'ok' };
        } else if (response && response.statusCode == 401) {
            return { 'statusCode': 200, 'error': '1', 'data': 'unauthorized' };
        } else if (!error && response && response.body.data != 'Welcome to Wazuh HIDS API') {
            return { 'statusCode': 200, 'error': '1', 'data': 'bad_url' };
        } else {
            if (!insecure) {
                return { 'statusCode': 200, 'error': '1', 'data': 'self_signed' };
            } else {
                return { 'statusCode': 200, 'error': '1', 'data': 'not_running' };
            }
        }
    };

    var testApiAux1 = function (error, response, wapi_config, needle, callback) {
        if (!error && response && response.body.data == 'Welcome to Wazuh HIDS API') {
            callback({ 'statusCode': 200, 'data': 'ok' });
        } else if (response && response.statusCode == 401) {
            callback({ 'statusCode': 200, 'error': '1', 'data': 'unauthorized' });
        } else if (!error && response && response.body.data != 'Welcome to Wazuh HIDS API') {
            callback({ 'statusCode': 200, 'error': '1', 'data': 'bad_url' });
        } else {
            needle.request('get', wapi_config.url, {}, { username: wapi_config.user, password: wapi_config.password, rejectUnauthorized: !wapi_config.insecure }, function (error, response) {
                callback(testApiAux2(error, response, wapi_config.insecure));
            });
        }
    };

    var testApi = function (req, reply) {
        var needle = require('needle');
        needle.defaults({
            open_timeout: 5000
        });

        //Get config from elasticsearch
        getConfig(function (wapi_config) {

            if (wapi_config.error_code > 1) {
                //Can not connect to elasticsearch
                reply({ 'statusCode': 200, 'error': '1', 'data': 'no_elasticsearch' });
                return;
            } else if (wapi_config.error_code > 0) {
                //Credentials not found
                reply({ 'statusCode': 200, 'error': '1', 'data': 'no_credentials' });
                return;
            }

            if ((wapi_config.url.indexOf('https://') == -1) && (wapi_config.url.indexOf('http://') == -1)) {
                reply({ 'statusCode': 200, 'error': '1', 'data': 'protocol_error' });
            } else {
                needle.request('get', wapi_config.url, {}, { username: wapi_config.user, password: wapi_config.password }, function (error, response) {
                    testApiAux1(error, response, wapi_config, needle, function (test_result) {
                        reply(test_result);
                    });
                });
            }
        });
    };

    //Handlers - Route request

    var errorControl = function (error, response) {
        if (error) {
            return ({ 'isError': true, 'body': { 'statusCode': 500, 'error': 5, 'message': 'Request error', 'errorMessage': error.message } });
        } else if (!error && response.body.error) {
            return ({ 'isError': true, 'body': { 'statusCode': 500, 'error': 6, 'message': 'Wazuh api error', 'errorData': response.body } });
        }
        return ({ 'isError': false });
    };

    var makeRequest = function (method, path, data, reply) {
        getConfig(function (wapi_config) {
            if (wapi_config.error_code > 1) {
                //Can not connect to elasticsearch
                reply({ 'statusCode': 404, 'error': 2, 'message': 'Could not connect with elasticsearch' }).code(404);
                return;
            } else if (wapi_config.error_code > 0) {
                //Credentials not found
                reply({ 'statusCode': 404, 'error': 1, 'message': 'Credentials does not exists' }).code(404);
                return;
            }

            var needle = require('needle');
            needle.defaults({
                open_timeout: 5000
            });

            if (!data) {
                data = {};
            }

            var options = {
                headers: { 'api-version': 'v1.3.0' },
                username: wapi_config.user,
                password: wapi_config.password,
                rejectUnauthorized: !wapi_config.insecure
            };

            var fullUrl = wapi_config.url + path;
            
            needle.request(method, fullUrl, data, options, function (error, response) {
                var errorData = errorControl(error, response);
                if (errorData.isError) {
                    reply(errorData.body).code(500);
                } else {
                    reply(response.body);
                }
            });
        });
    };

    var requestApi = function (req, reply) {
        if (!req.payload.method) {
            reply({ 'statusCode': 400, 'error': 3, 'message': 'Missing param: Method' }).code(400);
        } else if (!req.payload.path) {
            reply({ 'statusCode': 400, 'error': 4, 'message': 'Missing param: Path' }).code(400);
        } else {
            makeRequest(req.payload.method, req.payload.path, req.payload.body, reply);
        }
    };

    //Handlers - Save config

    var saveApi = function (req, reply) {
        var needle = require('needle');

        if (_eluser && _elpass) {
            var options = {
                username: _eluser,
                password: _elpass,
                rejectUnauthorized: false,
                json: true
            };
        } else {
            var options = {
                rejectUnauthorized: false,
                json: true
            };
        }

        var elasticurl = _elurl+'/.kibana/wazuh-configuration/1';

        if (!(req.payload.api_user && req.payload.api_password && req.payload.api_url && req.payload.insecure)) {
            reply({ 'statusCode': 400, 'error': 7, 'message': 'Missing data' }).code(400);
            return;
        }

        needle.request('put', elasticurl, req.payload, options, function (error, response) {
            if (error || response.body.error) {
                reply({ 'statusCode': 500, 'error': 8, 'message': 'Could not save data in elasticsearch'}).code(500);
            } else {
                reply({ 'statusCode': 200, 'message': 'ok'});
            }
        });

    };

    //Handlers - stats

    var getFieldTop = function(req, reply) {
        var needle = require('needle');
        if (_eluser && _elpass) {
            var options = {
                username: _eluser,
                password: _elpass,
                rejectUnauthorized: false,
                json: true
            };
        } else {
            var options = {
                rejectUnauthorized: false,
                json: true
            };
        }

        var elasticurl = _elurl+'/ossec-*/ossec/_search';
		
		// is date defined? or must use 24h ?
		var date = new Date();
		date.setDate(date.getDate()-1);
		date = date.getTime();
		
		const timeAgo = req.params.time ? encodeURIComponent(req.params.time) : date;
        

        var payload = {
            "size": 1,
            "query": {
                "bool": {
                    "must": [
                        {
                            "query_string": {
                                "query": "*",
                                "analyze_wildcard": true
                            }
                        },
                        {
                            "range": {
                                "@timestamp": {
                                    "gte": timeAgo,
                                    "format": "epoch_millis"
                                }
                            }
                        }
                    ],
                    "must_not": []
                }
            },
            "aggs": {
                "2": {
                    "terms": {
                        "field": req.params.field,
                        "size": 1,
                        "order": {
                            "_count": "desc"
                        }
                    }
                }
            }
        };

        needle.request('get', elasticurl, payload, options, function (error, response) {
            if (error || response.body.error) {
                reply({ 'statusCode': 500, 'error': 9, 'message': 'Could not get data from elasticsearch'}).code(500);
            } else {
                if (response.body.hits.total == 0 || typeof response.body.aggregations['2'].buckets[0] === 'undefined') {
                    reply({ 'statusCode': 200, 'data': '(no data)'});
                } else {
                    reply({ 'statusCode': 200, 'data': response.body.aggregations['2'].buckets[0].key});
                }
            }
        });
    };

    var statsOverviewAlerts = function (req, reply) {
        var needle = require('needle');

        if (_eluser && _elpass) {
            var options = {
                username: _eluser,
                password: _elpass,
                rejectUnauthorized: false,
                json: true
            };
        } else {
            var options = {
                rejectUnauthorized: false,
                json: true
            };
        }

        var elasticurl = _elurl + '/ossec-*/ossec/_search';

        var gte = new Date() - (24 * 3600);

        var payloads = [];

        payloads[0] = {
            "size": 0,
            "query": {
                "bool": {
                    "must": [
                        {
                            "query_string": {
                                "query": "*",
                                "analyze_wildcard": true
                            }
                        },
                        {
                            "range": {
                                "@timestamp": {
                                    "gte": gte,
                                    "format": "epoch_millis"
                                }
                            }
                        }
                    ],
                    "must_not": []
                }
            },
            "aggs": {}
        };

        payloads[1] = {
            "size": 0,
            "query": {
                "bool": {
                    "must": [
                        {
                            "query_string": {
                                "query": "*",
                                "analyze_wildcard": true
                            }
                        },
                        {
                            "range": {
                                "@timestamp": {
                                    "gte": gte,
                                    "format": "epoch_millis"
                                }
                            }
                        }
                    ],
                    "must_not": []
                }
            },
            "aggs": {
                "2": {
                    "terms": {
                        "field": "srcip",
                        "size": 1,
                        "order": {
                            "_count": "desc"
                        }
                    }
                }
            }
        };

        payloads[2] = {
            "size": 0,
            "query": {
                "bool": {
                    "must": [
                        {
                            "query_string": {
                                "query": "*",
                                "analyze_wildcard": true
                            }
                        },
                        {
                            "range": {
                                "@timestamp": {
                                    "gte": gte,
                                    "format": "epoch_millis"
                                }
                            }
                        }
                    ],
                    "must_not": []
                }
            },
            "aggs": {
                "2": {
                    "terms": {
                        "field": "rule.groups",
                        "size": 1,
                        "order": {
                            "_count": "desc"
                        }
                    }
                }
            }
        };

        var data = [];

        needle.request('get', elasticurl, payloads[0], options, function (error, response) {
            if (error || response.body.error) {
                reply({ 'statusCode': 500, 'error': 9, 'message': 'Could not get data from elasticsearch' }).code(500);
            } else {
                data['alerts'] = response.body.hits.total;
                needle.request('get', elasticurl, payloads[1], options, function (error, response) {
                    if (error || response.body.error) {
                        reply({ 'statusCode': 500, 'error': 9, 'message': 'Could not get data from elasticsearch' }).code(500);
                    } else {
                        if (response.body.hits.total == 0) {
                            data['ip'] = '-';
                        } else {
                            data['ip'] = response.body.aggregations['2'].buckets[0].key;
                        }
                        needle.request('get', elasticurl, payloads[2], options, function (error, response) {
                            if (error || response.body.error) {
                                reply({ 'statusCode': 500, 'error': 9, 'message': 'Could not get data from elasticsearch' }).code(500);
                            } else {
                                if (response.body.hits.total == 0) {
                                    data['group'] = '-';
                                } else {
                                    data['group'] = response.body.aggregations['2'].buckets[0].key; 
                                }
                                reply({ 'statusCode': 200, 'data': {'alerts': data['alerts'], 'ip': data['ip'], 'group': data['group']} });
                            }
                        });
                    }
                });
            }
        });
    };

    var statsOverviewSyscheck = function (req, reply) {
        var needle = require('needle');

        if (_eluser && _elpass) {
            var options = {
                username: _eluser,
                password: _elpass,
                rejectUnauthorized: false,
                json: true
            };
        } else {
            var options = {
                rejectUnauthorized: false,
                json: true
            };
        }

        var elasticurl = _elurl + '/ossec-*/ossec/_search';

        var gte = new Date() - (24 * 3600);

        var payloads = [];

        payloads[0] = {
            "size": 0,
            "query": {
                "bool": {
                    "must": [
                        {
                            "query_string": {
                                "query": "rule.groups:syscheck",
                                "analyze_wildcard": true
                            }
                        },
                        {
                            "range": {
                                "@timestamp": {
                                    "gte": gte,
                                    "format": "epoch_millis"
                                }
                            }
                        }
                    ],
                    "must_not": []
                }
            },
            "aggs": {}
        };

        payloads[1] = {
            "size": 0,
            "query": {
                "bool": {
                    "must": [
                        {
                            "query_string": {
                                "query": "rule.groups:syscheck",
                                "analyze_wildcard": true
                            }
                        },
                        {
                            "range": {
                                "@timestamp": {
                                    "gte": gte,
                                    "format": "epoch_millis"
                                }
                            }
                        }
                    ],
                    "must_not": []
                }
            },
            "aggs": {
                "2": {
                    "terms": {
                        "field": "AgentName",
                        "size": 1,
                        "order": {
                            "_count": "desc"
                        }
                    }
                }
            }
        };

        payloads[2] = {
            "size": 0,
            "query": {
                "bool": {
                    "must": [
                        {
                            "query_string": {
                                "query": "*",
                                "analyze_wildcard": true
                            }
                        },
                        {
                            "range": {
                                "@timestamp": {
                                    "gte": gte,
                                    "format": "epoch_millis"
                                }
                            }
                        }
                    ],
                    "must_not": []
                }
            },
            "aggs": {
                "2": {
                    "terms": {
                        "field": "SyscheckFile.path",
                        "size": 1,
                        "order": {
                            "_count": "desc"
                        }
                    }
                }
            }
        };

        var data = [];

        needle.request('get', elasticurl, payloads[0], options, function (error, response) {
            if (error || response.body.error) {
                reply({ 'statusCode': 500, 'error': 9, 'message': 'Could not get data from elasticsearch' }).code(500);
            } else {
                data['alerts'] = response.body.hits.total;
                needle.request('get', elasticurl, payloads[1], options, function (error, response) {
                    if (error || response.body.error) {
                        reply({ 'statusCode': 500, 'error': 9, 'message': 'Could not get data from elasticsearch' }).code(500);
                    } else {
                        if (response.body.hits.total == 0) {
                            data['agent'] = '-';
                        } else {
                            data['agent'] = response.body.aggregations['2'].buckets[0].key;
                        }
                        needle.request('get', elasticurl, payloads[2], options, function (error, response) {
                            if (error || response.body.error) {
                                reply({ 'statusCode': 500, 'error': 9, 'message': 'Could not get data from elasticsearch' }).code(500);
                            } else {
                                if (response.body.hits.total == 0) {
                                    data['file'] = '-';
                                } else {
                                    data['file'] = response.body.aggregations['2'].buckets[0].key;
                                }
                                reply({ 'statusCode': 200, 'data': { 'alerts': data['alerts'], 'agent': data['agent'], 'file': data['file'] } });
                            }
                        });
                    }
                });
            }
        });
    };

    //Handlers - overview

    //Server routes

    /*
    * GET /api/wazuh-api/test
    * Returns if the wazuh-api configuration is working
    *
    **/
    server.route({
        method: 'GET',
        path: '/api/wazuh-api/test',
        handler: testApi
    });

    /*
    * POST /api/wazuh-api/request
    * Returns the request result (With error control)
    *
    **/
    server.route({
        method: 'POST',
        path: '/api/wazuh-api/request',
        handler: requestApi
    });

    /*
    * POST /api/wazuh-api/settings
    * Save the given settings into elasticsearch
    *
    **/
    server.route({
        method: 'PUT',
        path: '/api/wazuh-api/settings',
        handler: saveApi
    });

    /*
    * GET /api/wazuh-stats/top/agent
    * Returns the agent with most alerts
    *
    **/
    server.route({
        method: 'GET',
        path: '/api/wazuh-elastic/top/{field}/{time?}',
        handler: getFieldTop
    });

    /*
    * GET /api/wazuh-stats/overview/alerts
    * Returns overview stats about alerts
    *
    **/
    /*server.route({
        method: 'GET',
        path: '/api/wazuh-stats/overview/alerts',
        handler: statsOverviewAlerts
    });*/

    /*
    * GET /api/wazuh-stats/overview/syscheck
    * Returns overview stats about syscheck
    *
    **/
    /*server.route({
        method: 'GET',
        path: '/api/wazuh-stats/overview/syscheck',
        handler: statsOverviewSyscheck
    })*/
};
