const needle = require('needle');

// Colors for console logging 
const colors    = require('ansicolors');
const blueWazuh = colors.blue('wazuh');

const OBJECTS_FILE = './integration_files/objects_file.json';
const APP_OBJECTS_FILE = './integration_files/app_objects_file_alerts.json';

module.exports = (server, options) => {
    // Elastic JS Client
    const elasticRequest = server.plugins.elasticsearch.getCluster('data');

    let objects = {};
    let app_objects = {};
    let packageJSON = {};

    // Read config from package JSON
    try {
        packageJSON = require('../package.json');
    } catch (e) {
        server.log([blueWazuh, 'initialize', 'error'], 'Could not read the Wazuh package file.');
    }

    let index_pattern = packageJSON.initialPattern;

    // Save Wazuh App first set up for future executions
    const saveConfiguration = (id) => {
        let configuration = {
            "name":             "Wazuh App",
            "app-version":      packageJSON.version,
            "revision":         packageJSON.revision,
            "installationDate": new Date().toISOString(),
            "index-pattern": id
        };

        elasticRequest.callWithInternalUser('create', {
            index: ".wazuh-version",
            type:  'wazuh-version',
            id:    1,
            body:  configuration
        })
        .then(() => {
            server.log([blueWazuh, 'initialize', 'info'], 'Wazuh configuration inserted');
        })
        .catch((error) => {
            server.log([blueWazuh, 'initialize', 'error'], 'Could not insert Wazuh configuration');
        });
    };

    // Importing Wazuh built-in visualizations and dashboards
    const importObjects = (id) => {
        server.log([blueWazuh, 'initialize', 'info'], 'Importing objects (Searches, visualizations and dashboards) into Elasticsearch...');

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

        elasticRequest.callWithInternalUser('bulk', {
            index: '.kibana',
            body:  body
        })
        .then(() => elasticRequest.callWithInternalUser('indices.refresh', {
            index: ['.kibana', index_pattern]
        }))
        .then(() => {
            server.log([blueWazuh, 'initialize', 'info'], 'Templates, mappings, index patterns, visualizations, searches and dashboards were successfully installed. App ready to be used.');
        })
        .catch((error) => {
            server.log([blueWazuh, 'server', 'error'], 'Error importing objects into elasticsearch. Bulk request failed.');
        });
    };

    // Importing Wazuh app visualizations and dashboards
    const importAppObjects = (id) => {
        console.log("Importing objects");
        server.log([blueWazuh, 'initialize', 'info'], 'Importing Wazuh app visualizations...');

        try {
            app_objects = require(APP_OBJECTS_FILE);
        } catch (e) {
            server.log([blueWazuh, 'initialize', 'error'], 'Could not read the objects file.');
            server.log([blueWazuh, 'initialize', 'error'], 'Path: ' + APP_OBJECTS_FILE);
            server.log([blueWazuh, 'initialize', 'error'], 'Exception: ' + e);
        }

        let body = '';
        for(let element of app_objects){
            body += '{ "index":  { "_index": ".kibana", "_type": "doc", ' + '"_id": "' + element._type + ':' + element._id + '" } }\n';

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

        elasticRequest.callWithInternalUser('bulk', {
            index: '.kibana',
            body:  body
        })
        .then(() => elasticRequest.callWithInternalUser('indices.refresh', {
            index: ['.kibana', index_pattern]
        }))
        .then(() => {
            server.log([blueWazuh, 'initialize', 'info'], 'Wazuh app visualizations were successfully installed. App ready to be used.');
        })
        .catch((error) => {
            server.log([blueWazuh, 'server', 'error'], 'Error importing objects into elasticsearch. Bulk request failed.');
        });
    };

    // Setting default index pattern
    const setDefaultKibanaSettings = (id) => {
        server.log([blueWazuh, 'initialize', 'info'], 'Setting Kibana default values: Index pattern, time picker and metaFields...');

        elasticRequest.callWithInternalUser('update', { 
            index: '.kibana', 
            type: 'doc', 
            id: `config:${packageJSON.kibana.version}`, 
            body: {
                'doc': {
                    "type": 'config', 
                    "config": { 
                        "defaultIndex": id
                    } 
                }
            } 
        })
        .then((resp) => {
            server.log([blueWazuh, 'initialize', 'info'], 'Successfully set to default index: ' + id);
        })
        .catch((err) => {
            server.log([blueWazuh, 'initialize', 'error'], 'Could not default the index.');
        });
    };

    // Create index pattern TODO: remove hardcoded index-patterns ids
    const createIndexPattern = () => {
        server.log([blueWazuh, 'initialize', 'info'], `Creating index pattern: ${index_pattern}`);

        elasticRequest.callWithInternalUser('create', { 
            index: '.kibana', 
            type: 'doc', 
            id: 'index-pattern:f1175040-d5c5-11e7-8ef5-a5944cf52264', 
            body: {
                "type": 'index-pattern', 
                "index-pattern": { 
                    "title": index_pattern, 
                    "timeFieldName": '@timestamp' 
                } 
            } 
        })
        .then((resp) => {
            server.log([blueWazuh, 'initialize', 'info'], 'Created index pattern: ' + index_pattern);
            // Set the index-pattern as default in the Kibana configuration
            setDefaultKibanaSettings('f1175040-d5c5-11e7-8ef5-a5944cf52264');
            // Import objects (dashboards and visualizations)
            importObjects('f1175040-d5c5-11e7-8ef5-a5944cf52264');
            importAppObjects('f1175040-d5c5-11e7-8ef5-a5944cf52264');

            // Save Setup Info
            saveConfiguration('f1175040-d5c5-11e7-8ef5-a5944cf52264');
        })
        .catch((err) => {
            server.log([blueWazuh, 'initialize', 'error'], 'Error creating index-pattern.');
        });
    };

    // Configure Kibana status: Index pattern, default index pattern, default time, import dashboards.
    const configureKibana = (type) => {
        if (type === "install") {
            elasticRequest .callWithInternalUser('search', {
                index: '.kibana',
                type:  'index-pattern',
                q:     `title:"${index_pattern}"`
            })
            .then((data) => {
                if (data.hits.total >= 1) server.log([blueWazuh, 'initialize', 'info'], 'Skipping index-pattern creation. Already exists.');
                else createIndexPattern();
            })
            .catch((error) => {
                server.log([blueWazuh, 'initialize', 'error'], 'Could not reach elasticsearch.');
            });
        }
    };

    // Init function. Check for "wazuh-version" document existance.
    const init = () => {
        elasticRequest.callWithInternalUser('indices.exists', {
            index: '.wazuh'
        })
        .then((result) => {
            if (!result) {
                elasticRequest.callWithInternalUser('indices.create', {
                    index: '.wazuh'
                })
                .then(() => {
                    server.log([blueWazuh, 'initialize', 'info'], 'Index .wazuh created.');
                })
                .catch((error) => {
                    server.log([blueWazuh, 'initialize', 'error'], 'Error creating index .wazuh.');
                });
            } else { // The .wazuh index exists, we now proceed to check whether it's from an older version
                elasticRequest.callWithInternalUser('get', {
                    index: ".wazuh",
                    type: "wazuh-setup"
                })
                .then((data) => {
                    // Reindex!
                    reindexOldVersion();
                })
                .catch((error) => {
                    server.log([blueWazuh, 'initialize', 'error'], 'Could not check if the index .wazuh belongs to an older version.');
                });
            }
        })
        .catch((error) => {
            server.log([blueWazuh, 'initialize', 'error'], 'Could not check if the index .wazuh exists.');
        });

        elasticRequest.callWithInternalUser('get', {
            index: ".wazuh-version",
            type: "wazuh-version",
            id: "1"
        })
        .then((data) => {
            server.log([blueWazuh, 'initialize', 'info'], 'Wazuh-configuration document already exists. Nothing to be done.');
        })
        .catch((error) => {
            server.log([blueWazuh, 'initialize', 'info'], 'Wazuh-configuration document does not exist. Initializating configuration...');
            configureKibana("install");
        });
    };

    // Check Elasticsearch Server status and .kibana index presence
    const checkElasticsearchServer  = () => {
        return new Promise(function (resolve, reject) {
            elasticRequest.callWithInternalUser('indices.exists', {
                index: ".kibana"
            })
            .then((data) => {
                if (data) server.plugins.elasticsearch.waitUntilReady().then((data) => {  resolve(data); });
                else reject(data);
            })
            .catch((error) => {
                reject(error);
            });
        })
    }

    // Wait until Kibana server is ready
    const checkKibanaStatus = () => {
        checkElasticsearchServer().then((data) => { init() })
        .catch((error) => {
            server.log([blueWazuh, 'initialize', 'info'], 'Waiting for Kibana and Elasticsearch servers to be ready...');
            setTimeout(() => checkKibanaStatus(), 3000);
        });
    };

    // Check Kibana index and if it is prepared, start the initialization of Wazuh App.
    checkKibanaStatus();

    module.exports = importAppObjects;
};
