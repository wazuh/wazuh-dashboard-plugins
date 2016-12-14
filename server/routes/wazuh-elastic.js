module.exports = function (server, options) {

    const client = server.plugins.elasticsearch.client;
    const payloads = {
        getFieldTop: { "size": 1, "query": { "bool": { "must": [{ "query_string": { "query": "*", "analyze_wildcard": true } }, { "range": { "@timestamp": { "gte": '', "format": "epoch_millis" } } }], "must_not": [] } }, "aggs": { "2": { "terms": { "field": '', "size": 1, "order": { "_count": "desc" } } } } },
        getLastField: { "size": 1, "query": { "bool": { "must": [{ "exists": { "field": '' } }, { "query_string": { "query": "*" } }], "must_not": [{}] } }, "sort": [{ "@timestamp": { "order": "desc", "unmapped_type": "boolean" } }] },
        statsOverviewAlerts: [{ "size": 0, "query": { "bool": { "must": [{ "query_string": { "query": "*", "analyze_wildcard": true } }, { "range": { "@timestamp": { "gte": '', "format": "epoch_millis" } } }], "must_not": [] } }, "aggs": {} },
            { "size": 0, "query": { "bool": { "must": [{ "query_string": { "query": "*", "analyze_wildcard": true } }, { "range": { "@timestamp": { "gte": '', "format": "epoch_millis" } } }], "must_not": [] } }, "aggs": { "2": { "terms": { "field": "srcip", "size": 1, "order": { "_count": "desc" } } } } },
            { "size": 0, "query": { "bool": { "must": [{ "query_string": { "query": "*", "analyze_wildcard": true } }, { "range": { "@timestamp": { "gte": '', "format": "epoch_millis" } } }], "must_not": [] } }, "aggs": { "2": { "terms": { "field": "rule.groups", "size": 1, "order": { "_count": "desc" } } } } }],
        statsOverviewSyscheck: [{ "size": 0, "query": { "bool": { "must": [{ "query_string": { "query": "rule.groups:syscheck", "analyze_wildcard": true } }, { "range": { "@timestamp": { "gte": '', "format": "epoch_millis" } } }], "must_not": [] } }, "aggs": {} },
            { "size": 0, "query": { "bool": { "must": [{ "query_string": { "query": "rule.groups:syscheck", "analyze_wildcard": true } }, { "range": { "@timestamp": { "gte": '', "format": "epoch_millis" } } }], "must_not": [] } }, "aggs": { "2": { "terms": { "field": "AgentName", "size": 1, "order": { "_count": "desc" } } } } },
            { "size": 0, "query": { "bool": { "must": [{ "query_string": { "query": "*", "analyze_wildcard": true } }, { "range": { "@timestamp": { "gte": '', "format": "epoch_millis" } } }], "must_not": [] } }, "aggs": { "2": { "terms": { "field": "SyscheckFile.path", "size": 1, "order": { "_count": "desc" } } } } }]
    };

    //Handlers - stats

    var fetchElastic = function (payload) {
        return client.search({ index: 'wazuh-alerts-*', type: 'wazuh', body: payload });
    };

    var getFieldTop = function (req, reply) {
        var filtering = false;

        // is date defined? or must use 24h ?
        var date = new Date();
        date.setDate(date.getDate() - 1);
        date = date.getTime();

        const timeAgo = req.params.time ? encodeURIComponent(req.params.time) : date;

        if (req.params.fieldValue && req.params.fieldFilter)
            filtering = true;

		var payload = JSON.parse(JSON.stringify(payloads.getFieldTop));
		
        if (filtering) {
            payload.query.bool.must[0].query_string.query = req.params.fieldFilter + ":" + req.params.fieldValue + " AND host: " + req.params.manager;
        }else{
            payload.query.bool.must[0].query_string.query = "host: " + req.params.manager;
		}

        payload.query.bool.must[1].range['@timestamp'].gte = timeAgo;
        payload.aggs['2'].terms.field = req.params.field;
		

        fetchElastic(payload).then(function (data) {

            if (data.hits.total == 0 || typeof data.aggregations['2'].buckets[0] === 'undefined')
                reply({ 'statusCode': 200, 'data': '' });
            else
                reply({ 'statusCode': 200, 'data': data.aggregations['2'].buckets[0].key });
        }, function () {
            reply({ 'statusCode': 500, 'error': 9, 'message': 'Could not get data from elasticsearch' }).code(500);
        });
    };

    var getLastField = function (req, reply) {
        var filtering = false;
		var filterArray = {};
		var termArray = {};
		
        if (req.params.fieldValue && req.params.fieldFilter)
            filtering = true;

		var payload = JSON.parse(JSON.stringify(payloads.getLastField));
		payload.query.bool.must[0].exists.field = req.params.field;
		
		filterArray["host"] = req.params.manager;
		termArray = { "term": filterArray };
		payload.query.bool.must.push(termArray);
		filterArray = {};
		termArray = {};			
			
        if (filtering) {
            filterArray[req.params.fieldFilter] = req.params.fieldValue;
            termArray = { "term": filterArray };
            payload.query.bool.must.push(termArray);	
        }
		
        fetchElastic(payload).then(function (data) {
			
            if (data.hits.total == 0 || typeof data.hits.hits[0] === 'undefined')
                reply({ 'statusCode': 200, 'data': '' });
            else
                reply({ 'statusCode': 200, 'data': data.hits.hits[0]._source[req.params.field] });
        }, function () {
            reply({ 'statusCode': 500, 'error': 9, 'message': 'Could not get data from elasticsearch' }).code(500);
        });
    };

    var statsOverviewAlerts = function (req, reply) {
        var gte = new Date() - (24 * 3600);

        var _payloads = payloads.statsOverviewAlerts;

        var _data = [];

        _payloads[0].query.bool.must[1].range['@timestamp'].gte = gte;
        _payloads[1].query.bool.must[1].range['@timestamp'].gte = gte;
        _payloads[2].query.bool.must[1].range['@timestamp'].gte = gte;

        fetchElastic(_payloads[0]).then(function (data) {
            _data['alerts'] = data.hits.total;
            fetchElastic(_payloads[1]).then(function (data) {
                if (data.hits.total == 0)
                    _data['ip'] = '-';
                else
                    _data['ip'] = data.aggregations['2'].buckets[0].key;
                fetchElastic(_payloads[2]).then(function (data) {
                    if (data.hits.total == 0)
                        _data['group'] = '-';
                    else
                        _data['group'] = data.aggregations['2'].buckets[0].key;
                    reply({ 'statusCode': 200, 'data': { 'alerts': _data['alerts'], 'ip': _data['ip'], 'group': _data['group'] } });
                }, function () {
                    reply({ 'statusCode': 500, 'error': 9, 'message': 'Could not get data from elasticsearch' }).code(500);
                });
            }, function () {
                reply({ 'statusCode': 500, 'error': 9, 'message': 'Could not get data from elasticsearch' }).code(500);
            });
        }, function () {
            reply({ 'statusCode': 500, 'error': 9, 'message': 'Could not get data from elasticsearch' }).code(500);
        });
    };

    var statsOverviewSyscheck = function (req, reply) {
        var gte = new Date() - (24 * 3600);

        var _payloads = payloads.statsOverviewSyscheck;

        var _data = [];

        _payloads[0].query.bool.must[1].range['@timestamp'].gte = gte;
        _payloads[1].query.bool.must[1].range['@timestamp'].gte = gte;
        _payloads[2].query.bool.must[1].range['@timestamp'].gte = gte;

        fetchElastic(_payloads[0]).then(function (data) {
            data['alerts'] = data.hits.total;
            fetchElastic(_payloads[1]).then(function (data) {
                if (data.hits.total == 0)
                    _data['agent'] = '-';
                else
                    _data['agent'] = data.aggregations['2'].buckets[0].key;
                fetchElastic(_payloads[2]).then(function (data) {
                    if (data.hits.total == 0)
                        _data['file'] = '-';
                    else
                        _data['file'] = data.aggregations['2'].buckets[0].key;
                    reply({ 'statusCode': 200, 'data': { 'alerts': _data['alerts'], 'agent': _data['agent'], 'file': _data['file'] } });
                }, function () {
                    reply({ 'statusCode': 500, 'error': 9, 'message': 'Could not get data from elasticsearch' }).code(500);
                });
            }, function () {
                reply({ 'statusCode': 500, 'error': 9, 'message': 'Could not get data from elasticsearch' }).code(500);
            });
        }, function () {
            reply({ 'statusCode': 500, 'error': 9, 'message': 'Could not get data from elasticsearch' }).code(500);
        });
    };

    //Server routes 

    /*
    * GET /api/wazuh-stats/top/agent
    * Returns the agent with most alerts
    *
    **/
    server.route({
        method: 'GET',
        path: '/api/wazuh-elastic/top/{manager}/{field}/{time?}',
        handler: getFieldTop
    });

	/*
    * GET /api/wazuh-stats/top/agent
    * Returns the agent with most alerts
    *
    **/
    server.route({
        method: 'GET',
        path: '/api/wazuh-elastic/top/{manager}/{field}/{time}/{fieldFilter}/{fieldValue}',
        handler: getFieldTop
    });

    /*
    * GET /api/wazuh-stats/last/AgentName
    * Return last field value
    *
    **/
    server.route({
        method: 'GET',
        path: '/api/wazuh-elastic/last/{manager}/{field}',
        handler: getLastField
    });
    /*
	
	/*
    * GET /api/wazuh-stats/last/AgentName/ID/005
    * Return last field value
    *
    **/
    server.route({
        method: 'GET',
        path: '/api/wazuh-elastic/last/{manager}/{field}/{fieldFilter}/{fieldValue}',
        handler: getLastField
    });
};