const needle = require('needle');

// Colors for console logging 
const colors    = require('ansicolors');
const blueWazuh = colors.blue('wazuh');

const OBJECTS_FILE = './integration_files/objects_file.json';

module.exports = (server, options) => {
	//const uiSettings = server.uiSettings();
	
	// Elastic JS Client
	const elasticRequest = server.plugins.elasticsearch.getCluster('data');

	let index_pattern = "wazuh-alerts-*";
	let objects       = {};
	let packageJSON   = {};

	// Read config from package JSON
	try {
		packageJSON = require('../package.json');
	} catch (e) {
		server.log([blueWazuh, 'initialize', 'error'], 'Could not read the Wazuh package file.');
	}

	// Save Wazuh App first set up for future executions
	const saveConfiguration = (type) => {
		let configuration = {
			"name":             "Wazuh App",
			"app-version":      packageJSON.version,
			"revision":         packageJSON.revision,
			"installationDate": new Date().toISOString()
		};

		if (type === "install") {
			elasticRequest
			.callWithInternalUser('create', {
				index: ".wazuh-version",
				type:  'wazuh-version',
				id:    1,
				body:  configuration
			})
			.then(() => {
				server.log([blueWazuh, 'initialize', 'info'], 'Wazuh configuration inserted');
			})
			.catch((error) => {
				server.log([blueWazuh, 'initialize', 'error'], 
							'Could not insert Wazuh configuration');
			});
		}
	};

	// Importing Wazuh built-in visualizations and dashboards
	const importObjects = (id) => {
		server.log([blueWazuh, 'initialize', 'info'], 
					'Importing objects (Searches, visualizations and dashboards) ' + 
					'into Elasticsearch...');

		try {
			objects = require(OBJECTS_FILE);
		} catch (e) {
			server.log([blueWazuh, 'initialize', 'error'], 'Could not read the objects file.');
			server.log([blueWazuh, 'initialize', 'error'], 'Path: ' + OBJECTS_FILE);
			server.log([blueWazuh, 'initialize', 'error'], 'Exception: ' + e);
		}

		let body = '';
		for(let element of objects){
			body += '{ "index":  { "_index": ".kibana", "_type": "doc", ' + 
			'"_id": "' + element._type + ':' + element._id + '" } }\n';

			let temp = {};
			let aux  = JSON.stringify(element._source);
			aux      = aux.replace("wazuh-alerts", id);
			aux      = JSON.parse(aux);
			temp[element._type] = aux;
			
			if (temp[element._type].kibanaSavedObjectMeta.searchSourceJSON.index) {
				temp[element._type].kibanaSavedObjectMeta.searchSourceJSON.index = id;
			}
			
			temp["type"] = element._type;
			body        += JSON.stringify(temp) + "\n";
		}

		elasticRequest
		.callWithInternalUser('bulk', {
			index: '.kibana',
			body:  body
		})
		.then(() => elasticRequest.callWithInternalUser('indices.refresh', {
			index: ['.kibana', index_pattern]
		}))
		.then(() => {
			server.log([blueWazuh, 'initialize', 'info'], 
			'Templates, mappings, index patterns, visualizations, searches ' + 
			'and dashboards were successfully installed. App ready to be used.');
		})
		.catch((error) => {
			server.log([blueWazuh, 'server', 'error'], 
					'Error importing objects into elasticsearch. Bulk request failed.');
		});
	};

	// Setting default index pattern
	const setDefaultKibanaSettings = (id) => {
		server.log([blueWazuh, 'initialize', 'info'], 
				'Setting Kibana default values: Index pattern, time picker and metaFields...');

		// Call the internal API and wait for the response
		let options = {
			headers: {
				'kbn-version': packageJSON.kibana.version
			},
			json: true
		};

		let body = {
			"value": id
		};

		let tmpUrl = `http://localhost:${server.info.port}/api/kibana/settings/defaultIndex`;

		needle('post', tmpUrl, body, options)
		.then((resp) => {
			server.log([blueWazuh, 'initialize', 'info'], 
					'Wazuh index-pattern successfully set to default.');
		})
		.catch((error) => {
			server.log([blueWazuh, 'error'], 'Could not default Wazuh index-pattern.');
		});
	};

	// Create index pattern
	const createIndexPattern = () => {
		server.log([blueWazuh, 'initialize', 'info'], `Creating index pattern: ${index_pattern}`);

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

		let tmpUrl = `http://localhost:${server.info.port}/api/saved_objects/index-pattern`;

		needle('post', tmpUrl, body, options)
		.then((resp) => {
			server.log([blueWazuh, 'initialize', 'info'], 'Successfully created index-pattern.');
			// Set the index-pattern as default in the Kibana configuration
			setDefaultKibanaSettings(resp.body.id);
			// Import objects (dashboards and visualizations) CAREFUL HERE, WE HAVE TO MANAGE SUCESIVE APP INITIATIONS!!!
			importObjects(resp.body.id);
		})
		.catch((err) => {
			server.log([blueWazuh, 'initialize', 'error'], 'Error creating index-pattern.');
		});
	};

	// Configure Kibana status: Index pattern, default index pattern, default time, import dashboards.
	const configureKibana = (type) => {
		if (type === "install") {
			// Create Index Pattern > Set it as default > Set default time
			elasticRequest
			.callWithInternalUser('search', {
				index: '.kibana',
				type:  'index-pattern',
				q:     'title:"wazuh-alerts-*"'
			})
			.then((data) => {
				if (data.hits.total >= 1) {
					server.log([blueWazuh, 'initialize', 'info'], 
								'Skipping index-pattern creation. Already exists.');
				} else {
					createIndexPattern();
				}
			})
			.catch((error) => {
				server.log([blueWazuh, 'initialize', 'error'], 'Could not reach elasticsearch.');
			});
		}
		// Save Setup Info
		saveConfiguration(type);
	};

	// Init function. Check for "wazuh-version" document existance.
	const init = () => {
		elasticRequest
		.callWithInternalUser('indices.exists', {
			index: '.wazuh'
		})
		.then((result) => {
			if (!result) {
				elasticRequest
				.callWithInternalUser('indices.create', {
					index: '.wazuh'
				})
				.then(() => {
					server.log([blueWazuh, 'initialize', 'info'], 'Index .wazuh created.');
				})
				.catch((error) => {
					server.log([blueWazuh, 'initialize', 'error'], 'Error creating index .wazuh.');
				});
			}
		})
		.catch((error) => {
			server.log([blueWazuh, 'initialize', 'error'], 
						'Could not check if the index .wazuh exists.');
		});

		elasticRequest
		.callWithInternalUser('get', {
			index: ".wazuh-version",
			type: "wazuh-version",
			id: "1"
		})
		.then((data) => {
			server.log([blueWazuh, 'initialize', 'info'], 
					'Wazuh-configuration document already exists. Nothing to be done.');
		})
		.catch((error) => {
			server.log([blueWazuh, 'initialize', 'info'], 
					'Wazuh-configuration document does not exist. Initializating configuration...');
			configureKibana("install");
		});
	};

	// Wait until Kibana index is created / loaded and initialize Wazuh App
	const checkKibanaIndex = () => {
		elasticRequest
		.callWithInternalUser('exists', {
			index: ".kibana",
			id:    packageJSON.kibana.version,
			type:  "config"
		})
		.then((data) => server.plugins.elasticsearch.waitUntilReady())
		.then(() => init())
		.catch((error) => {
			server.log([blueWazuh, 'initialize', 'info'], 
						'Waiting index ".kibana" to be created and prepared....');
			setTimeout(() => checkKibanaIndex(), 3000);
		});
	};

	// Check Kibana index and if it is prepared, start the initialization of Wazuh App.
	checkKibanaIndex();
};
