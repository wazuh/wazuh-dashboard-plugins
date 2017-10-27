// External libraries
const cron      = require('node-cron');
const needle    = require('needle');
const getPath   = require('../util/get-path');

// Colors for console logging 
const colors    = require('ansicolors');
const blueWazuh = colors.blue('wazuh');

module.exports = (server, options) => {
	// Elastic JS Client
	const elasticRequest = server.plugins.elasticsearch.getCluster('admin');

	// Initialize
	let agentsArray   = [];
	let index_pattern = "wazuh-monitoring-*";
	let index_prefix  = "wazuh-monitoring-";
	let fDate         = new Date().toISOString().replace(/T/, '-').replace(/\..+/, '').replace(/-/g, '.').replace(/: /g, '').slice(0, -7);
	let todayIndex    = index_prefix + fDate;
	let packageJSON   = {};

	// Read Wazuh App package file
	try {
		packageJSON = require('../package.json');
	} catch (e) {
		server.log([blueWazuh, 'Wazuh agents monitoring', 'error'], 'Could not read the Wazuh package file.');
	}

	// Check status and get agent status array
	const checkStatus = (apiEntry, maxSize, offset) => {
		if (!maxSize) {
			server.log([blueWazuh, 'Wazuh agents monitoring', 'error'], 'You must provide a max size');
		}

		let payload = {
			'offset': offset ? offset: 0,
			'limit':  (250 < maxSize) ? 250 : maxSize
		};

		let options = {
			headers: {
				'wazuh-app-version': packageJSON.version
			},
			username:           apiEntry.user,
			password:           apiEntry.password,
			rejectUnauthorized: !apiEntry.insecure
		};

		needle
			.request('get', `${getPath(apiEntry)}/agents`, payload, options, (error, response) => {
			if (!error && !response.error && response.body.data.items) {
				agentsArray = agentsArray.concat(response.body.data.items);
				if ((payload.limit + payload.offset) < maxSize) {
					checkStatus(apiEntry, 
								response.body.data.totalItems, 
								payload.limit + payload.offset
					);
				} else {
					saveStatus();
				}
			} else {
				server.log([blueWazuh, 'Wazuh agents monitoring', 'error'], 
						'Can not access Wazuh API');
			}
		});
	};

	// Check API status twice and get agents total items
	const checkAndSaveStatus = (apiEntry) => {
		var payload = {
			'offset': 0,
			'limit':  1
		};

		var options = {
			headers: {
				'wazuh-app-version': packageJSON.version
			},
			username: apiEntry.user,
			password: apiEntry.password,
			rejectUnauthorized: !apiEntry.insecure
		};
		needle('get', getPath(apiEntry) + '/agents', payload, options).then(function (response) {
			if (!response.error && response.body.data && response.body.data.totalItems) {
				checkStatus(apiEntry, response.body.data.totalItems);
			} else {
				server.log([blueWazuh, 'Wazuh agents monitoring', 'error'], 'Wazuh API credentials not found or are not correct. Open the app in your browser and configure it to start monitoring agents.');
				return;
			}
		});
	};

	// Load Wazuh API credentials from Elasticsearch document
	var loadCredentials = function (apiEntries) {
		if (typeof apiEntries === 'undefined' || typeof apiEntries.hits === 'undefined')
			return;

		apiEntries.hits.forEach(function (element) {
			var apiEntry = {
				'user': element._source.api_user,
				'password': new Buffer(element._source.api_password, 'base64').toString("ascii"),
				'url': element._source.url,
				'port': element._source.api_port,
				'insecure': element._source.insecure
			}
			if (apiEntry.error) {
				server.log([blueWazuh, 'Wazuh agents monitoring', 'error'], 'Error getting wazuh-api data: ' + apiEntry.error);
				return;
			}
			checkAndSaveStatus(apiEntry);
		});
	}

	// Get API configuration from elastic and callback to loadCredentials
	var getConfig = function (callback) {
		elasticRequest.callWithInternalUser('search', {
			index: '.wazuh',
			type: 'wazuh-configuration'
		}).then(
			function (data) {
				if (data.hits.total == 1) {
					callback(data.hits);
				} else {
					callback({
						'error': 'no credentials',
						'error_code': 1
					});
				}
			},
			function () {
				callback({
					'error': 'no elasticsearch',
					'error_code': 2
				});
			}
		);
	};

	// fetchAgents on demand
	var fetchAgents = function () {
		getConfig(loadCredentials);
		return;
	};

	// Configure Kibana patterns.
	var configureKibana = function () {
		server.log([blueWazuh, 'Wazuh agents monitoring', 'info'], 'Creating index pattern: ' + index_pattern);

		// Call the internal API and wait for the response
		var options = {
			headers: {
				'kbn-version': packageJSON.kibana.version
			},
			json: true
		}

		var body = {
			attributes: {
				title: index_pattern,
				timeFieldName: '@timestamp'
			}
		}

		return needle('post', 'http://localhost:' + server.info.port + '/api/saved_objects/index-pattern', body, options);
	};

	// Creating wazuh-monitoring index
	var createIndex = function (todayIndex) {
		elasticRequest.callWithInternalUser('indices.create', {
			index: todayIndex
		}).then(
			function () {
				server.log([blueWazuh, 'Wazuh agents monitoring', 'info'], 'Successfully created today index.');
				insertDocument(todayIndex);
			},
			function () {
				server.log([blueWazuh, 'Wazuh agents monitoring', 'error'], 'Could not create ' + todayIndex + ' index on elasticsearch.');
			}
		);
	};

	// Inserting one document per agent into Elastic. Bulk.
	var insertDocument = function (todayIndex) {
		var body = '';
		if (agentsArray.length > 0) {
			var managerName = agentsArray[0].name;
			agentsArray.forEach(function (element) {
				body += '{ "index":  { "_index": "' + todayIndex + '", "_type": "wazuh-agent" } }\n';
				var date = new Date(Date.now()).toISOString();
				element["@timestamp"] = date;
				element["host"] = managerName;
				body += JSON.stringify(element) + "\n";
			});
			if (body == '') {
				return;
			}

			elasticRequest.callWithInternalUser('bulk', {
				index: todayIndex,
				type: 'agent',
				body: body
			}).then(function (response) {
				agentsArray.length = 0;
			}, function (err) {
				server.log([blueWazuh, 'Wazuh agents monitoring', 'error'], 'Error inserting agent data into elasticsearch. Bulk request failed.');
			});
		}
	};

	// Save agent status into elasticsearch, create index and/or insert document
	var saveStatus = function () {
		fDate = new Date().toISOString().replace(/T/, '-').replace(/\..+/, '').replace(/-/g, '.').replace(/:/g, '').slice(0, -7);
		todayIndex = index_prefix + fDate;

		elasticRequest.callWithInternalUser('indices.exists', {
			index: todayIndex
		}).then(
			function (result) {
				if (result) {
					insertDocument(todayIndex);
				} else {
					createIndex(todayIndex);
				}
			},
			function () {
				server.log([blueWazuh, 'Wazuh agents monitoring', 'error'], 'Could not check if the index ' + todayIndex + ' exists.');
			}
		);
	};

	// Main. First execution when installing / loading App.
	var init = function () {
		server.log([blueWazuh, 'Wazuh agents monitoring', 'info'], 'Creating today index...');
		saveStatus();

		elasticRequest.callWithInternalUser('search', {
			index: '.kibana',
			type: 'doc',
			q: 'index-pattern.title:"wazuh-monitoring-*"'
		}).then(
			function (data) {
				if (data.hits.total == 1) {
					server.log([blueWazuh, 'Wazuh agents monitoring', 'info'], 'Skipping index-pattern creation. Already exists.');
				} else {
					configureKibana();
				}
			},
			function (error) {
				server.log([blueWazuh, 'Wazuh agents monitoring', 'error'], 'Could not reach elasticsearch.');
			}
		);
	}

	// Wait until Elasticsearch is ready
	var checkElasticStatus = function () {
		elasticRequest.callWithInternalUser('info').then(
			function (data) {
				server.plugins.elasticsearch.waitUntilReady().then(function () {
					init();
				});
			},
			function (data) {
				server.log([blueWazuh, 'Wazuh agents monitoring', 'info'], 'Waiting for Elasticsearch to be up...');
				setTimeout(function () {
					checkElasticStatus()
				}, 3000)
			}
		);
	}

	// Starting
	checkElasticStatus();

	// Cron tab for getting agent status.
	cron.schedule('0 */10 * * * *', function () {
		agentsArray.length = 0;
		getConfig(loadCredentials);
	}, true);

	module.exports = fetchAgents;
}