const cron           = require('node-cron');
const needle         = require('needle');
const getPath        = require('../util/get-path');
const colors         = require('ansicolors');
const blueWazuh      = colors.blue('wazuh');
const { log }        = require('./logger');
const ElasticWrapper = require('./lib/elastic-wrapper');
const index_pattern  = "wazuh-monitoring-3.x-*";
const index_prefix   = "wazuh-monitoring-3.x-";

module.exports = (server, options) => {
    // Elastic JS Client
    const wzWrapper = new ElasticWrapper(server);

    // Initialize
    let agentsArray   = [];

    let fDate         = new Date().toISOString().replace(/T/, '-').replace(/\..+/, '').replace(/-/g, '.').replace(/:/g, '').slice(0, -7);
    let todayIndex    = index_prefix + fDate;
    let packageJSON   = {};
    
    // Read Wazuh App package file
    try {
        packageJSON = require('../package.json');
    } catch (error) {
        log('[monitoring]', error.message || error);
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
                    await saveStatus(apiEntry.clusterName);
                }
            } else {
                throw new Error('Can not access Wazuh API')
            }
            
            return;

        } catch (error) {
            log('[monitoring][checkStatus]', error.message || error);
            server.log([blueWazuh, 'monitoring', 'error'], error.message || error);
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
            
            const isCluster   = await needle('get',`${getPath(apiEntry)}/cluster/status`,{},options)
            const clusterName = (isCluster && isCluster.body && isCluster.body.data && isCluster.body.data.enabled === 'yes') ? 
                                await needle('get',`${getPath(apiEntry)}/cluster/node`,{},options) :
                                false;

            apiEntry.clusterName = clusterName && clusterName.body && clusterName.body.data && clusterName.body.data.cluster ?
                                   clusterName.body.data.cluster :
                                   false;

            if (!response.error && response.body.data && response.body.data.totalItems) {
                checkStatus(apiEntry, response.body.data.totalItems);
            } else {
                log('[monitoring][checkAndSaveStatus]', 'Wazuh API credentials not found or are not correct. Open the app in your browser and configure it to start monitoring agents.');
                server.log([blueWazuh, 'monitoring', 'error'], 'Wazuh API credentials not found or are not correct. Open the app in your browser and configure it to start monitoring agents.');
            }
            return;
        } catch(error){
            log('[monitoring][checkAndSaveStatus]',error.message || error);
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
                    log('[monitoring][loadCredentials]', apiEntry.error || apiEntry);
                    server.log([blueWazuh, 'monitoring', 'error'], `Error getting wazuh-api data: ${apiEntry.error}`);
                    break;
                }
                await checkAndSaveStatus(apiEntry);
            }
        } catch(error){
            log('[monitoring][loadCredentials]',error.message || error);
            server.log([blueWazuh, 'monitoring', 'error'], error.message || error);
        }
    };

    // Get API configuration from elastic and callback to loadCredentials
    const getConfig = async () => {
        try {
            const data = await wzWrapper.getWazuhAPIEntries();
            
            if (data.hits.total > 0) {
                return data.hits;
            }

            log('[monitoring][getConfig]','no credentials');
            return {
                error     : 'no credentials',
                error_code: 1
            };
            
        } catch (error){
            log('[monitoring][getConfig]',error.message || error);
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
            log('[monitoring][configureKibana]', `Creating index pattern: ${index_pattern}`, 'info');
            server.log([blueWazuh, 'monitoring', 'info'], `Creating index pattern: ${index_pattern}`);
    
            await wzWrapper.createMonitoringIndexPattern(index_pattern);

            log('[monitoring][configureKibana]', `Created index pattern: ${index_pattern}`, 'info');
            server.log([blueWazuh, 'monitoring', 'info'], `Created index pattern: ${index_pattern}`);

            return;
        } catch(error) {
            log('[monitoring][configureKibana]',error.message || error);
            server.log([blueWazuh, 'monitoring', 'error'], 'Error creating index-pattern due to ' + error);
        }
    };

    // Creating wazuh-monitoring index
    const createIndex = async (todayIndex,clusterName) => {
        try {
            await wzWrapper.createIndexByName(todayIndex);
            log('[monitoring][createIndex]', 'Successfully created today index.', 'info');
            server.log([blueWazuh, 'monitoring', 'info'], 'Successfully created today index.');
            await insertDocument(todayIndex,clusterName);
            return;
        } catch (error) {
            log('[monitoring][createIndex]', error.message || error);
            server.log([blueWazuh, 'monitoring', 'error'], `Could not create ${todayIndex} index on elasticsearch due to ` + error.message || error);
        }
    };

    // Inserting one document per agent into Elastic. Bulk.
    const insertDocument = async (todayIndex,clusterName) => {
        try {
            let body = '';
            if (agentsArray.length > 0) {
                const managerName = agentsArray[0].name;
                for(let element of agentsArray) {
                    body += '{ "index":  { "_index": "' + todayIndex + '", "_type": "wazuh-agent" } }\n';
                    let date              = new Date(Date.now()).toISOString();
                    element['@timestamp'] = date;
                    element.host          = managerName;
                    element.cluster       = { name: clusterName ? clusterName : 'disabled' } ;
                    body                 += JSON.stringify(element) + "\n";
                }
                if (body === '') return;
    
                const response = await wzWrapper.pushBulkAnyIndex(todayIndex,body);

                agentsArray.length = 0;
            }
            return;
        } catch (error) {
            log('[monitoring][insertDocument]', error.message || error);
            server.log([blueWazuh, 'monitoring', 'error'], 'Error inserting agent data into elasticsearch. Bulk request failed due to ' + error.message || error);
        }
    };

    // Save agent status into elasticsearch, create index and/or insert document
    const saveStatus = async clusterName => {
        try {
            fDate      = new Date().toISOString().replace(/T/, '-').replace(/\..+/, '').replace(/-/g, '.').replace(/:/g, '').slice(0, -7);
            todayIndex = index_prefix + fDate;
    
            const result = await wzWrapper.checkIfIndexExists(todayIndex);

            result ? await insertDocument(todayIndex,clusterName) : await createIndex(todayIndex,clusterName);

            return;
           
        } catch (error) {
            log('[monitoring][saveStatus]', `Could not check if the index ${todayIndex} exists due to ${error.message || error}`);
            server.log([blueWazuh, 'monitoring', 'error'], `Could not check if the index ${todayIndex} exists due to ` + error);
        }
    };

    const createWazuhMonitoring = async () => {
        try{
            
            try{
                await wzWrapper.deleteMonitoring();

                log('[monitoring][createWazuhMonitoring]', 'Successfully deleted old wazuh-monitoring pattern.', 'info');
                server.log([blueWazuh, 'monitoring', 'info'], "Successfully deleted old wazuh-monitoring pattern.");
            } catch (error) {
                log('[monitoring][createWazuhMonitoring]', 'No need to delete old wazuh-monitoring pattern.', 'info');
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
            log('[monitoring][checkTemplate]', 'Updating wazuh-monitoring template...', 'info');
            server.log([blueWazuh, 'monitoring', 'info'], "Updating wazuh-monitoring template...");
            const monitoringTemplate = require('./integration-files/monitoring-template');
            const data = await wzWrapper.putMonitoringTemplate(monitoringTemplate);
            return;
        } catch(error){
            log('[monitoring][checkTemplate]', 'Something went wrong updating wazuh-monitoring template...' + error.message || error);
            server.log([blueWazuh, 'monitoring', 'info'], "Something went wrong updating wazuh-monitoring template..." + error.message || error);
            return Promise.reject(error);
        }
    }


    // Main. First execution when installing / loading App.
    const init = async () => {
        try {

            log('[monitoring][init]', 'Creating/Updating wazuh-agent template...', 'info');
            await checkTemplate();

            log('[monitoring][init]', 'Creating today index...', 'info');
            server.log([blueWazuh, 'monitoring', 'info'], 'Creating today index...');
            
            await saveStatus();
    
            const patternId = 'index-pattern:' + index_pattern;

            // Checks if wazuh-monitoring index pattern is already created, if it fails create it
            try{
                log('[monitoring][init]', 'Checking if wazuh-monitoring pattern exists...', 'info');
                server.log([blueWazuh, 'monitoring', 'info'], 'Checking if wazuh-monitoring pattern exists...');
                await wzWrapper.getIndexPatternUsingGet(patternId);
            } catch (error) {
                log('[monitoring][init]', 'Didn\'t find wazuh-monitoring pattern for Kibana v6.x. Proceeding to create it...','info');
                server.log([blueWazuh, 'monitoring', 'info'], "Didn't find wazuh-monitoring pattern for Kibana v6.x. Proceeding to create it...");
                return createWazuhMonitoring();
            }

            log('[monitoring][init]', 'Skipping wazuh-monitoring pattern creation. Already exists.', 'info');
            server.log([blueWazuh, 'monitoring', 'info'], 'Skipping wazuh-monitoring creation. Already exists.');
            
            return;
 
        } catch (error) {
            server.log([blueWazuh, 'monitoring', 'error'], error.message || error);
            log('[monitoring][init]', error.message || error);
            return;
        }
    };

    // Check Elasticsearch Server status and Kibana index presence
    const checkElasticsearchServer = async () => {
        try {
            const data = await wzWrapper.checkIfIndexExists(wzWrapper.WZ_KIBANA_INDEX);

            if (data) {
                const pluginsData = await server.plugins.elasticsearch.waitUntilReady();
                return pluginsData;
            }
            return Promise.reject(data);
        } catch(error){
            log('[monitoring][checkElasticsearchServer]',error.message || error);
            return Promise.reject(error);
        }
    }

    // Wait until Kibana server is ready
    const checkKibanaStatus = async () => {
        try {
            log('[monitoring][checkKibanaStatus]','Waiting for Kibana and Elasticsearch servers to be ready...','info');
            server.log([blueWazuh, 'monitoring', 'info'], 'Waiting for Kibana and Elasticsearch servers to be ready...');
            await checkElasticsearchServer();
            await init();
            return;
        } catch(error) {
            log('[monitoring][checkKibanaStatus]',error.message || error);
            server.log([blueWazuh, 'monitoring', 'info'], 'Waiting for Kibana and Elasticsearch servers to be ready...','info');
            setTimeout(() => checkKibanaStatus(), 3000);
        }
    };

    // Check Kibana index and if it is prepared, start the initialization of Wazuh App.
    checkKibanaStatus();

    const cronTask = async () => {
        try {
            agentsArray = [];
            const data = await getConfig();
            await loadCredentials(data);
            return;
        } catch (error) {
            log('[monitoring][cronTask]',error.message || error);
            server.log([blueWazuh, 'monitoring [cronTask]', 'error'], error.message || error)
        }
    }
    cronTask()
    // Cron tab for getting agent status.
    cron.schedule('0 */10 * * * *', cronTask, true);

    module.exports = fetchAgents;
};
