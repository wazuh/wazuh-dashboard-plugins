
// Require some libraries
const needle = require('needle');

// External references 
const fetchAgentsExternal = require('../monitoring');
const getConfig           = require('./wazuh-elastic');
const getPath             = require('../../util/get-path');

// Colors for console logging 
const colors    = require('ansicolors');
const blueWazuh = colors.blue('wazuh');

const fs   = require('fs');
const yml  = require('js-yaml');
const path = require('path');
const pciRequirementsFile = '../integration_files/pci_requirements.json';

module.exports = (server, options) => {

    // Variables
    let packageInfo;

    // Read Wazuh app package file
    try {
        packageInfo = require('../../package.json');
    } catch (e) {
        server.log([blueWazuh, 'initialize', 'error'], 'Could not read the Wazuh package file.');
    }
    
 

    const checkStoredAPI = (req, reply) => {
        if(!protectedRoute(req)) return reply(genericErrorBuilder(401,7,'Session expired.')).code(401);
        // Get config from elasticsearch
        getConfig(req.payload, (wapi_config) => {
            if (wapi_config.error_code > 1) {
                // Can not connect to elasticsearch
                reply({
                    'statusCode': 200,
                    'error':      '1',
                    'data':       'no_elasticsearch'
                });
                return;
            } else if (wapi_config.error_code > 0) {
                // Credentials not found
                reply({
                    'statusCode': 400,
                    'error':      '2',
                    'data':       'no_credentials'
                });
                return;
            }

            needle('get', `${wapi_config.url}:${wapi_config.port}/version`, {}, {
                username:           wapi_config.user,
                password:           wapi_config.password,
                rejectUnauthorized: !wapi_config.insecure
            })
            .then((response) => {
                if (parseInt(response.body.error) === 0 && response.body.data) {
                    needle('get', `${wapi_config.url}:${wapi_config.port}/cluster/status`, {}, { // Checking the cluster status
                        username:           wapi_config.user,
                        password:           wapi_config.password,
                        rejectUnauthorized: !wapi_config.insecure
                    })
                    .then((response) => {
                        if (!response.body.error) {
                            if (response.body.data.enabled === 'yes') { // If cluster mode is active
                                needle('get', `${wapi_config.url}:${wapi_config.port}/cluster/node`, {}, {
                                    username:           wapi_config.user,
                                    password:           wapi_config.password,
                                    rejectUnauthorized: !wapi_config.insecure
                                })
                                .then((response) => {
                                    if (!response.body.error) {
                                        let managerName = wapi_config.cluster_info.manager;
                                        delete wapi_config.cluster_info;
                                        wapi_config.cluster_info = {};
                                        wapi_config.cluster_info.status = 'enabled';
                                        wapi_config.cluster_info.manager = managerName;
                                        wapi_config.cluster_info.node = response.body.data.node;
                                        wapi_config.cluster_info.cluster = response.body.data.cluster;
                                        reply({
                                            'statusCode': 200,
                                            'data': wapi_config
                                        });
                                    } else if (response.body.error){
                                        reply({
                                            'statusCode': 500,
                                            'error':      7,
                                            'message':    response.body.message
                                        }).code(500);
                                    }
                                });
                            }
                            else { // Cluster mode is not active
                                let managerName = wapi_config.cluster_info.manager;
                                delete wapi_config.cluster_info;
                                wapi_config.cluster_info = {};
                                wapi_config.cluster_info.status = 'disabled';
                                wapi_config.cluster_info.cluster = 'Disabled';
                                wapi_config.cluster_info.manager = managerName;
                                reply({
                                    'statusCode': 200,
                                    'data': wapi_config
                                });
                            }
                        } else {
                            reply({
                                'statusCode': 500,
                                'error':      5,
                                'message':    'Error occurred'
                            }).code(500);
                        }
                    });
                } else {
                    reply({
                        'statusCode': 500,
                        'error':      7,
                        'message':    response.body
                    });
                }
            })
            .catch(error => {
                if(error.code === 'ECONNREFUSED'){
                    wapi_config.password = "You shall not pass";
                    wapi_config.apiIsDown = true;
                    reply({
                        'statusCode': 200,
                        'data':       wapi_config
                    });
                } else {
                    server.log([blueWazuh, 'wazuh-api', 'error'], error);
                }
            });
        });
    };


    const genericErrorBuilder = (status,code,message) => {
        return {
            statusCode: status,
            error:      code,
            message:    message || 'Error ocurred'
        };
    }

    const checkAPI = (req, reply) => {
        
        if (!('user' in req.payload)) {
            return reply(genericErrorBuilder(400,3,'Missing param: API USER'));
        } 

        if (!('password' in req.payload)) {
            return reply(genericErrorBuilder(400,4,'Missing param: API PASSWORD'));
        } 
        
        if (!('url' in req.payload)) {
            return reply(genericErrorBuilder(400,5,'Missing param: API URL'));
        } 
        
        if (!('port' in req.payload)) {
            return reply(genericErrorBuilder(400,6,'Missing param: API PORT'));
        } 
        
        if (!(req.payload.url.includes('https://')) && !(req.payload.url.includes('http://'))) {
            return reply(genericErrorBuilder(200,1,'protocol_error'));
        } 

        req.payload.password = Buffer.from(req.payload.password, 'base64').toString("ascii");
        
        needle('get', `${req.payload.url}:${req.payload.port}/version`, {}, {
            username:           req.payload.user,
            password:           req.payload.password,
            rejectUnauthorized: !req.payload.insecure
        })
        .then(response => {

            // Check wrong credentials
            if(parseInt(response.statusCode) === 401){
                return reply(genericErrorBuilder(500,10401,'wrong_credentials')).code(500);
            }

            if (parseInt(response.body.error) === 0 && response.body.data) {
                needle('get', `${req.payload.url}:${req.payload.port}/agents/000`, {}, {
                    username:           req.payload.user,
                    password:           req.payload.password,
                    rejectUnauthorized: !req.payload.insecure
                })
                .then(response => {
                    if (!response.body.error) {
                        var managerName = response.body.data.name;
                        needle('get', `${req.payload.url}:${req.payload.port}/cluster/status`, {}, { // Checking the cluster status
                            username:           req.payload.user,
                            password:           req.payload.password,
                            rejectUnauthorized: !req.payload.insecure
                        })
                        .then(response => {
                            if (!response.body.error) {
                                if (response.body.data.enabled === 'yes') { // If cluster mode is active
                                    needle('get', `${req.payload.url}:${req.payload.port}/cluster/node`, {}, {
                                        username:           req.payload.user,
                                        password:           req.payload.password,
                                        rejectUnauthorized: !req.payload.insecure
                                    })
                                    .then(response => {
                                        if (!response.body.error) {
                                            reply({
                                                "manager": managerName,
                                                "node":    response.body.data.node,
                                                "cluster": response.body.data.cluster,
                                                "status": 'enabled'
                                            });
                                        } else {
                                            return reply(genericErrorBuilder(500,7,response.body.message)).code(500);
                                        }
                                    })
                                    .catch(error => reply(genericErrorBuilder(500,5,error.message || error)).code(500)); 
                                }
                                else { // Cluster mode is not active
                                    return reply({
                                        manager: managerName,
                                        cluster: 'Disabled',
                                        status : 'disabled'
                                    });
                                }
                            } else {
                                return reply(genericErrorBuilder(500,5,response.body.message)).code(500);
                            }
                        })
                        .catch(error => reply(genericErrorBuilder(500,5,error.message || error)).code(500)); 
                    } else {
                        return reply(genericErrorBuilder(500,5,response.body.message)).code(500);
                    }
                })
                .catch(error => reply(genericErrorBuilder(500,5,error.message || error)).code(500)); 
            } else {
                return reply(genericErrorBuilder(500,5,response.body.message)).code(500);
            }
        })
        .catch(error => reply(genericErrorBuilder(500,5,error.message || error)).code(500));        
    };

    const getPciRequirement = (req, reply) => {
        if(!protectedRoute(req)) return reply(genericErrorBuilder(401,7,'Session expired.')).code(401);
        let pciRequirements = {};
        let pci_description = '';

        try {
            pciRequirements = require(pciRequirementsFile);
        } catch (e) {
            server.log([blueWazuh, 'initialize', 'error'], 'Could not read the mapping file.');
            server.log([blueWazuh, 'initialize', 'error'], 'Path: ' + pciRequirementsFile);
            server.log([blueWazuh, 'initialize', 'error'], 'Exception: ' + e);
        }

        if (req.params.requirement === 'all') {
            return reply(pciRequirements);
        }

        if (typeof pciRequirements[req.params.requirement] !== 'undefined'){
            pci_description = pciRequirements[req.params.requirement];
        }
        
        reply({
            pci: {
                requirement: req.params.requirement,
                description: pci_description
            }
        });
    };

    const errorControl = (error, response) => {
        if (error) {
            return ({
                'isError': true,
                'body': {
                    'statusCode':   500,
                    'error':        5,
                    'message':      'Request error',
                    'errorMessage': error.message
                }
            });
        } else if (!error && response.body.error) {
            return ({
                'isError': true,
                'body': {
                    'statusCode': 500,
                    'error':      6,
                    'message':    'Wazuh api error',
                    'errorData':  response.body
                }
            });
        }
        return ({
            'isError': false
        });
    };

    const makeRequest = (method, path, data, id, reply) => {
        getConfig(id, (wapi_config) => {
            if (wapi_config.error_code > 1) {
                //Can not connect to elasticsearch
                return reply({
                    'statusCode': 404,
                    'error':      2,
                    'message':    'Could not connect with elasticsearch'
                }).code(404);
                
            } else if (wapi_config.error_code > 0) {
                //Credentials not found
                return reply({
                    'statusCode': 404,
                    'error':      1,
                    'message':    'Credentials does not exists'
                }).code(404);
                
            }

            if (!data) {
                data = {};
            }

            var options = {
                headers: {
                    'wazuh-app-version': packageInfo.version
                },
                username:           wapi_config.user,
                password:           wapi_config.password,
                rejectUnauthorized: !wapi_config.insecure
            };

            let fullUrl = getPath(wapi_config) + path;

            needle.request(method, fullUrl, data, options, (error, response) => {
                let errorData = errorControl(error, response);
                if (errorData.isError) {
                    reply(errorData.body).code(500);
                } else {
                    reply(response.body);
                }
            });
        });
    };

    const requestApi = (req, reply) => {
        if(!protectedRoute(req)) return reply(genericErrorBuilder(401,7,'Session expired.')).code(401);
        if (!req.payload.method) {
            reply({
                'statusCode': 400,
                'error':      3,
                'message':    'Missing param: Method'
            }).code(400);
        } else if (!req.payload.path) {
            reply({
                'statusCode': 400,
                'error':      4,
                'message':    'Missing param: Path'
            }).code(400);
        } else {
            makeRequest(req.payload.method, req.payload.path, req.payload.body, req.payload.id, reply);
        }
    };

    const getApiSettings = (req, reply) => {
        if(!protectedRoute(req)) return reply(genericErrorBuilder(401,7,'Session expired.')).code(401);
        getConfig(req.payload.id, (wapi_config) => {
            if (wapi_config.error_code > 1) {
                //Can not connect to elasticsearch
                return reply({
                    'statusCode': 200,
                    'error': '1',
                    'data': 'no_elasticsearch'
                });
                
            } else if (wapi_config.error_code > 0) {
                //Credentials not found
                return reply({
                    'statusCode': 200,
                    'error': '1',
                    'data': 'no_credentials'
                });                
            }
        });
    };

    // Fetch agent status and insert it directly on demand
    const fetchAgents = (req, reply) => {
        if(!protectedRoute(req)) return reply(genericErrorBuilder(401,7,'Session expired.')).code(401);
        fetchAgentsExternal();
        return reply({
            'statusCode': 200,
            'error':      '0',
            'data':       ''
        });
    };

    const postErrorLog = (req, reply) => {

        if (!req.payload.message) {
            server.log([blueWazuh, 'server', 'error'], 'Error logging failed:');
            server.log([blueWazuh, 'server', 'error'], 
                       'You must provide at least one error message to log');

            return reply({
                'statusCode': 500,
                'message':    'You must provide at least one error message to log'
            });
        } else {
            server.log([blueWazuh, 'client', 'error'], req.payload.message);
            if (req.payload.details) {
                server.log([blueWazuh, 'client', 'error'], req.payload.details);
            }
            return reply({
                'statusCode': 200,
                'message':    'Error logged succesfully'
            });
        }
    };

    const getConfigurationFile = (req,reply) => {
        try{

            //if(!protectedRoute(req)) return reply(genericErrorBuilder(401,7,'Session expired.')).code(401);
            const configFile = yml.load(fs.readFileSync('plugins/wazuh/config.yml', {encoding: 'utf-8'}));
            if(configFile.login){
                delete configFile.login.password;
            }
            return reply({
                statusCode: 200,
                error:      0,
                data:       configFile
            });
        } catch (error) {
            return reply(genericErrorBuilder(500,6,error.message || error)).code(500)
        }
    }

    const login = (req,reply) => {
        try{
            const configFile = yml.load(fs.readFileSync('plugins/wazuh/config.yml', {encoding: 'utf-8'}));

            if(!req.payload.password) {
                return reply(genericErrorBuilder(401,7,'Please give me a password.')).code(401)
            } else if(req.payload.password !== configFile.login.password){
                return reply(genericErrorBuilder(401,7,'Wrong password, please try again.')).code(401)
            }
            const code = (new Date()-1) + 'wazuhapp';
            sessions[code] = {
                created: new Date(),
                exp    : 86400
            }
            return reply({
                statusCode: 200,
                error:      0,
                code: code
            });
        } catch (error) {
            return reply(genericErrorBuilder(500,6,error.message || error)).code(500)
        }
    }



    //Server routes

    /*
     * GET /api/wazuh-api/test
     * Returns if the wazuh-api configuration is working
     *
     **/
    server.route({
        method:  'POST',
        path:    '/api/wazuh-api/checkStoredAPI',
        handler: checkStoredAPI
    });

    /*
     * POST /api/wazuh-api/test
     * Check if credentials on POST connect to Wazuh API. Not storing them!
     * Returns if the wazuh-api configuration received in the POST body will work
     *
     **/
    server.route({
        method:  'POST',
        path:    '/api/wazuh-api/checkAPI',
        handler: checkAPI
    });

    /*
     * POST /api/wazuh-api/request
     * Returns the request result (With error control)
     *
     **/
    server.route({
        method:  'POST',
        path:    '/api/wazuh-api/request',
        handler: requestApi
    });

    /*
     * GET /api/wazuh-api/settings
     * Get Wazuh-API settings from elasticsearch index
     *
     **/
    server.route({
        method:  'GET',
        path:    '/api/wazuh-api/settings',
        handler: getApiSettings
    });

    /*
     * GET /api/wazuh-api/pci/requirement
     * Return a PCI requirement description
     *
     **/
    server.route({
        method:  'GET',
        path:    '/api/wazuh-api/pci/{requirement}',
        handler: getPciRequirement
    });

    /*
     * POST /api/wazuh/debug
     * Write in debug log
     *
     **/
    server.route({
        method:  'POST',
        path:    '/api/wazuh/errlog',
        handler: postErrorLog
    });

    /*
     * GET /api/wazuh-api/pci/requirement
     * Return a PCI requirement description
     *
     **/
    server.route({
        method:  'GET',
        path:    '/api/wazuh-api/fetchAgents',
        handler: fetchAgents
    });

    server.route({
        method:  'GET',
        path:    '/api/wazuh-api/configuration',
        handler: getConfigurationFile
    });

    server.route({
        method:  'POST',
        path:    '/api/wazuh-api/login',
        handler: login
    });
};