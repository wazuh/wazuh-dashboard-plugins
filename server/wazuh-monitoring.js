module.exports = function (server, options) {

	  // External libraries
    const client = server.plugins.elasticsearch.client;
    const fs = require('fs');
    const path = require('path');
    var colors = require('ansicolors');
    var cron = require('node-cron');
    var needle = require('needle');

    // Declare variables
    var api_user;
    var api_pass;
    var api_url;
    var api_insecure;
    var api_port;

    // Initialize
    var blueWazuh = colors.blue('wazuh');
    var agentsArray = [];
    const KIBANA_FIELDS_FILE = 'scripts/integration_files/kibana_fields_file.json';
    var kibana_fields_data = {};



    var loadCredentials = function (apiEntries) {

		if ( typeof apiEntries === 'undefined' || typeof apiEntries.hits === 'undefined')
			return;

			apiEntries.hits.forEach(function (element) {
				var apiEntry = { 'user': element._source.api_user, 'password': new Buffer(element._source.api_password, 'base64').toString("ascii"), 'url': element._source.url, 'port': element._source.api_port, 'insecure': element._source.insecure }

				if (apiEntry.error) {
					server.log([blueWazuh, 'server', 'error'], '[Wazuh agents monitoring] Error getting wazuh-api data: ' + json.error);
					return;
				}


				checkAndSaveStatus(apiEntry);

			});
    }

    var checkAndSaveStatus = function (apiEntry) {

		apiEntry.user;
		apiEntry.password;
		apiEntry.url;
		apiEntry.insecure;
		apiEntry.port;

        var payload = {
            'offset': 0,
            'limit': 1,
        };

        var options = {
            headers: { 'api-version': 'v1.3.0' },
            username: apiEntry.user,
            password: apiEntry.password,
            rejectUnauthorized: !apiEntry.insecure
        };


        needle.request('get', apiEntry.url + ':' + apiEntry.port +'/agents', payload, options, function (error, response) {

            if (!error && response.body.data && response.body.data.totalItems) {
                checkStatus(apiEntry, response.body.data.totalItems);

            } else {
                server.log([blueWazuh, 'server', 'error'], '[Wazuh agents monitoring] Wazuh API credentials not found or are not correct. Open the app in your browser and configure it for start monitoring agents.');
                return;
            }
        });
    };

    var checkStatus = function (apiEntry, maxSize, offset) {
        if (!maxSize) {
            server.log([blueWazuh, 'server', 'error'], '[Wazuh agents monitoring] You must provide a max size');
        }

        var payload = {
            'offset': offset ? offset : 0,
            'limit': (250 < maxSize) ? 250 : maxSize
        };

        var options = {
            headers: { 'api-version': 'v1.3.0' },
            username: apiEntry.user,
            password: apiEntry.password,
            rejectUnauthorized: !apiEntry.insecure
        };

        needle.request('get', apiEntry.url + ':' + apiEntry.port + '/agents', payload, options, function (error, response) {
            if (!error && response.body.data.items) {
                agentsArray = agentsArray.concat(response.body.data.items);
                if ((payload.limit + payload.offset) < maxSize) {
                    checkStatus(apiEntry, response.body.data.totalItems, payload.limit + payload.offset);
                } else {
                    saveStatus();
                }
            } else {
                server.log([blueWazuh, 'server', 'error'], '[Wazuh agents monitoring] Wazuh api credentials not found or are not correct. Open the app in your browser and configure it for start monitoring agents.');
                return;
            }
        });
    };

    var saveStatus = function () {
        var fDate = new Date().toISOString().replace(/T/, '-').replace(/\..+/, '').replace(/-/g, '.').replace(/:/g, '').slice(0, -7);

        var todayIndex = 'wazuh-monitoring-' + fDate;

        client.indices.exists({ index: todayIndex }).then(
            function (result) {
                if (result) {
                    _elInsertData(todayIndex);
                } else {
                    _elCreateIndex(todayIndex);
                }
            }, function () {
                server.log([blueWazuh, 'server', 'error'], '[Wazuh agents monitoring] Could not check if the index ' + todayIndex + ' exists.');
            }
        );
    };

    var _elCreateIndex = function (todayIndex) {
        client.indices.create({ index: todayIndex }).then(
            function () {
                client.indices.putMapping({ index: todayIndex, type: 'agent', body: { properties: { '@timestamp': { 'type': "date" }, 'status': { 'type': "keyword" }, 'ip': { 'type': "keyword" }, 'host': { 'type': "keyword" } ,'name': { 'type': "keyword" }, 'id': { 'type': "keyword" } } } }).then(
                    function () {
                        _elInsertData(todayIndex);
                    }, function () {
                        server.log([blueWazuh, 'server', 'error'], '[Wazuh agents monitoring] Error setting mapping while creating ' + todayIndex + ' index on elasticsearch.');
                    });
            }, function () {
                server.log([blueWazuh, 'server', 'error'], '[Wazuh agents monitoring] Could not create ' + todayIndex + ' index on elasticsearch.');
            }
        );
    };

    var _elInsertData = function (todayIndex) {
        var body = '';
		if(agentsArray.length > 0) {
			var managerName = agentsArray[0].name;
			agentsArray.forEach(function (element) {
				body += '{ "index":  { "_index": "' + todayIndex + '", "_type": "agent" } }\n';
				var date = new Date(Date.now()).toISOString();
				element["@timestamp"] = date;
				element["host"] = managerName;
				body += JSON.stringify(element) + "\n";
			});
			if (body == '') {
				return;
			}
			client.bulk({
				index: todayIndex,
				type: 'agent',
				body: body
			}).then(function () {
				agentsArray.length = 0;
			}, function (err) {
				server.log([blueWazuh, 'server', 'error'], '[Wazuh agents monitoring] Error inserting agent data into elasticsearch. Bulk request failed.');
			});
		}
    };

    var getConfig = function (callback) {
        client.search({ index: '.kibana', type: 'wazuh-configuration'})
            .then(function (data) {
                if (data.hits.total > 0) {
                    callback(data.hits);
                } else {
                    callback({ 'error': 'no credentials', 'error_code': 1 });
                }
            }, function () {
                callback({ 'error': 'no elasticsearch', 'error_code': 2 });
            });
    };

    var configureKibana = function () {

        try {
          kibana_fields_data = JSON.parse(fs.readFileSync(path.resolve(__dirname, KIBANA_FIELDS_FILE), 'utf8'));
        } catch (e) {
          server.log([blueWazuh, 'initialize', 'error'], 'Could not read the mapping file.');
          server.log([blueWazuh, 'initialize', 'error'], 'Path: ' + KIBANA_FIELDS_FILE);
          server.log([blueWazuh, 'initialize', 'error'], 'Exception: ' + e);
        };

        return client.create({ index: '.kibana', type: 'index-pattern', id: 'wazuh-monitoring-*', body: { title: 'wazuh-monitoring-*', timeFieldName: '@timestamp', fields: kibana_fields_data.wazuh_monitoring} });
    };

    server.log([blueWazuh, 'server', 'info'], '[Wazuh agents monitoring] Creating today index...');
    saveStatus();
    server.log([blueWazuh, 'server', 'info'], '[Wazuh agents monitoring] Configuring Kibana for working with "wazuh-monitoring-*" index pattern...');
    configureKibana().then(function () {
        server.log([blueWazuh, 'server', 'info'], '[Wazuh agents monitoring] Successfully initialized!');
    }, function (response) {
        if (response.statusCode != '409') {
            server.log([blueWazuh, 'server', 'error'], '[Wazuh agents monitoring] Could not configure "wazuh-monitoring-*" index pattern. Please, configure it manually on Kibana.');
        } else {
            server.log([blueWazuh, 'server', 'info'], '[Wazuh agents monitoring] Skipping "wazuh-monitoring-*" index pattern configuration: Already configured.');
        }
    });
    cron.schedule('0 */10 * * * *', function () {
        agentsArray.length = 0;
        getConfig(loadCredentials);
    }, true);

}
