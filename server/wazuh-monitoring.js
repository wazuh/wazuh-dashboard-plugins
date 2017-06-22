module.exports = function (server, options) {


	// Elastic JS Client
	const serverConfig = server.config();
	const elasticsearch = require('elasticsearch');
	const elasticRequest = server.plugins.elasticsearch.getCluster('admin');

	// External libraries
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
	var wazuh_config = {};

	// Initialize
	var blueWazuh = colors.blue('wazuh');
	var agentsArray = [];
	const KIBANA_FIELDS_FILE = 'startup/integration_files/kibana_fields_file.json';
	const TEMPLATE_FILE = 'startup/integration_files/template_file.json';
	const MONITORING_SAMPLE_FILE = 'startup/integration_files/monitoring_sample.json';
    const wazuh_config_file = '../configuration/config.json';
    const wazuh_temp_file = '../configuration/.patch_version';
    var wazuh_api_version;
	var monitoring_sample = {};
	var kibana_fields_data = {};
	var map_jsondata = {};
	var index_pattern = "wazuh-monitoring-*";
	var index_prefix = "wazuh-monitoring-";

	var fDate = new Date().toISOString().replace(/T/, '-').replace(/\..+/, '').replace(/-/g, '.').replace(/:/g, '').slice(0, -7);
	var todayIndex = index_prefix + fDate;

    // Read Wazuh App configuration file
    if(fs.existsSync(path.resolve(__dirname, wazuh_temp_file))){
        wazuh_api_version = "v2.0.0";
    } else{
        try {
            wazuh_config = JSON.parse(fs.readFileSync(path.resolve(__dirname, wazuh_config_file), 'utf8'));
            wazuh_api_version = wazuh_config.wazuhapi.version;
        } catch (e) {
            server.log([blueWazuh, 'initialize', 'error'], 'Could not read the Wazuh configuration file file.');
            server.log([blueWazuh, 'initialize', 'error'], 'Path: ' + wazuh_config_file);
            server.log([blueWazuh, 'initialize', 'error'], 'Exception: ' + e);
        };
    }

	// Load Wazuh API credentials from Elasticsearch document
	var loadCredentials = function (apiEntries) {

		if ( typeof apiEntries === 'undefined' || typeof apiEntries.hits === 'undefined')
			return;

			apiEntries.hits.forEach(function (element) {
				var apiEntry = { 'user': element._source.api_user, 'password': new Buffer(element._source.api_password, 'base64').toString("ascii"), 'url': element._source.url, 'port': element._source.api_port, 'insecure': element._source.insecure }

				if (apiEntry.error) {
					server.log([blueWazuh, 'Wazuh agents monitoring', 'error'], 'Error getting wazuh-api data: ' + json.error);
					return;
				}
				checkAndSaveStatus(apiEntry);
			});
	}

	// Check API status twice and get agents total items
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
			headers: { 'api-version': wazuh_api_version },
			username: apiEntry.user,
			password: apiEntry.password,
			rejectUnauthorized: !apiEntry.insecure
		};


		needle.request('get', apiEntry.url + ':' + apiEntry.port +'/agents', payload, options, function (error, response) {

			if (!error && !response.error && response.body.data && response.body.data.totalItems) {
				checkStatus(apiEntry, response.body.data.totalItems);
			} else {
                needle.request('get', apiEntry.url + ':' + apiEntry.port +'/version', payload, options, function (error, response) {
                    if (!error && !response.error && response.body.data) {
                        server.log([blueWazuh, 'Wazuh agents monitoring', 'error'], 'Wazuh API credentials not found or are not correct. Open the app in your browser and configure it for start monitoring agents.');
                        return;
                    }
                    else{
                        options = {
                            headers: { 'api-version': 'v2.0.0' },
                            username: apiEntry.user,
                            password: apiEntry.password,
                            rejectUnauthorized: !apiEntry.insecure
                        }
                        needle.request('get', apiEntry.url + ':' + apiEntry.port +'/version', payload, options, function (error, response) {
                            if (!error && !response.error && response.body.data) {
                                    fs.writeFile(path.resolve(__dirname, wazuh_temp_file), "#Temporal file to avoid inconsistences when using App 2.0.1 with API 2.0.0",function(err){
                                        if(err) server.log([blueWazuh, 'initialize', 'error'], err);
                                        else{
                                            server.log([blueWazuh, 'initialize', 'info'], 'Temporal file created to use the API 2.0.0');
                                        }
                                    });
                                
                            } else {
                                server.log([blueWazuh, 'initialize', 'error'], 'Wazuh API credentials not found or are not correct. Open the app in your browser and configure it for start monitoring agents.');                        
                            }
                        });
                    }
                });
			}
		});
	};

	// Check status and get agent status array
	var checkStatus = function (apiEntry, maxSize, offset) {
		if (!maxSize) {
			server.log([blueWazuh, 'Wazuh agents monitoring', 'error'], 'You must provide a max size');
		}

		var payload = {
			'offset': offset ? offset : 0,
			'limit': (250 < maxSize) ? 250 : maxSize
		};

		var options = {
			headers: { 'api-version': wazuh_api_version },
			username: apiEntry.user,
			password: apiEntry.password,
			rejectUnauthorized: !apiEntry.insecure
		};

		needle.request('get', apiEntry.url + ':' + apiEntry.port + '/agents', payload, options, function (error, response) {
			if (!error && !response.error && response.body.data.items) {
				agentsArray = agentsArray.concat(response.body.data.items);
				if ((payload.limit + payload.offset) < maxSize) {
					checkStatus(apiEntry, response.body.data.totalItems, payload.limit + payload.offset);
				} else {
					saveStatus();
				}
			} else {
				server.log([blueWazuh, 'Wazuh agents monitoring', 'error'], 'Can not access Wazuh API');
				return;
			}
		});
	};

	// Save agent status into elasticsearch, create index and/or insert document
	var saveStatus = function () {
		elasticRequest.callWithInternalUser('indices.exists',{ index: todayIndex }).then(
			function (result) {
				if (result) {
					insertDocument(todayIndex);
				} else {
					createIndex(todayIndex);
				}
			}, function () {
				server.log([blueWazuh, 'Wazuh agents monitoring', 'error'], 'Could not check if the index ' + todayIndex + ' exists.');
			}
		);
	};

	// Creating wazuh-monitoring index
	var createIndex = function (todayIndex) {
		elasticRequest.callWithInternalUser('indices.create',{ index: todayIndex }).then(
			function () {
				insertDocument(todayIndex);
			}, function () {
				server.log([blueWazuh, 'Wazuh agents monitoring', 'error'], 'Could not create ' + todayIndex + ' index on elasticsearch.');
			}
		);
	};

	// Inserting one document per agent into Elastic. Bulk.
	var insertDocument = function (todayIndex) {
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
			elasticRequest.callWithInternalUser('bulk',
			{
				index: todayIndex,
				type: 'agent',
				body: body
			}).then(function () {
				agentsArray.length = 0;
			}, function (err) {
				server.log([blueWazuh, 'Wazuh agents monitoring', 'error'], 'Error inserting agent data into elasticsearch. Bulk request failed.');
			});
		}
	};

	// Get API configuration from elastic and callback to loadCredentials
	var getConfig = function (callback) {
		elasticRequest.callWithInternalUser('search',{ index: '.kibana', type: 'wazuh-configuration'})
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

	// Load template
	var loadTemplate = function () {
		try {
			map_jsondata = JSON.parse(fs.readFileSync(path.resolve(__dirname, TEMPLATE_FILE), 'utf8'));
		} catch (e) {
			server.log([blueWazuh, 'Wazuh agents monitoring', 'error'], 'Could not read the mapping file.');
			server.log([blueWazuh, 'Wazuh agents monitoring', 'error'], 'Path: ' + TEMPLATE_FILE);
			server.log([blueWazuh, 'Wazuh agents monitoring', 'error'], 'Exception: ' + e);
		};
		elasticRequest.callWithInternalUser('indices.putTemplate',{name: "wazuh", order: 0, body: map_jsondata}).then(
			function () {
				server.log([blueWazuh, 'Wazuh agents monitoring', 'info'], 'Template installed and loaded: ' +  index_pattern);


				try {
					monitoring_sample = JSON.parse(fs.readFileSync(path.resolve(__dirname, MONITORING_SAMPLE_FILE), 'utf8'));
				} catch (e) {
					server.log([blueWazuh, 'Wazuh agents monitoring', 'error'], 'Could not read the mapping file.');
					server.log([blueWazuh, 'Wazuh agents monitoring', 'error'], 'Path: ' + MONITORING_SAMPLE_FILE);
					server.log([blueWazuh, 'Wazuh agents monitoring', 'error'], 'Exception: ' + e);
				};

				// Insert sample alert
				server.log([blueWazuh, 'Wazuh agents monitoring', 'info'], 'Inserting sample alert...');
				elasticRequest.callWithInternalUser('create', { index: todayIndex, type: 'agent', id: 'alert_monitoring_sample', body: monitoring_sample })
					.then(function () {
						server.log([blueWazuh, 'Wazuh agents monitoring', 'info'], 'Sample alert inserted');
					}, function (response) {
						if (response.statusCode != '409') {
							server.log([blueWazuh, 'Wazuh agents monitoring', 'error'], 'Could not insert the sample alert');
						} else {
							server.log([blueWazuh, 'Wazuh agents monitoring', 'info'], 'Skipping alert insertion. Already inserted.');
						}
					});

			}, function (data) {
				server.log([blueWazuh, 'Wazuh agents monitoring', 'error'], 'Could not install template ' +  index_pattern);
			});
	};

	// Configure Kibana patterns.
	var configureKibana = function () {
		loadTemplate();
		try {
		  kibana_fields_data = JSON.parse(fs.readFileSync(path.resolve(__dirname, KIBANA_FIELDS_FILE), 'utf8'));
		} catch (e) {
		  server.log([blueWazuh, 'Wazuh agents monitoring', 'error'], 'Could not read the mapping file.');
		  server.log([blueWazuh, 'Wazuh agents monitoring', 'error'], 'Path: ' + KIBANA_FIELDS_FILE);
		  server.log([blueWazuh, 'Wazuh agents monitoring', 'error'], 'Exception: ' + e);
		};

		return elasticRequest.callWithInternalUser('create',{ index: '.kibana', type: 'index-pattern', id: index_pattern, body: { title: index_pattern, timeFieldName: '@timestamp', fields: kibana_fields_data.wazuh_monitoring} });
	};

	// fetchAgents on demand
   var fetchAgents = function () {
		getConfig(loadCredentials);
		return;
	};

	// Wait until Elasticsearch is ready
	var checkElasticStatus = function () {
		elasticRequest.callWithInternalUser('info').then(
			function (data) {
				init();
			}, function (data) {
				server.log([blueWazuh, 'initialize', 'info'], 'Waiting Elasticsearch to be up...');
				setTimeout(function () {checkElasticStatus()}, 3000)
			}
		);
	}

	// Main. First execution when installing / loading App.
	var init = function (){
		server.log([blueWazuh, 'Wazuh agents monitoring', 'info'], 'Creating today index...');
		saveStatus();
		server.log([blueWazuh, 'Wazuh agents monitoring', 'info'], 'Configuring Kibana for working with "'+index_pattern+'" index pattern...');
		configureKibana().then(function () {
			server.log([blueWazuh, 'Wazuh agents monitoring', 'info'], 'Successfully initialized!');
		}, function (response) {
			if (response.statusCode != '409') {
				server.log([blueWazuh, 'Wazuh agents monitoring', 'error'], 'Could not configure "'+index_pattern+'" index pattern. Please, configure it manually on Kibana.');
			} else {
				server.log([blueWazuh, 'Wazuh agents monitoring', 'info'], 'Skipping "'+index_pattern+'" index pattern configuration: Already configured.');
			}
		});
	}

	// Starting
	checkElasticStatus();

	// Cron tab for getting agent status.
	cron.schedule('* */10 * * * *', function () {
		agentsArray.length = 0;
		getConfig(loadCredentials);
	}, true);

	module.exports = fetchAgents;
}
