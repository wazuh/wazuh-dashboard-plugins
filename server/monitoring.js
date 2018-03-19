// External libraries
const cron      = require('node-cron');
const needle    = require('needle');
const getPath   = require('../util/get-path');

// Colors for console logging 
const colors    = require('ansicolors');
const blueWazuh = colors.blue('wazuh');

const APP_OBJECTS_FILE = './integration-files/app-objects-file-monitoring.json';

const { log } = require('./logger');

module.exports = (server, options) => {
    // Elastic JS Client
    const elasticRequest = server.plugins.elasticsearch.getCluster('admin');

    // Initialize
    let agentsArray   = [];
    let index_pattern = "wazuh-monitoring-3.x-*";
    let index_prefix  = "wazuh-monitoring-3.x-";
    let fDate         = new Date().toISOString().replace(/T/, '-').replace(/\..+/, '').replace(/-/g, '.').replace(/:/g, '').slice(0, -7);
    let todayIndex    = index_prefix + fDate;
    let packageJSON   = {};
    let app_objects   = {};
    
    // Read Wazuh App package file
    try {
        packageJSON = require('../package.json');
    } catch (error) {
        log('monitoring.js', error.message || error);
        server.log([blueWazuh, 'monitoring', 'error'], 'Could not read the Wazuh package file due to ' + error.message || error);
    }

    // Check status and get agent status array
    const checkStatus = async (apiEntry, maxSize, offset) => {
        try {
            if (!maxSize) {
                throw new Error('You must provide a max size')
            }
    
            const payload = {
                offset: offset ? offset: 0,
                limit : (250 < maxSize) ? 250 : maxSize
            };
    
            const options = {
                headers: {
                    'wazuh-app-version': packageJSON.version
                },
                username:           apiEntry.user,
                password:           apiEntry.password,
                rejectUnauthorized: !apiEntry.insecure
            };
    
            const response = await needle.request('get', `${getPath(apiEntry)}/agents`, payload, options);

            if (!response.error && response.body.data.items) {
                agentsArray = agentsArray.concat(response.body.data.items);
                if ((payload.limit + payload.offset) < maxSize) {
                    return checkStatus(apiEntry, response.body.data.totalItems, payload.limit + payload.offset);
                } else {
                    await saveStatus();
                }
            } else {
                throw new Error('Can not access Wazuh API')
            }
            
            return;

        } catch (error) {
            log('monitoring.js', 'Can not access Wazuh API ' + error.message || error);
            server.log([blueWazuh, 'monitoring', 'error'], 'Can not access Wazuh API ' + error.message || error);
        }
    };

    // Check API status twice and get agents total items
    const checkAndSaveStatus = async apiEntry => {
        try{
            const payload = {
                'offset': 0,
                'limit':  1
            };
    
            const options = {
                headers: {
                    'wazuh-app-version': packageJSON.version
                },
                username: apiEntry.user,
                password: apiEntry.password,
                rejectUnauthorized: !apiEntry.insecure
            };
    
            const response = await needle('get', `${getPath(apiEntry)}/agents`, payload, options)
     
            if (!response.error && response.body.data && response.body.data.totalItems) {
                checkStatus(apiEntry, response.body.data.totalItems);
            } else {
                log('monitoring.js', 'Wazuh API credentials not found or are not correct. Open the app in your browser and configure it to start monitoring agents.');
                server.log([blueWazuh, 'monitoring', 'error'], 'Wazuh API credentials not found or are not correct. Open the app in your browser and configure it to start monitoring agents.');
            }
            return;
        } catch(error){
            log('monitoring.js',error.message || error);
            server.log([blueWazuh, 'monitoring', 'error'], error.message || error);
        }   
    };

    // Load Wazuh API credentials from Elasticsearch document
    const loadCredentials = async apiEntries => {
        try {
            if (typeof apiEntries === 'undefined' || !('hits' in apiEntries)) return;

            const filteredApis = apiEntries.hits.filter((element, index, self) =>
                index === self.findIndex((t) => (
                    t._source.api_user === element._source.api_user && 
                    t._source.api_password === element._source.api_password &&
                    t._source.url === element._source.url && 
                    t._source.api_port === element._source.api_port
                ))
            );
    
            for(let element of filteredApis) {
                let apiEntry = {
                    'user':     element._source.api_user,
                    'password': Buffer.from(element._source.api_password, 'base64').toString("ascii"),
                    'url':      element._source.url,
                    'port':     element._source.api_port,
                    'insecure': element._source.insecure
                };
                if (apiEntry.error) {
                    log('monitoring.js loadCredentials', apiEntry.error || apiEntry);
                    server.log([blueWazuh, 'monitoring', 'error'], `Error getting wazuh-api data: ${apiEntry.error}`);
                    break;
                }
                await checkAndSaveStatus(apiEntry);
            }
        } catch(error){
            log('monitoring.js',error.message || error);
            server.log([blueWazuh, 'monitoring', 'error'], error.message || error);
        }
    };

    // Get API configuration from elastic and callback to loadCredentials
    const getConfig = async callback => {
        try {
            const data = await elasticRequest.callWithInternalUser('search', {
                index: '.wazuh',
                type: 'wazuh-configuration'
            })
            
            if (data.hits.total > 0) {
                return callback(data.hits);
            }

            log('monitoring.js getConfig','no credentials');
            return callback({
                'error': 'no credentials',
                'error_code': 1
            });
            
        } catch (error){
            log('monitoring.js getConfig',error.message || error);
            return callback({
                'error': 'no elasticsearch',
                'error_code': 2
            });
        }
    };

    // Importing Wazuh app visualizations and dashboards
    const importAppObjects = async id => {
        try {
            log('monitoring.js importAppObjects','Importing Wazuh app visualizations...','info');
            server.log([blueWazuh, 'monitoring', 'info'], 'Importing Wazuh app visualizations...');
    
            try {
                app_objects = require(APP_OBJECTS_FILE);
            } catch (error) {
                log('monitoring.js importAppObjects', error.message || error);
                server.log([blueWazuh, 'monitoring', 'error'], 'Could not read the objects file.');
                server.log([blueWazuh, 'monitoring', 'error'], 'Path: ' + APP_OBJECTS_FILE);
                server.log([blueWazuh, 'monitoring', 'error'], 'Exception: ' + error.message || error);
            }
    
            let body = '';
            for(let element of app_objects){
                body += '{ "index":  { "_index": ".kibana", "_type": "doc", ' + 
                '"_id": "' + element._type + ':' + element._id + '" } }\n';
    
                let temp = {};
                let aux  = JSON.stringify(element._source);
                aux      = aux.replace("wazuh-monitoring", id);
                aux      = JSON.parse(aux);
                temp[element._type] = aux;
                
                if (temp[element._type].kibanaSavedObjectMeta.searchSourceJSON.index) {
                    temp[element._type].kibanaSavedObjectMeta.searchSourceJSON.index = id;
                }
                
                temp["type"] = element._type;
                body        += JSON.stringify(temp) + "\n";
            }
    
            await elasticRequest.callWithInternalUser('bulk', {
                index: '.kibana',
                body:  body
            })

            await elasticRequest.callWithInternalUser('indices.refresh', {
                index: ['.kibana', index_pattern]
            })

  
            log('monitoring.js importAppObjects', 'Wazuh app visualizations were successfully installed. App ready to be used.', 'info');
            server.log([blueWazuh, 'monitoring', 'info'], 'Wazuh app visualizations were successfully installed. App ready to be used.');

            return;

        } catch (error) {
            log('monitoring.js importAppObjects',error.message || error);
            server.log([blueWazuh, 'server', 'error'], 'Error importing objects into elasticsearch. Bulk request failed.' + error.message || error);
        }
    };

    // fetchAgents on demand
    const fetchAgents = () => getConfig(loadCredentials);

    // Configure Kibana patterns.
    const configureKibana = async () => {
        try {
            log('monitoring.js configureKibana', `Creating index pattern: ${index_pattern}`, 'info');
            server.log([blueWazuh, 'monitoring', 'info'], `Creating index pattern: ${index_pattern}`);
    
            let patternId = 'index-pattern:' + index_pattern;
            await elasticRequest.callWithInternalUser('create', { 
                index: '.kibana', 
                type: 'doc', 
                id: patternId, 
                body: {
                    "type": 'index-pattern', 
                    "index-pattern": { 
                        "title": index_pattern, 
                        "timeFieldName": '@timestamp' 
                    } 
                } 
            })
            log('monitoring.js configureKibana', `Created index pattern: ${index_pattern}`, 'info');
            server.log([blueWazuh, 'monitoring', 'info'], `Created index pattern: ${index_pattern}`);
            await importAppObjects(index_pattern);
            return;
        } catch(error) {
            log('monitoring.js configureKibana',error.message || error);
            server.log([blueWazuh, 'monitoring', 'error'], 'Error creating index-pattern due to ' + error);
        }
    };

    // Creating wazuh-monitoring index
    const createIndex = async todayIndex => {
        try {
            await elasticRequest.callWithInternalUser('indices.create', { index: todayIndex });
            log('monitoring.js createIndex', 'Successfully created today index.', 'info');
            server.log([blueWazuh, 'monitoring', 'info'], 'Successfully created today index.');
            await insertDocument(todayIndex);
            return;
        } catch (error) {
            log('monitoring.js createIndex', error.message || error);
            server.log([blueWazuh, 'monitoring', 'error'], `Could not create ${todayIndex} index on elasticsearch due to ` + error.message || error);
        }
    };

    // Inserting one document per agent into Elastic. Bulk.
    const insertDocument = async todayIndex => {
        try {
            let body = '';
            if (agentsArray.length > 0) {
                let managerName = agentsArray[0].name;
    
                for(let element of agentsArray) {
                    body += '{ "index":  { "_index": "' + todayIndex + '", "_type": "wazuh-agent" } }\n';
                    let date              = new Date(Date.now()).toISOString();
                    element["@timestamp"] = date;
                    element["host"]       = managerName;
                    body                 += JSON.stringify(element) + "\n";
                }
    
                if (body === '') return;
    
                const response = await elasticRequest.callWithInternalUser('bulk', {
                    index: todayIndex,
                    type:  'agent',
                    body:  body
                })

                agentsArray.length = 0;
            }
            return;
        } catch (error) {
            log('monitoring.js insertDocument', error.message || error);
            server.log([blueWazuh, 'monitoring', 'error'], 'Error inserting agent data into elasticsearch. Bulk request failed due to ' + error.message || error);
        }
    };

    // Save agent status into elasticsearch, create index and/or insert document
    const saveStatus = async () => {
        try {
            fDate      = new Date().toISOString().replace(/T/, '-').replace(/\..+/, '').replace(/-/g, '.').replace(/:/g, '').slice(0, -7);
            todayIndex = index_prefix + fDate;
    
            const result = await elasticRequest.callWithInternalUser('indices.exists', { index: todayIndex })
            
            result ? await insertDocument(todayIndex) : await createIndex(todayIndex);

            return;
           
        } catch (error) {
            log('monitoring.js saveStatus', `Could not check if the index ${todayIndex} exists due to ${error.message || error}`);
            server.log([blueWazuh, 'monitoring', 'error'], `Could not check if the index ${todayIndex} exists due to ` + error);
        }
    };

    const createWazuhMonitoring = async () => {
        try{
            
            const patternId = 'index-pattern:' + index_pattern;
            try{
                await elasticRequest.callWithInternalUser('delete', { 
                    index: '.kibana', 
                    type: 'doc',
                    id: 'index-pattern:wazuh-monitoring-*' 
                })
                log('monitoring.js init', 'Successfully deleted old wazuh-monitoring pattern.', 'info');
                server.log([blueWazuh, 'monitoring', 'info'], "Successfully deleted old wazuh-monitoring pattern.");
            } catch (error) {
                log('monitoring.js init', 'No need to delete old wazuh-monitoring pattern.', 'info');
                server.log([blueWazuh, 'monitoring', 'info'], "No need to delete  old wazuh-monitoring pattern.");
            }

            await configureKibana();
            return;
        }catch(error){
            return Promise.reject(error);
        }
    }

    const checkTemplate = async () => {
        try {
            const monitoringTemplate = require('./integration-files/monitoring-template');
            const data = await elasticRequest.callWithInternalUser('indices.putTemplate', {
                name  : 'wazuh-agent',
                body  : monitoringTemplate
            });
            console.log(data);
            return;
        } catch(error){
            return Promise.reject(error);
        }
    }


    // Main. First execution when installing / loading App.
    const init = async () => {
        try {

            log('monitoring.js init', 'Creating/Updating wazuh-agent template...', 'info');
            await checkTemplate();

            log('monitoring.js init', 'Creating today index...', 'info');
            server.log([blueWazuh, 'monitoring', 'info'], 'Creating today index...');
            
            await saveStatus();
    
            const patternId = 'index-pattern:' + index_pattern;
            await elasticRequest.callWithInternalUser('get', {
                index: '.kibana',
                type:  'doc',
                id: patternId
            });

            log('monitoring.js init', 'Skipping index-pattern creation. Already exists.', 'info');
            server.log([blueWazuh, 'monitoring', 'info'], 'Skipping index-pattern creation. Already exists.');
            
            return;
 
        } catch (error) {
            server.log([blueWazuh, 'monitoring', 'error'], error.message);
            log('monitoring.js init', 'Didn\'t find wazuh-monitoring pattern for Kibana v6.x. Proceeding to create it...');
            server.log([blueWazuh, 'monitoring', 'info'], "Didn't find wazuh-monitoring pattern for Kibana v6.x. Proceeding to create it...");
            return createWazuhMonitoring();
        }
    };

    // Check Elasticsearch Server status and .kibana index presence
    const checkElasticsearchServer = async () => {
        try {
            const data = await elasticRequest.callWithInternalUser('indices.exists', { index: ".kibana" });
            if (data) {
                const pluginsData = await server.plugins.elasticsearch.waitUntilReady();
                return pluginsData;
            }
            return Promise.reject(data);
        } catch(error){
            log('monitoring.js checkElasticsearchServer',error.message || error);
            return Promise.reject(error);
        }
    }

    // Wait until Kibana server is ready
    const checkKibanaStatus = async () => {
        try {
            log('monitoring.js checkKibanaStatus','Waiting for Kibana and Elasticsearch servers to be ready...');
            server.log([blueWazuh, 'monitoring', 'info'], 'Waiting for Kibana and Elasticsearch servers to be ready...');
            await checkElasticsearchServer();
            await init();
            return;
        } catch(error) {
            log('monitoring.js checkKibanaStatus',error.message || error);
            server.log([blueWazuh, 'monitoring', 'info'], 'Waiting for Kibana and Elasticsearch servers to be ready...');
            setTimeout(() => checkKibanaStatus(), 3000);
        }
    };

    // Check Kibana index and if it is prepared, start the initialization of Wazuh App.
    checkKibanaStatus();

    // Cron tab for getting agent status.
    cron.schedule('0 */10 * * * *', () => {
        agentsArray.length = 0;
        getConfig(loadCredentials);
    }, true);

    module.exports = fetchAgents;
};
