module.exports = function (server, options) {


	// Elastic JS Client
	const serverConfig = server.config();
	const elasticsearch = require('elasticsearch');
	const elasticRequest = server.plugins.elasticsearch.getCluster('data');
	//callWithInternalUser
	
	// External libraries
	const uiSettings = server.uiSettings();
	const fs = require('fs');
	const path = require('path');

	// Colors for console logging 
	const colors = require('ansicolors');
	const blueWazuh = colors.blue('wazuh');

	// Initialize variables
	var req = { path : "", headers : {}};
	var index_pattern = "wazuh-alerts-*";
	var index_prefix = "wazuh-alerts-";

	// External files template or objects
	const OBJECTS_FILE = 'integration_files/objects_file.json';
	const TEMPLATE_FILE = 'integration_files/template_file.json';
	const KIBANA_FIELDS_FILE = 'integration_files/kibana_fields_file.json';
	const ALERT_SAMPLE_FILE = 'integration_files/alert_sample.json';
	const MONITORING_SAMPLE_FILE = 'integration_files/monitoring_sample.json';

	// Initialize objects
	var kibana_fields_data = {};
	var alert_sample = {};
	var monitoring_sample = {};
	var map_jsondata = {};
	var objects = {};

	var packageJSON = {};

	// Read config from package JSON
	packageJSON = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../package.json'), 'utf8'));
	
	// Today
	var fDate = new Date().toISOString().replace(/T/, '-').replace(/\..+/, '').replace(/-/g, '.').replace(/:/g, '').slice(0, -7);
	var todayIndex = index_prefix + fDate;

	// Save Wazuh App first set up for further updates
	var saveSetupInfo = function (type) {
        var setup_info = {"name" : "Wazuh App", "app-version": packageJSON.version, "revision": packageJSON.revision, "installationDate": new Date().toISOString() };
		
		if(type == "install"){
			elasticRequest.callWithInternalUser('create', { index: ".kibana", type: 'wazuh-setup', id: 1, body: setup_info }).then(
				function () {
					server.log([blueWazuh, 'initialize', 'info'], 'Wazuh set up info inserted');
				}, function () {
					server.log([blueWazuh, 'initialize', 'error'], 'Could not insert Wazuh set up info');
				});
		}
		
		if(type == "upgrade"){
			elasticRequest.callWithInternalUser('update', { index: ".kibana", type: 'wazuh-setup', id: 1, body: {doc: setup_info}}).then(
				function () {
					server.log([blueWazuh, 'initialize', 'info'], 'Wazuh set up info updated');
				}, function () {
					server.log([blueWazuh, 'initialize', 'error'], 'Could not upgrade Wazuh set up info');
				});
		}
    };

	
	// Insert sample alert
	var insertSampleAlert = function () {
		
		try {
			alert_sample = JSON.parse(fs.readFileSync(path.resolve(__dirname, ALERT_SAMPLE_FILE), 'utf8'));
		} catch (e) {
			server.log([blueWazuh, 'initialize', 'error'], 'Could not read the mapping file.');
			server.log([blueWazuh, 'initialize', 'error'], 'Path: ' + ALERT_SAMPLE);
			server.log([blueWazuh, 'initialize', 'error'], 'Exception: ' + e);
		};
			
		try {
			monitoring_sample = JSON.parse(fs.readFileSync(path.resolve(__dirname, MONITORING_SAMPLE_FILE), 'utf8'));
		} catch (e) {
			server.log([blueWazuh, 'initialize', 'error'], 'Could not read the mapping file.');
			server.log([blueWazuh, 'initialize', 'error'], 'Path: ' + MONITORING_SAMPLE);
			server.log([blueWazuh, 'initialize', 'error'], 'Exception: ' + e);
		};
			
		server.log([blueWazuh, 'initialize', 'info'], 'Inserting sample alert...');
		elasticRequest.callWithInternalUser('create', { index: todayIndex, type: 'wazuh', id: 'alert_sample', body: alert_sample })
			.then(function () {
				server.log([blueWazuh, 'initialize', 'info'], 'Sample alert inserted');				
			}, function (response) {
				if (response.statusCode != '409') {
					server.log([blueWazuh, 'initialize', 'error'], 'Could not insert the sample alert');
				} else {
					server.log([blueWazuh, 'initialize', 'info'], 'Skipping alert insertion. Already inserted.');
				}
			});
		
	}
	
	// Create index pattern
	var createIndexPattern = function () {
					
		try {
		  kibana_fields_data = JSON.parse(fs.readFileSync(path.resolve(__dirname, KIBANA_FIELDS_FILE), 'utf8'));
		} catch (e) {
		  server.log([blueWazuh, 'initialize', 'error'], 'Could not read the mapping file.');
		  server.log([blueWazuh, 'initialize', 'error'], 'Path: ' + KIBANA_FIELDS_FILE);
		  server.log([blueWazuh, 'initialize', 'error'], 'Exception: ' + e);
		};

		server.log([blueWazuh, 'initialize', 'info'], 'Creating index pattern: ' + index_pattern);
		elasticRequest.callWithInternalUser('create', { index: '.kibana', type: 'index-pattern', id: index_pattern, body: { title: index_pattern, timeFieldName: '@timestamp', fields: kibana_fields_data.wazuh_alerts } })
			.then(function () {
				server.log([blueWazuh, 'initialize', 'info'], 'Created index pattern: ' + index_pattern);
				// Once index pattern is created, set it as default, wait few seconds for Kibana.
				setTimeout(function () {
					setDefaultKibanaSettings();
				}, 2000)					
			}, function (response) {
				if (response.statusCode != '409') {
					server.log([blueWazuh, 'initialize', 'error'], 'Could not configure index pattern:' + index_pattern);
				} else {
					server.log([blueWazuh, 'initialize', 'info'], 'Skipping index pattern configuration: Already configured:' + index_pattern);
				}
			});
    };
	
	// Setting default index pattern
	var setDefaultKibanaSettings = function () {
        server.log([blueWazuh, 'initialize', 'info'], 'Setting Kibana default values: Index pattern, time picker and metaFields...');
			
        uiSettings.setMany(req,{'defaultIndex':'wazuh-alerts-*', 'timepicker:timeDefaults':'{  \"from\": \"now-24h\",  \"to\": \"now\",  \"mode\": \"quick\"}','metaFields':[]})
            .then(function (data) {
                server.log([blueWazuh, 'initialize', 'info'], 'Kibana default values set');
            }).catch(function (data) {
                server.log([blueWazuh, 'initialize', 'error'], 'Could not set default values: '+index_pattern);
                server.log([blueWazuh, 'initialize', 'error'], data);
            });
    };
	
	
	// Configure Kibana status: Index pattern, default index pattern, default time, import dashboards.
	var configureKibana = function (type) {

		if(type == "install"){
			// Insert sample alert to prevent error "Invalid saved fields" when aggregating/searching
			insertSampleAlert();
			// Create Index Pattern > Set it as default > Set default time
			createIndexPattern();
			// Import objects
			importObjects();			
		}
		
		// Save Setup Info
		saveSetupInfo(type);

    };


	// Init function. Check for "wazuh-setup" document existance.
    var init = function () {
        elasticRequest.callWithInternalUser('get', { index: ".kibana", type: "wazuh-setup", id: "1" }).then(
            function (data) {
                server.log([blueWazuh, 'initialize', 'info'], 'Wazuh-setup document already exists. Proceed to upgrade.');
				configure("upgrade");
            }, function (data) {
                server.log([blueWazuh, 'initialize', 'info'], 'Wazuh-setup document does not exist. Initializating configuration...');
                configure("install");
            }
        );
    };

	var configure = function (type) {
		loadTemplate(type);
	}
	
    var loadTemplate = function (type) {
		try {
			map_jsondata = JSON.parse(fs.readFileSync(path.resolve(__dirname, TEMPLATE_FILE), 'utf8'));
		} catch (e) {
			server.log([blueWazuh, 'initialize', 'error'], 'Could not read the mapping file.');
			server.log([blueWazuh, 'initialize', 'error'], 'Path: ' + TEMPLATE_FILE);
			server.log([blueWazuh, 'initialize', 'error'], 'Exception: ' + e);
		};
		elasticRequest.callWithInternalUser('indices.putTemplate', {name: "wazuh", order: 0, body: map_jsondata}).then(
			function () {
				server.log([blueWazuh, 'initialize', 'info'], 'Template installed and loaded: ' +  index_pattern);
				configureKibana(type);
			}, function (data) {
				server.log([blueWazuh, 'initialize', 'error'], 'Could not install template ' +  index_pattern);
			});
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

    // Wait until Kibana index is created / loaded and initialize Wazuh App
	var checkKibanaIndex = function () {
		elasticRequest.callWithInternalUser('exists',{ index: ".kibana", id: packageJSON.kibana.version, type: "config" }).then(
			function (data) {
				init();
			}, function (data) {
				server.log([blueWazuh, 'initialize', 'info'], 'Waiting index ".kibana" to be created and prepared....');
				setTimeout(function () {checkKibanaIndex()}, 3000)
			}
		);
	}
	
	// Check Kibana index and if it is prepared, start the initialization of wazuh App.
	checkKibanaIndex();

};
