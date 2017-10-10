module.exports = function (server, options) {
	// Colors for console logging
    const colors = require('ansicolors');
    const blueWazuh = colors.blue('wazuh');

	// Elastic JS Client
	const elasticRequest = server.plugins.elasticsearch.getCluster('data');

	var index_pattern = "wazuh-alerts-*";
	var index_pattern_wazuh_monitoring = "wazuh-monitoring-*";
	var index_prefix = "wazuh-alerts-";
	const fs = require('fs');
	const path = require('path');
	const KIBANA_FIELDS_FILE = '../startup/integration_files/kibana_fields_file.json';
	var kibana_fields_data = {};

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
        }, function (data) {
            console.log(data);
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

	var getSetupInfo = function (req, reply) {
		elasticRequest.callWithRequest(req, 'search', { index: '.wazuh-version', type: 'wazuh-version' })
			.then(function (data) {
				if (data.hits.total == 0) {
					reply({ 'statusCode': 200, 'data': '' });
				}
				else {
					reply({ 'statusCode': 200, 'data': data.hits.hits[0]._source });
				}
			}, function (error) {
				reply({ 'statusCode': 500, 'error': 9, 'message': 'Could not get data from elasticsearch' }).code(500);
			});
    };

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
    * GET /api/wazuh-elastic/setup
    * Return Wazuh Appsetup info
    *
    **/
    server.route({
        method: 'GET',
        path: '/api/wazuh-elastic/setup',
        handler: getSetupInfo
    });
};
