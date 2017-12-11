const importAppObjects = require('../initialize');

module.exports = (server, options) => {

    // Elastic JS Client
    const elasticRequest = server.plugins.elasticsearch.getCluster('data');

    //Handlers
    const fetchElastic = (req, payload) => {
        return elasticRequest.callWithRequest(req, 'search', {
            index: 'wazuh-alerts-3.x-*',
            type:  'wazuh',
            body:  payload
        });
    };

    const getConfig = (callback) => {
        elasticRequest
        .callWithInternalUser('search', {
            index: '.wazuh',
            type:  'wazuh-configuration',
            q:     'active:true'
        })
        .then((data) => {
                if (data.hits.total === 1) {
                    callback({
                        'user':         data.hits.hits[0]._source.api_user,
                        'password':     Buffer.from(data.hits.hits[0]._source.api_password, 'base64').toString("ascii"),
                        'url':          data.hits.hits[0]._source.url,
                        'port':         data.hits.hits[0]._source.api_port,
                        'insecure':     data.hits.hits[0]._source.insecure,
                        'cluster_info': data.hits.hits[0]._source.cluster_info,
                        'extensions':   data.hits.hits[0]._source.extensions
                    });
                } else {
                    callback({
                        'error':      'no credentials',
                        'error_code': 1
                    });
                }
        })
        .catch((error) => {
            callback({
                'error':      'no elasticsearch',
                'error_code': 2
            });
        });
    };

    // Updating Wazuh app visualizations and dashboards
    const updateAppObjects = (req, reply) => {
        elasticRequest.callWithInternalUser('deleteByQuery', { 
            index: '.kibana', 
            body: {
                'query': {
                    'bool': {
                        'must': {
                            'match': {
                                "visualization.title": 'Wazuh App*'
                            }
                        },
                        'must_not': {
                            "match": {
                                "visualization.title": 'Wazuh App Overview General Agents status'
                            }
                        }
                    }
                }
            } 
        })
        .then((resp) => {
            // Update the pattern in the configuration
            elasticRequest.callWithInternalUser('update', { 
                index: '.wazuh-version', 
                type: 'wazuh-version', 
                id: '1', 
                body: {
                    'doc': {
                        "index-pattern": req.params.pattern
                    }
                } 
            })
            .then((resp) => {
                importAppObjects(req.params.pattern);
                reply({
                    'statusCode': 200,
                    'data':       'Index pattern updated'
                });
            })
            .catch((err) => {
                reply({
                    'statusCode': 500,
                    'error':      9,
                    'message':    'Could not update the pattern in the configuration'
                }).code(500);
            });
        })
        .catch((err) => {
            reply({
                'statusCode': 500,
                'error':      9,
                'message':    'Could not delete visualizations'
            }).code(500);
        });
    };

    const getFieldTop = (req, reply) => {

        // Top field payload
        var payload = {
            "size": 1,
            "query": {
                "bool": {
                    "must": [],
                    "filter": {
                        "range": {
                            "@timestamp": {}
                        }
                    }
                }
            },
            "aggs": {
                "2": {
                    "terms": {
                        "field": "",
                        "size": 1,
                        "order": {
                            "_count": "desc"
                        }
                    }
                }
            }
        };

        // Set up time interval, default to Last 24h
        const timeGTE = 'now-1d';
        const timeLT  = 'now';
        payload.query.bool.filter.range['@timestamp']['gte'] = timeGTE;
        payload.query.bool.filter.range['@timestamp']['lt']  = timeLT;

        if (req.params.mode === 'cluster') {
            // Set up match for default cluster name
            payload.query.bool.must.push({
                "match": {
                    "cluster.name": req.params.cluster
                }
            });
        } else {
            // Set up match for default cluster name
            payload.query.bool.must.push({
                "match": {
                    "manager.name": req.params.cluster
                }
            });
        }

        payload.aggs['2'].terms.field = req.params.field;

        fetchElastic(req, payload)
        .then((data) => {

            if (data.hits.total === 0 || typeof data.aggregations['2'].buckets[0] === 'undefined'){
                reply({
                    'statusCode': 200,
                    'data':       ''
                });
            } else {
                reply({
                    'statusCode': 200,
                    'data':       data.aggregations['2'].buckets[0].key
                });
            }
        })
        .catch((error) => {
            reply({
                'statusCode': 500,
                'error':      9,
                'message':    'Could not get data from elasticsearch'
            }).code(500);
        });
    };

    const getSetupInfo = (req, reply) => {
        elasticRequest
        .callWithInternalUser('search', {
                index: '.wazuh-version',
                type: 'wazuh-version'
        })
        .then((data) => {
            if (data.hits.total === 0) {
                reply({
                    'statusCode': 200,
                    'data':       ''
                });
            } else {
                reply({
                    'statusCode': 200,
                    'data':       data.hits.hits[0]._source
                });
            }
        })
        .catch((error) => {
            reply({
                'statusCode': 500,
                'error':      9,
                'message':    'Could not get data from elasticsearch'
            }).code(500);
        });
    };

    module.exports = getConfig;

    //Server routes

    /*
     * GET /api/wazuh-elastic/top/{cluster}/{field}/{time?}
     * Returns the agent with most alerts
     *
     **/
    server.route({
        method: 'GET',
        path: '/api/wazuh-elastic/top/{mode}/{cluster}/{field}',
        handler: getFieldTop
    });

    /*
     * GET /api/wazuh-elastic/setup
     * Return Wazuh Appsetup info
     *
     **/
    server.route({
        method: 'GET',
        path: '/api/wazuh-elastic/setup',
        handler: getSetupInfo
    });

    /*
     * POST /api/wazuh-elastic/updatePattern
     * Update the index pattern in the app visualizations
     *
     **/
    server.route({
        method: 'GET',
        path: '/api/wazuh-elastic/updatePattern/{pattern}',
        handler: updateAppObjects
    });
};