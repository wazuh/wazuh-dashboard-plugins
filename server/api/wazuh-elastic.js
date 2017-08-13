module.exports = function (server, options) {

	// Colors for console logging
    const colors = require('ansicolors');
    const blueWazuh = colors.blue('wazuh');

	// Elastic JS Client
	const serverConfig = server.config();
	const elasticsearch = require('elasticsearch');
	const elasticRequest = server.plugins.elasticsearch.getCluster('data');

	var index_pattern = "wazuh-alerts-*";
	var index_pattern_wazuh_monitoring = "wazuh-monitoring-*";
	var index_prefix = "wazuh-alerts-";
	const fs = require('fs');
	const path = require('path');
	const KIBANA_FIELDS_FILE = '../startup/integration_files/kibana_fields_file.json';
	var kibana_fields_data = {};

    const payloads = {
        getFieldTop: { "size": 1, "query": { "bool": { "must": [{ "query_string": { "query": "*", "analyze_wildcard": true } }, { "range": { "@timestamp": { "gte": '', "format": "epoch_millis" } } }], "must_not": [] } }, "aggs": { "2": { "terms": { "field": '', "size": 1, "order": { "_count": "desc" } } } } },
        getLastField: { "size": 1, "query": { "bool": { "must": [{ "exists": { "field": '' } }, { "query_string": { "query": "*" } }], "must_not": [{}] } }, "sort": [{ "@timestamp": { "order": "desc", "unmapped_type": "boolean" } }] }
    };

    //Handlers

    var fetchElastic = function (req, payload) {
		return elasticRequest.callWithRequest(req, 'search', { index: 'wazuh-alerts-*', type: 'wazuh', body: payload });
    };

	// Returns alerts count for fields/value array between timeGTE and timeLT
    var alertsCount = function (req, reply) {

    		var payload = {"size": 1,"query": {"bool": {"must": [], "filter": {"range": {"@timestamp": {}}}}}};

    		// Set up time interval, default to Last 24h
        const timeGTE = req.payload.timeinterval.gte ? req.payload.timeinterval.gte : "now-1d";
        const timeLT = req.payload.timeinterval.lt ? req.payload.timeinterval.lt : "now";
    		payload.query.bool.filter.range['@timestamp']["gte"] = timeGTE;
    		if(timeLT != "now")
    			payload.query.bool.filter.range['@timestamp']["lte"] = timeLT;
    		else
    			payload.query.bool.filter.range['@timestamp']["lt"] = timeLT;

    		// Set up match for default cluster name
    		payload.query.bool.must.push({"match": {"cluster.name": req.payload.cluster}});

    		// Set up match for different pairs field/value
    		req.payload.fields.forEach(function(item) {
    			var obj = {};
    			obj[item.field] = item.value;
    			payload.query.bool.must.push({"match": obj});
    		})


        fetchElastic(req, payload).then(function (data) {
            reply({ 'statusCode': 200, 'data': data.hits.total });
        }, function () {
            reply({ 'statusCode': 500, 'error': 9, 'message': 'Could not get data from elasticsearch' }).code(500);
        });
    };

    var getFieldTop = function (req, reply) {

		    // Top field payload
		    var payload = {"size":1,"query":{"bool":{"must":[],"filter":{"range":{"@timestamp":{}}}}},"aggs":{"2":{"terms":{"field":"","size":1,"order":{"_count":"desc"}}}}}

        // Set up time interval, default to Last 24h
        const timeGTE = "now-1d";
        const timeLT = "now";
    		payload.query.bool.filter.range['@timestamp']["gte"] = timeGTE;
    		payload.query.bool.filter.range['@timestamp']["lt"] = timeLT;

    		// Set up match for default cluster name
    		payload.query.bool.must.push({"match": {"cluster.name": req.params.cluster}});
        payload.aggs['2'].terms.field = req.params.field;

        fetchElastic(req, payload).then(function (data) {

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

    		filterArray["host"]["cluster.name"] = req.params.cluster;
    		termArray = { "term": filterArray };
    		payload.query.bool.must.push(termArray);
    		filterArray = {};
    		termArray = {};

        if (filtering) {
            filterArray[req.params.fieldFilter] = req.params.fieldValue;
            termArray = { "term": filterArray };
            payload.query.bool.must.push(termArray);
        }

        fetchElastic(req, payload).then(function (data) {

            if (data.hits.total == 0 || typeof data.hits.hits[0] === 'undefined')
                reply({ 'statusCode': 200, 'data': '' });
            else
                reply({ 'statusCode': 200, 'data': data.hits.hits[0]._source[req.params.field] });
        }, function () {
            reply({ 'statusCode': 500, 'error': 9, 'message': 'Could not get data from elasticsearch' }).code(500);
        });
    };

	var getSetupInfo = function (req, reply) {
		elasticRequest.callWithRequest(req, 'search', { index: '.wazuh', type: 'wazuh-setup' })
			.then(function (data) {
				if (data.hits.total == 0) {
					reply({ 'statusCode': 200, 'data': '' });
				}
				else {
					reply({ 'statusCode': 200, 'data': data.hits.hits[0]._source });
				}
			}, function (error) {
				console.log(error);
				reply({ 'statusCode': 500, 'error': 9, 'message': 'Could not get data from elasticsearch' }).code(500);
			});
    };

	var putWazuhAlertsPattern = function (req, reply) {

		try {
			kibana_fields_data = JSON.parse(fs.readFileSync(path.resolve(__dirname, KIBANA_FIELDS_FILE), 'utf8'));
			// Get fields index pattern template  (wazuh-alerts-*)
			var wazuhAlerts_indexPattern_template = JSON.parse(kibana_fields_data.wazuh_alerts)
			var wazuhAlerts_indexPattern_current = {};
			var responseBack = {};
			var fields = [];
			for (var i = 0, len = wazuhAlerts_indexPattern_template.length; i < len; i++) {
				fields.push(wazuhAlerts_indexPattern_template[i].name);
			}

			// Get current fields index pattern (wazuh-alerts-*)
			elasticRequest.callWithInternalUser('get', {
				index: '.kibana',
				type: 'index-pattern',
				id: index_pattern
			}).then(
				function (response) {
					wazuhAlerts_indexPattern_current = JSON.parse(response._source.fields);
					// Compare and update fields properties
					for (var i = 0, len = wazuhAlerts_indexPattern_current.length; i < len; i++) {
						if (fields.indexOf(wazuhAlerts_indexPattern_current[i].name) >= 0) {
							wazuhAlerts_indexPattern_current[i].searchable = true;
							wazuhAlerts_indexPattern_current[i].aggregatable = true;
						}
					}
					// Update index pattern  (wazuh-alerts-*)
					elasticRequest.callWithInternalUser('update', {
						index: '.kibana',
						type: 'index-pattern',
						id: index_pattern,
						body: {
							doc: {
								fields: JSON.stringify((wazuhAlerts_indexPattern_current))
							}
						}
					}).then(
						function (response) {
							reply({ 'response': response}).code(200);
						}, function (error) {
							reply({ 'response': error, 'error' : '1'}).code(error.statusCode);
						}
					);
				}, function (error) {
					// Create index pattern
					elasticRequest.callWithInternalUser('create', {
						index: '.kibana',
						type: 'index-pattern',
						id: index_pattern,
						body: {
							title: index_pattern,
							timeFieldName: '@timestamp',
							fields: kibana_fields_data.wazuh_alerts
						}
					}).then(
					function (response) {
							reply({ 'response': response}).code(200);
					}, function (error) {
							reply({ 'response': error, 'error' : '2'}).code(error.statusCode);
					});
				}
			);

		} catch (e) {
			  server.log([blueWazuh, 'initialize', 'error'], 'Could not read the mapping file.');
			  server.log([blueWazuh, 'initialize', 'error'], 'Path: ' + KIBANA_FIELDS_FILE);
			  server.log([blueWazuh, 'initialize', 'error'], 'Exception: ' + e);
		};
    };
	var putWazuhMonitoringPattern = function (req, reply) {

		try {
			kibana_fields_data = JSON.parse(fs.readFileSync(path.resolve(__dirname, KIBANA_FIELDS_FILE), 'utf8'));
			// Check if wazuh-monitoring-* exists
			elasticRequest.callWithInternalUser('get', {
				index: '.kibana',
				type: 'index-pattern',
				id: index_pattern_wazuh_monitoring
			}).then(
				function (response) {
					// Update index pattern  (wazuh-monitoring-*)
					elasticRequest.callWithInternalUser('update', {
						index: '.kibana',
						type: 'index-pattern',
						id: index_pattern_wazuh_monitoring,
						body: {
							doc: {
								fields: kibana_fields_data.wazuh_monitoring
							}
						}
					}).then(
						function (response) {
							reply({ 'response': response}).code(200);
						}, function (error) {
							reply({ 'response': error }).code(error.statusCode);
						}
					);
				}, function (error) {
					// Create index pattern
					elasticRequest.callWithInternalUser('create', {
						index: '.kibana',
						type: 'index-pattern',
						id: index_pattern_wazuh_monitoring,
						body: {
							title: index_pattern_wazuh_monitoring,
							timeFieldName: '@timestamp',
							fields: kibana_fields_data.wazuh_monitoring
						}
					}).then(
					function (response) {
							reply({ 'response': response}).code(200);
					}, function (error) {
							reply({ 'response': error, 'error' : '2'}).code(error.statusCode);
					});
				}
			);
		} catch (e) {
			  server.log([blueWazuh, 'initialize', 'error'], 'Could not read the mapping file.');
			  server.log([blueWazuh, 'initialize', 'error'], 'Path: ' + KIBANA_FIELDS_FILE);
			  server.log([blueWazuh, 'initialize', 'error'], 'Exception: ' + e);
		};
	}

    //Server routes

    /*
    * GET /api/wazuh-elastic/top/{cluster}/{field}/{time?}
    * Returns the agent with most alerts
    *
    **/
    server.route({
        method: 'GET',
        path: '/api/wazuh-elastic/top/{cluster}/{field}/{time?}',
        handler: getFieldTop
    });

	/*
    * GET /api/wazuh-elastic/top/{cluster}/{field}/{fieldFilter}/{fieldValue}/{time?}
    * Returns the agent with most alerts
    *
    **/
    server.route({
        method: 'GET',
        path: '/api/wazuh-elastic/top/{cluster}/{field}/{fieldFilter}/{fieldValue}/{time?}',
        handler: getFieldTop
    });

	/*
    * GET /api/wazuh-elastic/top/{cluster}/{field}/{fieldFilter}/{fieldValue}/{fieldFilter}/{fieldValue}/{time?}
    * Returns the agent with most alerts
    *
    **/
    server.route({
        method: 'GET',
        path: '/api/wazuh-elastic/top/{cluster}/{field}/{fieldFilter}/{fieldValue}/{fieldFilter2}/{fieldValue2}/{time?}',
        handler: getFieldTop
    });

	/*
    * /api/wazuh-elastic/alerts-count
    * Returns alerts count for fields/value array between timeGTE and timeLT
    * @params: fields[{field,value}], cluster, timeinterval{gte,lte}
    **/
    server.route({
        method: 'POST',
        path: '/api/wazuh-elastic/alerts-count/',
        handler: alertsCount
    });
    /*
    * GET /api/wazuh-elastic/last/{cluster}/{field}
    * Return last field value
    *
    **/
    server.route({
        method: 'GET',
        path: '/api/wazuh-elastic/last/{cluster}/{field}',
        handler: getLastField
    });
    /*

	/*
    * GET /api/wazuh-elastic/last/{cluster}/{field}/{fieldFilter}/{fieldValue}
    * Return last field value
    *
    **/
    server.route({
        method: 'GET',
        path: '/api/wazuh-elastic/last/{cluster}/{field}/{fieldFilter}/{fieldValue}',
        handler: getLastField
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
    * PUT /api/wazuh-elastic/wazuh-pattern
    * Set wazuh index pattern
    *
    **/
    server.route({
        method: 'PUT',
        path: '/api/wazuh-elastic/wazuh-alerts-pattern',
        handler: putWazuhAlertsPattern
    });

	/*
    * PUT /api/wazuh-elastic/wazuh-pattern
    * Set wazuh index pattern
    *
    **/
    server.route({
        method: 'PUT',
        path: '/api/wazuh-elastic/wazuh-monitoring-pattern',
        handler: putWazuhMonitoringPattern
    });
};
