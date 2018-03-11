const needle = require('needle');

// Colors for console logging 
const colors    = require('ansicolors');
const blueWazuh = colors.blue('wazuh');

const OBJECTS_FILE     = './integration-files/objects-file.json';
const APP_OBJECTS_FILE = './integration-files/app-objects-file-alerts.json';
const KIBANA_TEMPLATE  = './integration-files/kibana-template.json';
const fs   = require('fs');
const yml  = require('js-yaml');
const path = require('path');
const winston = require('winston');
global.wazuhlogger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
      new winston.transports.File({ filename: 'error.log', level: 'error' }),
      new winston.transports.File({ filename: 'combined.log' })
    ]
});
module.exports = (server, options) => {
    
    // Elastic JS Client
    const elasticRequest = server.plugins.elasticsearch.getCluster('data');

    let objects           = {};
    let app_objects       = {};
    let kibana_template   = {};
    let packageJSON       = {};
    let configurationFile = {};
    let pattern           = null;

    // Read config from package.json and config.yml
    try {
        configurationFile = yml.load(fs.readFileSync(path.join(__dirname,'../config.yml'), {encoding: 'utf-8'}));

        global.loginEnabled = (configurationFile && typeof configurationFile['login.enabled'] !== 'undefined') ? configurationFile['login.enabled'] : false;
        pattern             = (configurationFile && typeof configurationFile.pattern          !== 'undefined') ? configurationFile.pattern          : 'wazuh-alerts-3.x-*';
        
        packageJSON = require('../package.json');
    } catch (e) {
        server.log([blueWazuh, 'initialize', 'error'], 'Something went wrong while reading the configuration.' + e.message);
    }

    if(typeof global.sessions === 'undefined') {
        global.sessions = { };
    }

    global.protectedRoute = req => {
        if(!loginEnabled) return true;
        const session = (req.headers && req.headers.code) ? sessions[req.headers.code] : null;
        if(!session) return false;
        const timeElapsed = (new Date() - session.created) / 1000;
        if(timeElapsed >= session.exp){
            delete sessions[req.payload.code];
            return false;
        }
        return true;
    }

    let index_pattern = pattern || "wazuh-alerts-3.x-*";

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
        .catch(error => {
            wazuhlogger.log({
                date: new Date(),
                level: 'error',
                location: 'initialize.js importObjects',
                message: error.message || error
            });
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
        .catch(error => {
            wazuhlogger.log({
                date: new Date(),
                level: 'error',
                location: 'initialize.js importAppObjects',
                message: error.message || error
            });
            server.log([blueWazuh, 'server', 'error'], 'Error importing objects into elasticsearch. Bulk request failed.');
        });
    };

    // Create index pattern TODO: remove hardcoded index-patterns ids
    const createIndexPattern = () => {
        server.log([blueWazuh, 'initialize', 'info'], `Creating index pattern: ${index_pattern}`);

        let patternId = 'index-pattern:' + index_pattern;
        elasticRequest.callWithInternalUser('create', { 
            index: '.kibana', 
            type: 'doc', 
            id: patternId, 
            body: {
                "type": 'index-pattern', 
                "index-pattern": { 
                    "title": index_pattern, 
                    "timeFieldName": '@timestamp',
		     "fieldFormatMap": '{"data.virustotal.permalink":{"id":"url"},"data.vulnerability.reference":{"id":"url"},"data.url":{"id":"url"}}'
                } 
            } 
        })
        .then(resp => {
            server.log([blueWazuh, 'initialize', 'info'], 'Created index pattern: ' + index_pattern);
            // Import objects (dashboards and visualizations)
            importObjects(index_pattern);
            importAppObjects(index_pattern);
        })
        .catch(error => {
            wazuhlogger.log({
                date: new Date(),
                level: 'error',
                location: 'initialize.js createIndexPattern',
                message: error.message || error
            });
            server.log([blueWazuh, 'initialize', 'error'], 'Error creating index-pattern.');
        });
    };

    // Configure Kibana status: Index pattern, default index pattern, default time, import dashboards.
    const configureKibana = (type) => {
        if (type === "install") {
            elasticRequest .callWithInternalUser('search', {
                index: '.kibana',
                type:  'doc',
                q:     `index-pattern.title:"${index_pattern}"`
            })
            .then(data => {
                if (data.hits.total >= 1) server.log([blueWazuh, 'initialize', 'info'], 'Skipping index-pattern creation. Already exists.');
                else createIndexPattern();
            })
            .catch(error => {
                wazuhlogger.log({
                    date: new Date(),
                    level: 'error',
                    location: 'initialize.js configureKibana',
                    message: error.message || error
                });
                server.log([blueWazuh, 'initialize', 'error'], 'Could not reach elasticsearch.');
            });
        }
    };

    // Save Wazuh App setup
    const saveConfiguration = () => {

        let shards = 1;
        let replicas = 1;

        if (configurationFile) {
            if (configurationFile["wazuh-version.shards"]) {
                shards = configurationFile["wazuh-version.shards"];
            }
            if (configurationFile["wazuh-version.replicas"]) {
                replicas = configurationFile["wazuh-version.replicas"];
            }
        }

        let shard_configuration = {
            "settings" : {
                "index" : {
                    "number_of_shards" : shards, 
                    "number_of_replicas" : replicas
                }
            }
        };

        elasticRequest.callWithInternalUser('indices.create', {
            index: '.wazuh-version',
            body: shard_configuration
        })
        .then(() => {

            let configuration = {
                "name":             "Wazuh App",
                "app-version":      packageJSON.version,
                "revision":         packageJSON.revision,
                "installationDate": new Date().toISOString()
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
            .catch(error => {
                server.log([blueWazuh, 'initialize', 'error'], 'Could not insert Wazuh configuration');
            });
        })
        .catch(error => {
            wazuhlogger.log({
                date: new Date(),
                level: 'error',
                location: 'initialize.js saveConfiguration',
                message: error.message || error
            });
            server.log([blueWazuh, 'initialize', 'error'], 'Error creating index .wazuh-version.');
        });
    };

    // Init function. Check for "wazuh-version" document existance.
    const init = () => {
        elasticRequest.callWithInternalUser('indices.exists', {
            index: '.wazuh'
        })
        .then((result) => {
            if (!result) {

                let shards = 1;
                let replicas = 1;
                
                if (configurationFile) {
                    if (configurationFile["wazuh.shards"]) {
                        shards = configurationFile["wazuh.shards"];
                    }
                    if (configurationFile["wazuh.replicas"]) {
                        replicas = configurationFile["wazuh.replicas"];
                    }
                }

                let configuration = {
                    "settings" : {
                        "index" : {
                            "number_of_shards" : shards, 
                            "number_of_replicas" : replicas
                        }
                    }
                };

                elasticRequest.callWithInternalUser('indices.create', {
                    index: '.wazuh',
                    body: configuration
                })
                .then(() => {
                    server.log([blueWazuh, 'initialize', 'info'], 'Index .wazuh created.');
                })
                .catch(error => {
                    server.log([blueWazuh, 'initialize', 'error'], 'Error creating index .wazuh.');
                });
            } else { // The .wazuh index exists, we now proceed to check whether it's from an older version
                elasticRequest.callWithInternalUser('get', {
                    index: ".wazuh",
                    type: "wazuh-setup",
                    id: "1"
                })
                .then(data => {
                    // Reindex!
                    reindexOldVersion();
                })
                .catch(error => {
                    if(error.message && error.message !== 'Not Found'){
                        wazuhlogger.log({
                            date: new Date(),
                            level: 'error',
                            location: 'initialize.js init 1',
                            message: error.message || error
                        });
                    }
                    server.log([blueWazuh, 'initialize', 'info'], 'No older .wazuh index found -> no need to reindex.');
                });
            }
        })
        .catch(error => {
            wazuhlogger.log({
                date: new Date(),
                level: 'error',
                location: 'initialize.js init 2',
                message: error.message || error
            });
            server.log([blueWazuh, 'initialize', 'error'], 'Could not check if .wazuh index exists due to ' + error);
        });

        elasticRequest.callWithInternalUser('get', {
            index: ".wazuh-version",
            type: "wazuh-version",
            id: "1"
        })
        .then(data => {
            server.log([blueWazuh, 'initialize', 'info'], '.wazuh-version document already exists. Updating version information and visualizations...');

            elasticRequest.callWithInternalUser('update', { 
                index: '.wazuh-version', 
                type: 'wazuh-version',
                id: 1,
                body: {
                    'doc': {
                        "app-version": packageJSON.version,
                        "revision": packageJSON.revision
                    }
                } 
            })
            .then((response) => {
                server.log([blueWazuh, 'initialize', 'info'], 'Successfully updated version information');
            })
            .catch(error => {
                wazuhlogger.log({
                    date: new Date(),
                    level: 'error',
                    location: 'initialize.js init 3',
                    message: error.message || error
                });
                server.log([blueWazuh, 'initialize', 'error'], 'Could not update version information due to ' + error);
            });

            // We search for the currently applied pattern in the visualizations
            elasticRequest .callWithInternalUser('search', {
                index: '.kibana',
                type:  'doc',
                q:     `visualization.title:"Wazuh App Overview General Metric alerts"`
            })
            .then(data => {
                
                elasticRequest.callWithInternalUser('deleteByQuery', { 
                    index: '.kibana', 
                    body: {
                        'query': {
                            'bool': {
                                'must': {
                                    'match': {
                                        "visualization.title": 'Wazuh App*'
                                    }
                                },
                                'must_not': {
                                    "match": {
                                        "visualization.title": 'Wazuh App Overview General Agents status'
                                    }
                                }
                            }
                        }
                    } 
                })
                .then((response) => {
                    // Update the visualizations
                    importAppObjects(JSON.parse(data.hits.hits[0]._source.visualization.kibanaSavedObjectMeta.searchSourceJSON).index);
                })
                .catch(error => {
                    wazuhlogger.log({
                        date: new Date(),
                        level: 'error',
                        location: 'initialize.js init 4',
                        message: error.message || error
                    });
                    server.log([blueWazuh, 'initialize', 'error'], 'Could not update visualizations due to ' + error);
                });
                
            })
            .catch(error => {
                wazuhlogger.log({
                    date: new Date(),
                    level: 'error',
                    location: 'initialize.js init 5',
                    message: error.message || error
                });
                server.log([blueWazuh, 'initialize', 'error'], 'Could not get a sample for the pattern due to ' + error);
            });
        })
        .catch(error => {
            wazuhlogger.log({
                date: new Date(),
                level: 'error',
                location: 'initialize.js init 6',
                message: error.message || error
            });
            server.log([blueWazuh, 'initialize', 'info'], '.wazuh-version document does not exist. Initializating configuration...');

            // Save Setup Info
            saveConfiguration(index_pattern);
            configureKibana("install");
        });
    };

    const createKibanaTemplate = () => {
        server.log([blueWazuh, 'initialize', 'info'], 'Creating template for .kibana.');
    	
    	try {
            kibana_template = require(KIBANA_TEMPLATE);
        } catch (e) {
            server.log([blueWazuh, 'initialize', 'error'], 'Could not read the .kibana template file.');
            server.log([blueWazuh, 'initialize', 'error'], 'Path: ' + KIBANA_TEMPLATE);
            server.log([blueWazuh, 'initialize', 'error'], 'Exception: ' + e);
        }

        return elasticRequest.callWithInternalUser('indices.putTemplate', 
        {
            name: 'wazuh-kibana',
            order: 0,
            create: true,
            body:  kibana_template
        });
    };

    // Does .kibana index exist?
    const checkKibanaStatus  = () => {
        elasticRequest.callWithInternalUser('indices.exists', {
            index: ".kibana"
        })
        .then(data => {
            if (data) { // It exists, initialize!
                init();
            }
            else { // No .kibana index created...
		        server.log([blueWazuh, 'initialize', 'info'], "Didn't find .kibana index...");

                elasticRequest.callWithInternalUser('indices.getTemplate', 
                {
                    name: 'wazuh-kibana'
                })
                .then(data => {
                    server.log([blueWazuh, 'initialize', 'info'], 'No need to create the .kibana template, already exists.');

                    elasticRequest.callWithInternalUser('indices.create', { index: '.kibana' })
                    .then(data => {
                        server.log([blueWazuh, 'initialize', 'info'], 'Successfully created .kibana index.');
                        init();
                    })
                    .catch(error => {
                        wazuhlogger.log({
                            date: new Date(),
                            level: 'error',
                            location: 'initialize.js checkKibanaStatus',
                            message: error.message || error
                        });
                        server.log([blueWazuh, 'initialize', 'error'], 'Error creating .kibana index due to ' + error);
                    });
                })
                .catch(error => {
                    wazuhlogger.log({
                        date: new Date(),
                        level: 'error',
                        location: 'initialize.js checkKibanaStatus',
                        message: error.message || error
                    });
                    createKibanaTemplate()
                    .then(data => {
                        server.log([blueWazuh, 'initialize', 'info'], 'Successfully created .kibana template.');

                        elasticRequest.callWithInternalUser('indices.create', { index: '.kibana' })
                        .then(data => {
                            server.log([blueWazuh, 'initialize', 'info'], 'Successfully created .kibana index.');
                            init();
                        })
                        .catch(error => {
                            wazuhlogger.log({
                                date: new Date(),
                                level: 'error',
                                location: 'initialize.js checkKibanaStatus',
                                message: error.message || error
                            });
                            server.log([blueWazuh, 'initialize', 'error'], 'Error creating .kibana index due to ' + error);
                        });
                    }).catch(error => {
                        wazuhlogger.log({
                            date: new Date(),
                            level: 'error',
                            location: 'initialize.js checkKibanaStatus',
                            message: error.message || error
                        });
                        server.log([blueWazuh, 'initialize', 'error'], 'Error creating template for .kibana due to ' + error);
                    });
                });
		    }
        })
        .catch(error => {
            wazuhlogger.log({
                date: new Date(),
                level: 'error',
                location: 'initialize.js checkKibanaStatus',
                message: error.message || error
            });
		    server.log([blueWazuh, 'initialize', 'error'], 'Could not check .kibana index due to ' + error);
        });
    };

    // Wait until Elasticsearch js is ready
    const checkStatus = () => {
        server.plugins.elasticsearch.waitUntilReady().then(data => { checkKibanaStatus() })
        .catch(error => {
            wazuhlogger.log({
                date: new Date(),
                level: 'error',
                location: 'initialize.js checkStatus',
                message: error.message || error
            });
            server.log([blueWazuh, 'initialize', 'info'], 'Waiting for elasticsearch plugin to be ready...');
            setTimeout(() => checkStatus(), 3000);
        });
    };

    const reachAPI = (wapi_config) => {
        // Now, let's see whether they have a 2.x or 3.x version
        let id = wapi_config._id;
        wapi_config = wapi_config._source;

        server.log([blueWazuh, 'reindex', 'info'], 'Reaching ' + wapi_config.manager);
        let decoded_password = Buffer.from(wapi_config.api_password, 'base64').toString("ascii");
        if (wapi_config.cluster_info === undefined) { // No cluster_info in the API configuration data -> 2.x version
            needle('get', `${wapi_config.url}:${wapi_config.api_port}/version`, {}, {
                username:           wapi_config.api_user,
                password:           decoded_password,
                rejectUnauthorized: !wapi_config.insecure
            })
            .then((response) => {
                server.log([blueWazuh, 'reindex', 'info'], 'API is reachable ' + wapi_config.manager);
                if (parseInt(response.body.error) === 0 && response.body.data) {
                    needle('get', `${wapi_config.url}:${wapi_config.api_port}/cluster/status`, {}, { // Checking the cluster status
                        username:           wapi_config.api_user,
                        password:           decoded_password,
                        rejectUnauthorized: !wapi_config.insecure
                    })
                    .then((response) => {
                        if (!response.body.error) {
                            if (response.body.data.enabled === 'yes') { // If cluster mode is active
                                needle('get', `${wapi_config.url}:${wapi_config.api_port}/cluster/node`, {}, {
                                    username:           wapi_config.api_user,
                                    password:           decoded_password,
                                    rejectUnauthorized: !wapi_config.insecure
                                })
                                .then((response) => {
                                    if (!response.body.error) {
                                        wapi_config.cluster_info = {};
                                        wapi_config.cluster_info.status = 'enabled';
                                        wapi_config.cluster_info.manager = wapi_config.manager;
                                        wapi_config.cluster_info.node = response.body.data.node;
                                        wapi_config.cluster_info.cluster = response.body.data.cluster;
                                    } else if (response.body.error){
                                        server.log([blueWazuh, 'reindex', 'error'], 'Could not get cluster/node information for ', wapi_config.manager);
                                    }
                                });
                            }
                            else { // Cluster mode is not active
                                wapi_config.cluster_info = {};
                                wapi_config.cluster_info.status = 'disabled';
                                wapi_config.cluster_info.cluster = 'Disabled';
                                wapi_config.cluster_info.manager = wapi_config.manager;
                            }

                            // We filled data for the API, let's insert it now
                            elasticRequest.callWithInternalUser('update', { 
                                index: '.wazuh', 
                                type: 'wazuh-configuration',
                                id: id,
                                body: {
                                    'doc': {
                                        "api_user": wapi_config.api_user,
                                        "api_password": wapi_config.api_password,
                                        "url": wapi_config.url,
                                        "api_port": wapi_config.api_port,
                                        "manager": wapi_config.manager,
                                        "cluster_info" : {
                                            "manager" : wapi_config.manager,
                                            "node" : wapi_config.cluster_info.node,
                                            "cluster" : wapi_config.cluster_info.cluster,
                                            "status" : wapi_config.cluster_info.status
                                        },
                                    }
                                } 
                            })
                            .then(resp => {
                                server.log([blueWazuh, 'reindex', 'info'], 'Successfully updated proper cluster information for ' + wapi_config.manager);
                            })
                            .catch(error => {
                                wazuhlogger.log({
                                    date: new Date(),
                                    level: 'error',
                                    location: 'initialize.js reachAPI',
                                    message: error.message || error
                                });
                                server.log([blueWazuh, 'reindex', 'error'], 'Could not update proper cluster information for ' + wapi_config.manager + 'due to ' + err);
                            });
                        } else {
                            server.log([blueWazuh, 'reindex', 'error'], 'Could not get cluster/status information for ' + wapi_config.manager);
                        }
                    });
                } else {
                    server.log([blueWazuh, 'reindex', 'error'], 'The API responded with some kind of error for ' + wapi_config.manager);
                }
            })
            .catch(error => {
                wazuhlogger.log({
                    date: new Date(),
                    level: 'error',
                    location: 'initialize.js reachAPI',
                    message: error.message || error
                });
                server.log([blueWazuh, 'reindex', 'info'], 'API is NOT reachable ' + wapi_config.manager);
                // We weren't able to reach the API, reorganize data and fill with sample node and cluster name information
                elasticRequest.callWithInternalUser('update', { 
                    index: '.wazuh', 
                    type: 'wazuh-configuration',
                    id: id,
                    body: {
                        'doc': {
                            "api_user": wapi_config.api_user,
                            "api_password": wapi_config.api_password,
                            "url": wapi_config.url,
                            "api_port": wapi_config.api_port,
                            "manager": wapi_config.manager,
                            "cluster_info" : {
                                "manager" : wapi_config.manager,
                                "node" : "nodata",
                                "cluster" : "nodata",
                                "status" : "disabled"
                            },
                        }
                    } 
                })
                .then(resp => {
                    server.log([blueWazuh, 'reindex', 'info'], 'Successfully updated sample cluster information for ' + wapi_config.manager);
                })
                .catch(error => {
                    wazuhlogger.log({
                        date: new Date(),
                        level: 'error',
                        location: 'initialize.js reachAPI',
                        message: error.message || error
                    });
                    server.log([blueWazuh, 'reindex', 'error'], 'Could not update sample cluster information for ' + wapi_config.manager + 'due to ' + err);
                });
            });
        } else { // 3.x version
            // Nothing to be done, cluster_info is present
            server.log([blueWazuh, 'reindex', 'info'], 'Nothing to be done for ' + wapi_config.manager + ' as it is already a 3.x version.');
        }
    };

    // Reindex a .wazuh index from 2.x-5.x or 3.x-5.x to .wazuh and .wazuh-version in 3.x-6.x
    const reindexOldVersion = () => {
        server.log([blueWazuh, 'reindex', 'info'], `Old version detected. Proceeding to reindex.`);

        let configuration = {
          "source": {
            "index": ".wazuh",
            "type": "wazuh-configuration"
          },
          "dest": {
            "index": ".old-wazuh"
          }
        };

        // Backing up .wazuh index
        elasticRequest.callWithInternalUser('reindex', { body: configuration })
        .then((result) => {
            // And...this response does not take into acount new index population so...let's wait for it
            server.log([blueWazuh, 'reindex', 'info'], 'Successfully backed up .wazuh index');
            setTimeout(() => swapIndex(), 3000);
        })
        .catch(error => {
            wazuhlogger.log({
                date: new Date(),
                level: 'error',
                location: 'initialize.js reindexOldVersion',
                message: error.message || error
            });
            server.log([blueWazuh, 'reindex', 'error'], 'Could not begin the reindex process: ' + error);
        });
    };

    const swapIndex = () => {
        // Deleting old .wazuh index
        server.log([blueWazuh, 'reindex', 'info'], 'Deleting old .wazuh index.');

        elasticRequest.callWithInternalUser('indices.delete', { index: ".wazuh" })
        .then(data => {
            let configuration = {
                "source": {
                    "index": ".old-wazuh",
                    "type": "wazuh-configuration"
                },
                    "dest": {
                    "index": ".wazuh"
                },
                "script": {
                    "source": "ctx._id = new Date().getTime()",
                    "lang": "painless"
                }
            };

            server.log([blueWazuh, 'reindex', 'info'], 'Reindexing into the new .wazuh');
            // Reindexing from .old-wazuh where the type of document is wazuh-configuration into the new index .wazuh
            elasticRequest.callWithInternalUser('reindex', { body: configuration })
            .then((result) => {
                // Now we need to properly replace the cluster_info into the configuration -> improvement: pagination?
                // And...this response does not take into acount new index population so...let's wait for it
                setTimeout(() => reachAPIs(), 3000);
            })
            .catch(error => {
                wazuhlogger.log({
                    date: new Date(),
                    level: 'error',
                    location: 'initialize.js swapIndex',
                    message: error.message || error
                });
                server.log([blueWazuh, 'reindex', 'error'], 'Could not reindex the new .wazuh: ' + error);
            });
        })
        .catch(error => {
            wazuhlogger.log({
                date: new Date(),
                level: 'error',
                location: 'initialize.js swapIndex',
                message: error.message || error
            });
            server.log([blueWazuh, 'reindex', 'error'], 'Could not delete the old .wazuh index: ' + error);
        });
    };

    const reachAPIs = () => {
        elasticRequest.callWithInternalUser('search', { index: ".wazuh"} )
        .then(data => {
            for (var i = 0; i < data.hits.hits.length; i++) {
                reachAPI(data.hits.hits[i]);
            }
        })
        .catch(error => {
            wazuhlogger.log({
                date: new Date(),
                level: 'error',
                location: 'initialize.js reachAPIs',
                message: error.message || error
            });
            server.log([blueWazuh, 'reindex', 'error'], 'Something happened while getting old API configuration data: ' + error);
        });
    };

    // Check Kibana index and if it is prepared, start the initialization of Wazuh App.
    checkStatus();

    module.exports = importAppObjects;
};
