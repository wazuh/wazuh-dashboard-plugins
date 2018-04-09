// External libraries
const cron      = require('node-cron');
const needle    = require('needle');
const getPath   = require('../util/get-path');

// Colors for console logging 
const colors    = require('ansicolors');
const blueWazuh = colors.blue('wazuh');

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
    
            const response = await needle('get', `${getPath(apiEntry)}/agents`, payload, options);

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
    const getConfig = async () => {
        try {
            const data = await elasticRequest.callWithInternalUser('search', {
                index: '.wazuh',
                type: 'wazuh-configuration'
            })
            
            if (data.hits.total > 0) {
                return data.hits;
            }

            log('monitoring.js getConfig','no credentials');
            return {
                error     : 'no credentials',
                error_code: 1
            };
            
        } catch (error){
            log('monitoring.js getConfig',error.message || error);
            return {
                error     : 'no elasticsearch',
                error_code: 2
            };
        }
    };

    // fetchAgents on demand
    const fetchAgents = async () => {
        try {
            const data = await getConfig();
            return loadCredentials(data);
        } catch(error){
            return Promise.reject(error);
        }
    };

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
                        "fields":'[{"name":"@timestamp","type":"date","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"_id","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":false},{"name":"_index","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":false},{"name":"_score","type":"number","count":0,"scripted":false,"searchable":false,"aggregatable":false,"readFromDocValues":false},{"name":"_source","type":"_source","count":0,"scripted":false,"searchable":false,"aggregatable":false,"readFromDocValues":false},{"name":"_type","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":false},{"name":"dateAdd","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"dateAdd.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"group","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"group.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"host","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"id","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"ip","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"lastKeepAlive","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"lastKeepAlive.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"manager_host","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"manager_host.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"name","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"os.arch","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"os.arch.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"os.codename","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"os.codename.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"os.major","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"os.major.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"os.name","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"os.name.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"os.platform","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"os.platform.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"os.uname","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"os.uname.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"os.version","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"os.version.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"status","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"version","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"version.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true}]',
                        "title": index_pattern, 
                        "timeFieldName": '@timestamp' 
                    } 
                } 
            })
            log('monitoring.js configureKibana', `Created index pattern: ${index_pattern}`, 'info');
            server.log([blueWazuh, 'monitoring', 'info'], `Created index pattern: ${index_pattern}`);

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
            log('monitoring.js checkTemplate', 'Updating wazuh-monitoring template...', 'info');
            server.log([blueWazuh, 'monitoring', 'info'], "Updating wazuh-monitoring template...");
            const monitoringTemplate = require('./integration-files/monitoring-template');
            const data = await elasticRequest.callWithInternalUser('indices.putTemplate', {
                name  : 'wazuh-agent',
                body  : monitoringTemplate
            });
            return;
        } catch(error){
            log('monitoring.js checkTemplate', 'Something went wrong updating wazuh-monitoring template...' + error.message || error);
            server.log([blueWazuh, 'monitoring', 'info'], "Something went wrong updating wazuh-monitoring template..." + error.message || error);
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

            // Checks if wazuh-monitoring index pattern is already created, if it fails create it
            try{
                log('monitoring.js init', 'Checking if wazuh-monitoring pattern exists...', 'info');
                server.log([blueWazuh, 'monitoring', 'info'], 'Checking if wazuh-monitoring pattern exists...');
                await elasticRequest.callWithInternalUser('get', {
                    index: '.kibana',
                    type:  'doc',
                    id: patternId
                });
            } catch (error) {
                log('monitoring.js init', 'Didn\'t find wazuh-monitoring pattern for Kibana v6.x. Proceeding to create it...');
                server.log([blueWazuh, 'monitoring', 'info'], "Didn't find wazuh-monitoring pattern for Kibana v6.x. Proceeding to create it...");
                return createWazuhMonitoring();
            }

            log('monitoring.js init', 'Skipping wazuh-monitoring pattern creation. Already exists.', 'info');
            server.log([blueWazuh, 'monitoring', 'info'], 'Skipping wazuh-monitoring creation. Already exists.');
            
            return;
 
        } catch (error) {
            server.log([blueWazuh, 'monitoring', 'error'], error.message || error);
            log('monitoring.js init', error.message || error);
            return;
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
            log('monitoring.js checkKibanaStatus','Waiting for Kibana and Elasticsearch servers to be ready...','info');
            server.log([blueWazuh, 'monitoring', 'info'], 'Waiting for Kibana and Elasticsearch servers to be ready...');
            await checkElasticsearchServer();
            await init();
            return;
        } catch(error) {
            log('monitoring.js checkKibanaStatus',error.message || error);
            server.log([blueWazuh, 'monitoring', 'info'], 'Waiting for Kibana and Elasticsearch servers to be ready...','info');
            setTimeout(() => checkKibanaStatus(), 3000);
        }
    };

    // Check Kibana index and if it is prepared, start the initialization of Wazuh App.
    checkKibanaStatus();

    // Cron tab for getting agent status.
    cron.schedule('0 */10 * * * *', () => {
        agentsArray.length = 0;
        getConfig()
        .then(data => loadCredentials(data))
        .catch(error => {
            log('monitoring.js',error.message || error);
            server.log([blueWazuh, 'monitoring', 'error'], error.message || error)
        });
    }, true);

    module.exports = fetchAgents;
};
