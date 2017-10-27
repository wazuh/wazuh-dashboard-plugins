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
		let payload = {
			'offset': 0,
			'limit':  1
		};

		let options = {
			headers: {
				'wazuh-app-version': packageJSON.version
			},
			username: apiEntry.user,
			password: apiEntry.password,
			rejectUnauthorized: !apiEntry.insecure
		};
		needle('get', `${getPath(apiEntry)}/agents`, payload, options)
		.then((response) => {
			if (!response.error && response.body.data && response.body.data.totalItems) {
				checkStatus(apiEntry, response.body.data.totalItems);
			} else {
				server.log([blueWazuh, 'Wazuh agents monitoring', 'error'], 
				'Wazuh API credentials not found or are not correct. '+
				'Open the app in your browser and configure it to start monitoring agents.');
			}
		});
	};

	// Load Wazuh API credentials from Elasticsearch document
	const loadCredentials = (apiEntries) => {
		if (typeof apiEntries === 'undefined' || !('hits' in apiEntries)) return;

		for(let element of apiEntries.hits){
			let apiEntry = {
				'user':     element._source.api_user,
				'password': Buffer.from(element._source.api_password, 'base64').toString("ascii"),
				'url':      element._source.url,
				'port':     element._source.api_port,
				'insecure': element._source.insecure
			};
			if (apiEntry.error) {
				server.log([blueWazuh, 'Wazuh agents monitoring', 'error'], 
						`Error getting wazuh-api data: ${apiEntry.error}`);
				break;
			}
			checkAndSaveStatus(apiEntry);
		}
	};

	// Get API configuration from elastic and callback to loadCredentials
	const getConfig = (callback) => {
		elasticRequest
		.callWithInternalUser('search', {
			index: '.wazuh',
			type:  'wazuh-configuration'
		})
		.then((data) => {
			if (data.hits.total === 1) {
				callback(data.hits);
			} else {
				callback({
					'error':      'no credentials',
					'error_code': 1
				});
			}
		})
		.catch(() => {
			callback({
				'error':      'no elasticsearch',
				'error_code': 2
			});
		});
	};

	// fetchAgents on demand
	const fetchAgents = () => getConfig(loadCredentials);

	// Configure Kibana patterns.
	const configureKibana = () => {
		server.log([blueWazuh, 'Wazuh agents monitoring', 'info'], 
					`Creating index pattern: ${index_pattern}`);

		// Call the internal API and wait for the response
		let options = {
			headers: {
				'kbn-version': packageJSON.kibana.version
			},
			json: true
		};

		let body = {
			attributes: {
				title:         index_pattern,
				timeFieldName: '@timestamp'
			}
		};

		return needle(
			'post', 
			`http://localhost:${server.info.port}/api/saved_objects/index-pattern`, 
			body, 
			options
		);
	};

	// Creating wazuh-monitoring index
	const createIndex = (todayIndex) => {
		elasticRequest
		.callWithInternalUser('indices.create', {
			index: todayIndex
		})
		.then(() => {
			server.log([blueWazuh, 'Wazuh agents monitoring', 'info'], 
					'Successfully created today index.');
			insertDocument(todayIndex);
		})
		.catch((error) => {
			server.log([blueWazuh, 'Wazuh agents monitoring', 'error'], 
					`Could not create ${todayIndex} index on elasticsearch.`);
		});
	};

	// Inserting one document per agent into Elastic. Bulk.
	const insertDocument = (todayIndex) => {
		let body = '';
		if (agentsArray.length > 0) {
			let managerName = agentsArray[0].name;

			for(let element of agentsArray){
				body += '{ "index":  { "_index": "' + todayIndex + '", "_type": "wazuh-agent" } }\n';
				let date              = new Date(Date.now()).toISOString();
				element["@timestamp"] = date;
				element["host"]       = managerName;
				body                 += JSON.stringify(element) + "\n";
			}

			if (body == '') {
				return;
			}

			elasticRequest
			.callWithInternalUser('bulk', {
				index: todayIndex,
				type:  'agent',
				body:  body
			})
			.then((response) => {
				agentsArray.length = 0;
			})
			.catch((err) => {
				server.log([blueWazuh, 'Wazuh agents monitoring', 'error'], 
						'Error inserting agent data into elasticsearch. Bulk request failed.');
			});
		}
	};

	// Save agent status into elasticsearch, create index and/or insert document
	const saveStatus = () => {
		fDate      = new Date().toISOString().replace(/T/, '-').replace(/\..+/, '').replace(/-/g, '.').replace(/: /g, '').slice(0, -7);
		todayIndex = index_prefix + fDate;

		elasticRequest
		.callWithInternalUser('indices.exists', {
			index: todayIndex
		})
		.then((result) => {
			if (result) {
				insertDocument(todayIndex);
			} else {
				createIndex(todayIndex);
			}
		})
		.catch((error) => {
			server.log([blueWazuh, 'Wazuh agents monitoring', 'error'], 
				`Could not check if the index ${todayIndex} exists.`);
		});
	};

	// Main. First execution when installing / loading App.
	const init = () => {
		server.log([blueWazuh, 'Wazuh agents monitoring', 'info'], 'Creating today index...');
		saveStatus();

		elasticRequest
		.callWithInternalUser('search', {
			index: '.kibana',
			type:  'doc',
			q:     'index-pattern.title:"wazuh-monitoring-*"'
		})
		.then((data) => {
			if (data.hits.total === 1) {
				server.log([blueWazuh, 'Wazuh agents monitoring', 'info'], 
							'Skipping index-pattern creation. Already exists.');
			} else {
				configureKibana();
			}
		})
		.catch((error) => {
			server.log([blueWazuh, 'Wazuh agents monitoring', 'error'], 
						'Could not reach elasticsearch.');
		});
	};

	// Wait until Elasticsearch is ready
	const checkElasticStatus = () => {
		elasticRequest
		.callWithInternalUser('info')
		.then((data) => server.plugins.elasticsearch.waitUntilReady())
		.then(() => init())
		.catch((error) => {
			server.log([blueWazuh, 'Wazuh agents monitoring', 'info'], 'Waiting for Elasticsearch to be up...');
			setTimeout(() => checkElasticStatus(), 3000);
		});
	};

	// Starting
	checkElasticStatus();

	// Cron tab for getting agent status.
	cron.schedule('0 */10 * * * *', function () {
		agentsArray.length = 0;
		getConfig(loadCredentials);
	}, true);

	module.exports = fetchAgents;
}