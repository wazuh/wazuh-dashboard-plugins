const needle = require('needle');
const colors = require('ansicolors');
const blueWazuh = colors.blue('wazuh');
const fs = require('fs');
const yml = require('js-yaml');
const path = require('path');
const { log } = require('./logger');

const KIBANA_TEMPLATE = './integration-files/kibana-template';
const knownFields = require('./integration-files/known-fields')
const ElasticWrapper = require('./lib/elastic-wrapper');

module.exports = (server, options) => {

    log('initialize.js', 'Initializing', 'info');

    // Elastic JS Client
    const elasticRequest = server.plugins.elasticsearch.getCluster('data');
    const wzWrapper = new ElasticWrapper(server);
    let objects = {};
    let app_objects = {};
    let kibana_template = {};
    let packageJSON = {};
    let configurationFile = {};
    let pattern = null;
    let forceDefaultPattern = true;
    // Read config from package.json and config.yml
    try {
        configurationFile = yml.load(fs.readFileSync(path.join(__dirname, '../config.yml'), { encoding: 'utf-8' }));

        global.loginEnabled = (configurationFile && typeof configurationFile['login.enabled'] !== 'undefined') ? configurationFile['login.enabled'] : false;
        pattern = (configurationFile && typeof configurationFile.pattern !== 'undefined') ? configurationFile.pattern : 'wazuh-alerts-3.x-*';
        forceDefaultPattern = (configurationFile && typeof configurationFile['force.default'] !== 'undefined') ? configurationFile['force.default'] : true;
        packageJSON = require('../package.json');
    } catch (e) {
        log('initialize.js', e.message || e);
        server.log([blueWazuh, 'initialize', 'error'], 'Something went wrong while reading the configuration.' + e.message);
    }

    if (typeof global.sessions === 'undefined') {
        global.sessions = {};
    }

    global.protectedRoute = req => {
        if (!loginEnabled) return true;
        const session = (req.headers && req.headers.code) ? sessions[req.headers.code] : null;
        if (!session) return false;
        const timeElapsed = (new Date() - session.created) / 1000;
        if (timeElapsed >= session.exp) {
            delete sessions[req.payload.code];
            return false;
        }
        return true;
    }

    const defaultIndexPattern = pattern || "wazuh-alerts-3.x-*";




    /**
     * Updates .kibana index known fields
     * @param {*} patternId 'index-pattern:' + id
     */
    const updateKibanaIndexWithKnownFields = async patternId => {
        try {
            if(!patternId) return Promise.reject(new Error('No valid patternId for update index pattern'))
            const newFields = JSON.stringify(knownFields);
            await elasticRequest
            .callWithInternalUser('update', {
                index: '.kibana',
                type: 'doc',
                id: patternId,
                body: {
                    doc: {
                        "type": 'index-pattern',
                        "index-pattern": {  
                            "fields": newFields,
                            "fieldFormatMap": '{"data.virustotal.permalink":{"id":"url"},"data.vulnerability.reference":{"id":"url"},"data.url":{"id":"url"}}'
                        }
                     }
                }
             });
             return;
        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Refresh known fields for all valid index patterns.
     * Optionally forces the wazuh-alerts-3.x-* creation.
     */
    const checkKnownFields = async () => {
        try {
            const xpack = await elasticRequest.callWithInternalUser('cat.plugins', { });
            log('initialize.js checkKnownFields', `x-pack enabled: ${typeof xpack === 'string' && xpack.includes('x-pack') ? 'yes' : 'no'}`,'info')
            server.log([blueWazuh, 'initialize', 'info'], `x-pack enabled: ${typeof xpack === 'string' && xpack.includes('x-pack') ? 'yes' : 'no'}`);  
                    
            const indexPatternList = await wzWrapper.getAllIndexPatterns();
            
            log('initialize.js checkKnownFields', `Found ${indexPatternList.hits.total} index patterns`,'info')
            server.log([blueWazuh, 'initialize', 'info'], `Found ${indexPatternList.hits.total} index patterns`);
            let list = [];
            if(indexPatternList && indexPatternList.hits && indexPatternList.hits.hits){
                const minimum = ["@timestamp", "full_log", "manager.name", "agent.id"];
               
                if(indexPatternList.hits.hits.length > 0) {
                    for(const index of indexPatternList.hits.hits){   
                        let valid, parsed;        
                        try{
                            parsed = JSON.parse(index._source['index-pattern'].fields)
                        } catch (error){
                            continue;
                        }     
                        valid = parsed.filter(item => minimum.includes(item.name));
                        
                        if(valid.length === 4){
                            list.push({
                                id   : index._id.split('index-pattern:')[1],
                                title: index._source['index-pattern'].title
                            })
                        }
            
                    }
                }
            } 
            log('initialize.js checkKnownFields', `Found ${list.length} valid index patterns for Wazuh alerts`,'info')
            server.log([blueWazuh, 'initialize', 'info'], `Found ${list.length} valid index patterns for Wazuh alerts`);
            const defaultExists = list.filter(item => item.title === defaultIndexPattern);            

            if(defaultExists.length === 0 && forceDefaultPattern){
                log('initialize.js checkKnownFields', `Default index pattern not found, creating it...`,'info')
                server.log([blueWazuh, 'initialize', 'info'], `Default index pattern not found, creating it...`);
                await createIndexPattern();
                log('initialize.js checkKnownFields', 'Waiting for default index pattern creation to complete...','info')
                server.log([blueWazuh, 'initialize', 'info'], 'Waiting for default index pattern creation to complete...');   
                let waitTill = new Date(new Date().getTime() + 0.5 * 1000);
                let tmplist = null;
                while(waitTill > new Date()){
                    tmplist = await wzWrapper.searchIndexPatternById(defaultIndexPattern);
                    if(tmplist.hits.total >= 1) break;
                    else waitTill = new Date(new Date().getTime() + 0.5 * 1000);
                }
                server.log([blueWazuh, 'initialize', 'info'], 'Index pattern created...');
                list.push({
                    id   : tmplist.hits.hits[0]._id.split('index-pattern:')[1],
                    title: tmplist.hits.hits[0]._source['index-pattern'].title
                })
            } else {
                log('initialize.js checkKnownFields', `Default index pattern found`,'info')
                server.log([blueWazuh, 'initialize', 'info'], `Default index pattern found`);
            }

            for(const item of list){
                log('initialize.js checkKnownFields', `Refreshing known fields for "index-pattern:${item.title}"`,'info')
                server.log([blueWazuh, 'initialize', 'info'], `Refreshing known fields for "index-pattern:${item.title}"`);
                await updateKibanaIndexWithKnownFields('index-pattern:' + item.id);
            }

            log('initialize.js checkKnownFields', 'App ready to be used.','info')
            server.log([blueWazuh, 'initialize', 'info'], 'App ready to be used.');

            return;
        } catch (error){
            log('initialize.js checkKnownFields', error.message || error);
            server.log([blueWazuh, 'server', 'error'], 'Error importing objects into elasticsearch.' +  error.message || error);
        }
    };

    // Creates the default index pattern 
    const createIndexPattern = async () => {        
        try {
            log('initialize.js createIndexPattern', `Creating index pattern: ${defaultIndexPattern}`,'info')
            server.log([blueWazuh, 'initialize', 'info'], `Creating index pattern: ${defaultIndexPattern}`);

            await wzWrapper.createIndexPattern(defaultIndexPattern);

            log('initialize.js createIndexPattern', `Created index pattern: ${defaultIndexPattern}`,'info')
            server.log([blueWazuh, 'initialize', 'info'], 'Created index pattern: ' + defaultIndexPattern);

        } catch (error){
            log('initialize.js createIndexPattern', error.message || error);
            server.log([blueWazuh, 'initialize', 'error'], 'Error creating index-pattern.');
        }
    };



    // Save Wazuh App setup
    const saveConfiguration = async () => {
        try{
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
    
            const shard_configuration = {
                settings: {
                    index: {
                        number_of_shards  : shards,
                        number_of_replicas: replicas
                    }
                }
            };
    
            await wzWrapper.createWazuhVersionIndex(shard_configuration);

            const commonDate = new Date().toISOString();

            const configuration = {
                name            : 'Wazuh App',
                'app-version'   : packageJSON.version,
                revision        : packageJSON.revision,
                installationDate: commonDate,
                lastRestart     : commonDate
            };

            try{

                await wzWrapper.insertWazuhVersionConfiguration(configuration);

                log('initialize.js saveConfiguration', 'Wazuh configuration inserted','info')
                server.log([blueWazuh, 'initialize', 'info'], 'Wazuh configuration inserted');
     
            } catch (error){
                log('initialize.js saveConfiguration', error.message || error);
                server.log([blueWazuh, 'initialize', 'error'], 'Could not insert Wazuh configuration');
            }
            
            return;

        } catch (error){
            log('initialize.js saveConfiguration', error.message || error);
            server.log([blueWazuh, 'initialize', 'error'], 'Error creating index .wazuh-version.');
        }
    };

    const checkWazuhIndex = async () => {
            try{
                log('initialize.js init', 'Checking .wazuh index.','info')
                server.log([blueWazuh, 'initialize', 'info'], 'Checking .wazuh index.');
                const result = await elasticRequest.callWithInternalUser('indices.exists', {
                    index: '.wazuh'
                })

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
                        "settings": {
                            "index": {
                                "number_of_shards": shards,
                                "number_of_replicas": replicas
                            }
                        }
                    };
                    
                    try{
                        await elasticRequest.callWithInternalUser('indices.create', {
                            index: '.wazuh',
                            body: configuration
                        })
            
                        log('initialize.js init', 'Index .wazuh created.','info')
                        server.log([blueWazuh, 'initialize', 'info'], 'Index .wazuh created.');
                    
                    } catch(error) {
                        throw new Error('Error creating index .wazuh.');
                    }

                } else { // The .wazuh index exists, we now proceed to check whether it's from an older version
                    try{
                        await elasticRequest.callWithInternalUser('get', {
                            index: ".wazuh",
                            type: "wazuh-setup",
                            id: "1"
                        })
        
                        // Reindex!
                        return reindexOldVersion();

                    } catch(error) {
                        if (error.message && error.message !== 'Not Found') {
                            throw new Error(error.message || error);
                        }
                        server.log([blueWazuh, 'initialize', 'info'], 'No older .wazuh index found -> no need to reindex.');
                    }
                }

            } catch (error) {
                return Promise.reject(error);
            }
    }


    const checkWazuhVersionIndex = async () => {
        try {
            log('initialize.js init', 'Checking .wazuh-version index.','info')
            server.log([blueWazuh, 'initialize', 'info'], 'Checking .wazuh-version index.');
            try{
                await elasticRequest.callWithInternalUser('get', {
                    index: ".wazuh-version",
                    type: "wazuh-version",
                    id: "1"
                })
            } catch (error) {
                log('initialize.js init 6', error.message || error);
                server.log([blueWazuh, 'initialize', 'info'], '.wazuh-version document does not exist. Initializating configuration...');
    
                // Save Setup Info
                await saveConfiguration(defaultIndexPattern);
            }

            server.log([blueWazuh, 'initialize', 'info'], '.wazuh-version document already exists. Updating version information...');
            
            await elasticRequest.callWithInternalUser('update', { 
                index: '.wazuh-version', 
                type : 'wazuh-version',
                id   : 1,
                body : {
                    doc: {
                        'app-version': packageJSON.version,
                        revision     : packageJSON.revision,
                        lastRestart: new Date().toISOString() // Indice exists so we update the lastRestarted date only
                    }
                } 
            });

            server.log([blueWazuh, 'initialize', 'info'], 'Successfully updated .wazuh-version index');
        
        } catch (error) {
            return Promise.reject(error);
        }
    }

    // Init function. Check for "wazuh-version" document existance.
    const init = async () => {
        try {
            await Promise.all([
                checkWazuhIndex(),
                checkWazuhVersionIndex(),
                checkKnownFields()
            ]);
        } catch (error){
            log('initialize.js init()', error.message || error);
            server.log([blueWazuh, 'initialize.js init()', 'error'], error.message || error);
            return Promise.reject(error)
        }
    };

    const createKibanaTemplate = () => {
        log('initialize.js createKibanaTemplate', 'Creating template for .kibana.','info')
        server.log([blueWazuh, 'initialize', 'info'], 'Creating template for .kibana.');

        try {
            kibana_template = require(KIBANA_TEMPLATE);
        } catch (error) {
            log('initialize.js init 6', error.message || error);
            server.log([blueWazuh, 'initialize', 'error'], 'Could not read the .kibana template file.');
            server.log([blueWazuh, 'initialize', 'error'], 'Path: ' + KIBANA_TEMPLATE);
            server.log([blueWazuh, 'initialize', 'error'], 'Exception: ' + error);
        }

        return elasticRequest.callWithInternalUser('indices.putTemplate',{
            name  : 'wazuh-kibana',
            order : 0,
            create: true,
            body  : kibana_template
        });
    };

    // Does .kibana index exist?
    const checkKibanaStatus = () => {
        elasticRequest.callWithInternalUser('indices.exists', {
            index: ".kibana"
        })
            .then(data => {
                if (data) { // It exists, initialize!
                    init();
                }
                else { // No .kibana index created...
                    log('initialize.js checkKibanaStatus', 'Didn\'t find .kibana index...','info')
                    server.log([blueWazuh, 'initialize', 'info'], "Didn't find .kibana index...");

                    elasticRequest.callWithInternalUser('indices.getTemplate',
                        {
                            name: 'wazuh-kibana'
                        })
                        .then(data => {
                            log('initialize.js checkKibanaStatus', 'No need to create the .kibana template, already exists.','info')
                            server.log([blueWazuh, 'initialize', 'info'], 'No need to create the .kibana template, already exists.');

                            elasticRequest.callWithInternalUser('indices.create', { index: '.kibana' })
                                .then(data => {
                                    log('initialize.js checkKibanaStatus', 'Successfully created .kibana index.','info')
                                    server.log([blueWazuh, 'initialize', 'info'], 'Successfully created .kibana index.');
                                    init();
                                })
                                .catch(error => {
                                    log('initialize.js checkKibanaStatus',error.message || error);
                                    server.log([blueWazuh, 'initialize', 'error'], 'Error creating .kibana index due to ' + error);
                                });
                        })
                        .catch(error => {
                            log('initialize.js checkKibanaStatus',
                                error.message || error
                            );
                            createKibanaTemplate()
                                .then(data => {
                                    log('initialize.js checkKibanaStatus', 'Successfully created .kibana template.','info')
                                    server.log([blueWazuh, 'initialize', 'info'], 'Successfully created .kibana template.');

                                    elasticRequest.callWithInternalUser('indices.create', { index: '.kibana' })
                                        .then(data => {
                                            log('initialize.js checkKibanaStatus', 'Successfully created .kibana index.','info')
                                            server.log([blueWazuh, 'initialize', 'info'], 'Successfully created .kibana index.');
                                            init();
                                        })
                                        .catch(error => {
                                            log('initialize.js checkKibanaStatus',error.message || error);
                                            server.log([blueWazuh, 'initialize', 'error'], 'Error creating .kibana index due to ' + error);
                                        });
                                }).catch(error => {
                                    log('initialize.js checkKibanaStatus',error.message || error);
                                    server.log([blueWazuh, 'initialize', 'error'], 'Error creating template for .kibana due to ' + error);
                                });
                        });
                }
            })
            .catch(error => {
                log('initialize.js checkKibanaStatus',error.message || error);
                server.log([blueWazuh, 'initialize', 'error'], 'Could not check .kibana index due to ' + error);
            });
    };

    // Wait until Elasticsearch js is ready
    const checkStatus = async () => {
        try{
            await server.plugins.elasticsearch.waitUntilReady();
            return checkKibanaStatus();
        } catch (error){
            log('initialize.js checkStatus',error.message || error);
            server.log([blueWazuh, 'initialize', 'info'], 'Waiting for elasticsearch plugin to be ready...');
            setTimeout(() => checkStatus(), 3000);
        }
    };

    const reachAPI = (wapi_config) => {
        // Now, let's see whether they have a 2.x or 3.x version
        let id = wapi_config._id;
        wapi_config = wapi_config._source;
        log('initialize.js reachAPI', 'Reaching ' + wapi_config.manager,'info')
        server.log([blueWazuh, 'reindex', 'info'], 'Reaching ' + wapi_config.manager);
        let decoded_password = Buffer.from(wapi_config.api_password, 'base64').toString("ascii");
        if (wapi_config.cluster_info === undefined) { // No cluster_info in the API configuration data -> 2.x version
            needle('get', `${wapi_config.url}:${wapi_config.api_port}/version`, {}, {
                username: wapi_config.api_user,
                password: decoded_password,
                rejectUnauthorized: !wapi_config.insecure
            })
                .then(response => {
                    log('initialize.js reachAPI', 'API is reachable ' + wapi_config.manager,'info')
                    server.log([blueWazuh, 'reindex', 'info'], 'API is reachable ' + wapi_config.manager);
                    if (parseInt(response.body.error) === 0 && response.body.data) {
                        needle('get', `${wapi_config.url}:${wapi_config.api_port}/cluster/status`, {}, { // Checking the cluster status
                            username: wapi_config.api_user,
                            password: decoded_password,
                            rejectUnauthorized: !wapi_config.insecure
                        })
                            .then((response) => {
                                if (!response.body.error) {
                                    if (response.body.data.enabled === 'yes') { // If cluster mode is active
                                        needle('get', `${wapi_config.url}:${wapi_config.api_port}/cluster/node`, {}, {
                                            username: wapi_config.api_user,
                                            password: decoded_password,
                                            rejectUnauthorized: !wapi_config.insecure
                                        })
                                            .then((response) => {
                                                if (!response.body.error) {
                                                    wapi_config.cluster_info = {};
                                                    wapi_config.cluster_info.status = 'enabled';
                                                    wapi_config.cluster_info.manager = wapi_config.manager;
                                                    wapi_config.cluster_info.node = response.body.data.node;
                                                    wapi_config.cluster_info.cluster = response.body.data.cluster;
                                                } else if (response.body.error) {
                                                    log('initialize.js reachAPI', response.body.error || response.body);
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
                                        type : 'wazuh-configuration',
                                        id   : id,
                                        body: {
                                            'doc': {
                                                "api_user"    : wapi_config.api_user,
                                                "api_password": wapi_config.api_password,
                                                "url"         : wapi_config.url,
                                                "api_port"    : wapi_config.api_port,
                                                "manager"     : wapi_config.manager,
                                                "cluster_info": {
                                                    "manager": wapi_config.manager,
                                                    "node"   : wapi_config.cluster_info.node,
                                                    "cluster": wapi_config.cluster_info.cluster,
                                                    "status" : wapi_config.cluster_info.status
                                                },
                                            }
                                        }
                                    })
                                        .then(resp => {
                                            log('initialize.js reachAPI', 'Successfully updated proper cluster information for ' + wapi_config.manager,'info')
                                            server.log([blueWazuh, 'reindex', 'info'], 'Successfully updated proper cluster information for ' + wapi_config.manager);
                                        })
                                        .catch(error => {
                                            log('initialize.js reachAPI', error.message || error);
                                            server.log([blueWazuh, 'reindex', 'error'], 'Could not update proper cluster information for ' + wapi_config.manager + 'due to ' + err);
                                        });
                                } else {
                                    log('initialize.js reachAPI', 'Could not get cluster/status information for ' + wapi_config.manager)
                                    server.log([blueWazuh, 'reindex', 'error'], 'Could not get cluster/status information for ' + wapi_config.manager);
                                }
                            });
                    } else {
                        log('initialize.js reachAPI', 'The API responded with some kind of error for ' + wapi_config.manager)
                        server.log([blueWazuh, 'reindex', 'error'], 'The API responded with some kind of error for ' + wapi_config.manager);
                    }
                })
                .catch(error => {
                    log('initialize.js reachAPI', error.message || error);
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
                                "cluster_info": {
                                    "manager": wapi_config.manager,
                                    "node": "nodata",
                                    "cluster": "nodata",
                                    "status": "disabled"
                                },
                            }
                        }
                    })
                        .then(resp => {
                            log('initialize.js reachAPI',  'Successfully updated sample cluster information for ' + wapi_config.manager,'info')
                            server.log([blueWazuh, 'reindex', 'info'], 'Successfully updated sample cluster information for ' + wapi_config.manager);
                        })
                        .catch(error => {
                            log('initialize.js reachAPI', error.message || error);
                            server.log([blueWazuh, 'reindex', 'error'], 'Could not update sample cluster information for ' + wapi_config.manager + 'due to ' + err);
                        });
                });
        } else { // 3.x version
            // Nothing to be done, cluster_info is present
            log('initialize.js reachAPI',  'Nothing to be done for ' + wapi_config.manager + ' as it is already a 3.x version.' + wapi_config.manager,'info')   
            server.log([blueWazuh, 'reindex', 'info'], 'Nothing to be done for ' + wapi_config.manager + ' as it is already a 3.x version.');
        }
    };

    // Reindex a .wazuh index from 2.x-5.x or 3.x-5.x to .wazuh and .wazuh-version in 3.x-6.x
    const reindexOldVersion = async () => {
        try {
            log('initialize.js reindexOldVersion',  `Old version detected. Proceeding to reindex.`,'info')  
            server.log([blueWazuh, 'reindex', 'info'], `Old version detected. Proceeding to reindex.`);
    
            const configuration = {
                source: {
                    index: '.wazuh',
                    type : 'wazuh-configuration'
                },
                dest: {
                    index: '.old-wazuh'
                }
            };
    
            // Backing up .wazuh index
            await elasticRequest.callWithInternalUser('reindex', { body: configuration })

            log('initialize.js reindexOldVersion',  'Successfully backed up .wazuh index','info')  
            // And...this response does not take into acount new index population so...let's wait for it
            server.log([blueWazuh, 'reindex', 'info'], 'Successfully backed up .wazuh index');
            setTimeout(() => swapIndex(), 3000);

        } catch(error) {
            log('initialize.js reindexOldVersion', error.message || error);
            server.log([blueWazuh, 'reindex', 'error'], 'Could not begin the reindex process: ' + error.message || error);
        }
    };

    const swapIndex = async () => {
        try {
            // Deleting old .wazuh index
            log('initialize.js swapIndex', 'Deleting old .wazuh index','info');
            server.log([blueWazuh, 'reindex', 'info'], 'Deleting old .wazuh index.');

            await elasticRequest.callWithInternalUser('indices.delete', { index: ".wazuh" })

            const configuration = {
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

            log('initialize.js swapIndex', 'Reindexing into the new .wazuh','info');
            server.log([blueWazuh, 'reindex', 'info'], 'Reindexing into the new .wazuh');
            // Reindexing from .old-wazuh where the type of document is wazuh-configuration into the new index .wazuh
            await elasticRequest.callWithInternalUser('reindex', { body: configuration })

            // Now we need to properly replace the cluster_info into the configuration -> improvement: pagination?
            // And...this response does not take into acount new index population so...let's wait for it
            setTimeout(() => reachAPIs(), 3000);

        } catch(error) {
            log('initialize.js swapIndex', error.message || error);
            server.log([blueWazuh, 'reindex', 'error'], 'Could not reindex the new .wazuh: ' + error.message || error);
        }
    };

    const reachAPIs = async () => {
        try{
            const data = await elasticRequest.callWithInternalUser('search', { index: ".wazuh" });
            for (let item of data.hits.hits) {
                reachAPI(item);
            }
        } catch(error){
            log('initialize.js reachAPIs', error.message || error);
            server.log([blueWazuh, 'reindex', 'error'], 'Something happened while getting old API configuration data: ' + error.message || error);
        }
    };

    // Check Kibana index and if it is prepared, start the initialization of Wazuh App.
    checkStatus();

};
