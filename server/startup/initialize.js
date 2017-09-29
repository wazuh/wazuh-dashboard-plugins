module.exports = function (server, options) {
	// Elastic JS Client
	const elasticRequest = server.plugins.elasticsearch.getCluster('data');
	
	// External libraries
	//const uiSettings = server.uiSettings();
	const fs = require('fs');
	const path = require('path');
	const needle = require('needle');

	// Colors for console logging 
	const colors = require('ansicolors');
	const blueWazuh = colors.blue('wazuh');

	// Initialize variables
	var index_pattern = "wazuh-alerts-*";
	var index_prefix = "wazuh-alerts-";

	// External files template or objects
	const OBJECTS_FILE = 'integration_files/objects_file.json';

	// Initialize objects
	var objects = {};

	var packageJSON = {};

	// Read config from package JSON
	try {
    	packageJSON = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf8'));
    } catch (e) {
        server.log([blueWazuh, 'Wazuh agents monitoring', 'error'], 'Could not read the Wazuh package file.');
    };

	// Today
	var fDate = new Date().toISOString().replace(/T/, '-').replace(/\..+/, '').replace(/-/g, '.').replace(/:/g, '').slice(0, -7);
	var todayIndex = index_prefix + fDate;

	// Save Wazuh App first set up for future executions
	var saveConfiguration = function (type) {
        var configuration = {"name" : "Wazuh App", "app-version": packageJSON.version, "revision": packageJSON.revision, "installationDate": new Date().toISOString() };
		
		if(type == "install" || type == "migration"){
			elasticRequest.callWithInternalUser('create', { index: ".wazuh", type: 'wazuh-configuration', id: 1, body: configuration }).then(
				function () {
					server.log([blueWazuh, 'initialize', 'info'], 'Wazuh configuration inserted');
				}, function () {
					server.log([blueWazuh, 'initialize', 'error'], 'Could not insert Wazuh configuration');
				});
		}
    };
	
    var importObjects = function () {
		server.log([blueWazuh, 'initialize', 'info'], 'Importing objects (Searches, visualizations and dashboards) into Elasticsearch...');

		try {
			objects = JSON.parse(fs.readFileSync(path.resolve(__dirname, OBJECTS_FILE), 'utf8'));
		} catch (e) {
			server.log([blueWazuh, 'initialize', 'error'], 'Could not read the objects file.');
			server.log([blueWazuh, 'initialize', 'error'], 'Path: ' + OBJECTS_FILE);
			server.log([blueWazuh, 'initialize', 'error'], 'Exception: ' + e);
		}

		var body = '';
		objects.forEach(function (element) {
			body += '{ "index":  { "_index": ".kibana", "_type": "'+element._type+'", "_id": "'+element._id+'" } }\n';
			body += JSON.stringify(element._source) + "\n";
		});
		elasticRequest.callWithInternalUser('bulk',{
			index: '.kibana',
			body: body
		}).then(function () {
			elasticRequest.callWithInternalUser('indices.refresh',{ index: ['.kibana', index_pattern] });
			server.log([blueWazuh, 'initialize', 'info'], 'Templates, mappings, index patterns, visualizations, searches and dashboards were successfully installed. App ready to be used.');
		}, function (err) {
			server.log([blueWazuh, 'server', 'error'], 'Error importing objects into elasticsearch. Bulk request failed.');
		});
	}

	// Setting default index pattern
	var setDefaultKibanaSettings = function (id) {
        server.log([blueWazuh, 'initialize', 'info'], 'Setting Kibana default values: Index pattern, time picker and metaFields...');
			
		// Call the internal API and wait for the response
		var options = { headers: {'kbn-version':'6.0.0-rc1'}, json: true}

		var body = {"value": id}

		needle('post', 'http://localhost:' + server.info.port + '/api/kibana/settings/defaultIndex', body, options).then(function(resp) { 
			server.log([blueWazuh, 'info'], 'Wazuh index-pattern successfully set to default.');
		}).catch(function(err) { 
			server.log([blueWazuh, 'error'], 'Could not default Wazuh index-pattern.');
		});
    };

	// Create index pattern
	var createIndexPattern = function () {
		server.log([blueWazuh, 'initialize', 'info'], 'Creating index pattern: ' + index_pattern);	

		// Call the internal API and wait for the response
		var options = { headers: { 'kbn-version':'6.0.0-rc1' }, json: true }

		var body = {attributes : {title : index_pattern, timeFieldName : '@timestamp'}}

		needle('post', 'http://localhost:' + server.info.port + '/api/saved_objects/index-pattern', body, options).then(function(resp) { 
			server.log([blueWazuh, 'info'], 'Successfully created index-pattern.');
			// Save the id somewhere 
			setDefaultKibanaSettings(resp.body.id);
		}).catch(function(err) { 
			server.log([blueWazuh, 'error'], 'Error creating index-pattern.');
		});
    };

	// Configure Kibana status: Index pattern, default index pattern, default time, import dashboards.
	var configureKibana = function (type) {
		if(type == "install") {
			// Create Index Pattern > Set it as default > Set default time
			elasticRequest.callWithInternalUser('search', { index: '.kibana', type: 'index-pattern', q: 'title:"wazuh-alerts-*"'}).then(
				function (data) {
					if (data.hits.total == 1) {
						server.log([blueWazuh, 'info'], 'Skipping index-pattern creation. Already exists.');
					} else {
						createIndexPattern();
					}
				}, function (error) {
					server.log([blueWazuh, 'error'], 'Could not reach elasticsearch.');
			});
			// Import objects (dashboards and visualizations) CAREFULL HERE, WE HAVE TO MANAGE SUCESIVE APP INITIATIONS!!!
			importObjects();			
		}
		
		// Save Setup Info
		saveConfiguration(type);
    };

	// Init function. Check for "wazuh-documentation" document existance.
    var init = function () {
        elasticRequest.callWithInternalUser('get', { index: ".wazuh", type: "wazuh-configuration", id: "1" }).then(
            function (data) {
                server.log([blueWazuh, 'initialize', 'info'], 'Wazuh-configuration document already exists. Proceed to upgrade.');
				configureKibana("upgrade");
            }, function (data) {
                server.log([blueWazuh, 'initialize', 'info'], 'Wazuh-configuration document does not exist. Initializating configuration...');
				configureKibana("install");
            }
        );
    };

    // Wait until Kibana index is created / loaded and initialize Wazuh App
	var checkKibanaIndex = function () {
		elasticRequest.callWithInternalUser('exists',{ index: ".kibana", id: packageJSON.kibana.version, type: "config" }).then(
			function (data) {
				server.plugins.elasticsearch.waitUntilReady().then(function () {
					init();
				});
			}, function (data) {
				server.log([blueWazuh, 'initialize', 'info'], 'Waiting index ".kibana" to be created and prepared....');
				setTimeout(function () {checkKibanaIndex()}, 3000)
			}
		);
	}
	
	// Check Kibana index and if it is prepared, start the initialization of wazuh App.
	checkKibanaIndex();
};
