
// Require some libraries
const needle = require('needle');

// External references 
const fetchAgentsExternal = require('../monitoring');
import { ElasticWrapper } from '../lib/elastic-wrapper';
const getPath             = require('../../util/get-path');

// Colors for console logging 
const colors    = require('ansicolors');
const blueWazuh = colors.blue('wazuh');

const fs   = require('fs');
const yml  = require('js-yaml');
const path = require('path');

import pciRequirementsFile from '../integration-files/pci-requirements';

let packageInfo;

// Read Wazuh app package file
try {
    packageInfo = require('../../package.json');
} catch (e) {
    console.log('Could not read the Wazuh package file.');
}


export class WazuhApi {
    constructor(server){
        this.wzWrapper = new ElasticWrapper(server);
    }

    async checkStoredAPI (req, reply) {
        try{
            if(!protectedRoute(req)) return reply(genericErrorBuilder(401,7,'Session expired.')).code(401);
            // Get config from elasticsearch
            const wapi_config = await this.wzWrapper.getWazuhConfigurationById(req.payload)
                
            if (wapi_config.error_code > 1) {
                // Can not connect to elasticsearch
                return reply({ statusCode: 200, error: '1', data: 'no_elasticsearch' });
                
            } else if (wapi_config.error_code > 0) {
                // Credentials not found
                return reply({ statusCode: 400, error: '2', data: 'no_credentials' });
            }

            let response = await needle('get', `${wapi_config.url}:${wapi_config.port}/version`, {}, {
                username          : wapi_config.user,
                password          : wapi_config.password,
                rejectUnauthorized: !wapi_config.insecure
            })

            if (parseInt(response.body.error) === 0 && response.body.data) {
                // Checking the cluster status
                response = await needle('get', `${wapi_config.url}:${wapi_config.port}/cluster/status`, {}, { 
                    username          : wapi_config.user,
                    password          : wapi_config.password,
                    rejectUnauthorized: !wapi_config.insecure
                })

                if (!response.body.error) {
                    // If cluster mode is active
                    if (response.body.data.enabled === 'yes') { 
                        response = await needle('get', `${wapi_config.url}:${wapi_config.port}/cluster/node`, {}, {
                            username          : wapi_config.user,
                            password          : wapi_config.password,
                            rejectUnauthorized: !wapi_config.insecure
                        })
             
                        if (!response.body.error) {
                            let managerName = wapi_config.cluster_info.manager;
                            delete wapi_config.cluster_info;
                            wapi_config.cluster_info         = {};
                            wapi_config.cluster_info.status  = 'enabled';
                            wapi_config.cluster_info.manager = managerName;
                            wapi_config.cluster_info.node    = response.body.data.node;
                            wapi_config.cluster_info.cluster = response.body.data.cluster;
                            wapi_config.password = '****'
                            return reply({ statusCode: 200, data: wapi_config });

                        } else if (response.body.error){
                            return reply({
                                statusCode: 500,
                                error     :      7,
                                message   :    response.body.message
                            }).code(500);
                        }
          
                    } else { // Cluster mode is not active
                        let managerName = wapi_config.cluster_info.manager;
                        delete wapi_config.cluster_info;
                        wapi_config.cluster_info         = {};
                        wapi_config.cluster_info.status  = 'disabled';
                        wapi_config.cluster_info.cluster = 'Disabled';
                        wapi_config.cluster_info.manager = managerName;
                        wapi_config.password = '****'
                        return reply({ statusCode: 200, data: wapi_config });

                    }
                } else {
                    return reply({
                        statusCode: 500,
                        error     : 5,
                        message   : 'Error occurred'
                    }).code(500);
                }
             
            } else {
                return reply({
                    statusCode: 500,
                    error     : 7,
                    message   : response.body
                });
            }
        } catch(error){
            console.log(error.message || error);
            if(error.code === 'ECONNREFUSED'){
                return reply({ statusCode: 200, data: {password: '****', apiIsDown: true } });
            } else {
                return reply({
                    statusCode: 500,
                    error     : 8,
                    message   : error.message || error
                });
            }
        }
    }

    validateCheckApiParams (payload)  {
        if (!('user' in payload)) {
            return this.genericErrorBuilder(400,3,'Missing param: API USER');
        } 

        if (!('password' in payload)) {
            return this.genericErrorBuilder(400,4,'Missing param: API PASSWORD');
        } 
        
        if (!('url' in payload)) {
            return this.genericErrorBuilder(400,5,'Missing param: API URL');
        } 
        
        if (!('port' in payload)) {
            return this.genericErrorBuilder(400,6,'Missing param: API PORT');
        } 
        
        if (!(payload.url.includes('https://')) && !(payload.url.includes('http://'))) {
            return this.genericErrorBuilder(200,1,'protocol_error');
        } 

        return false;
    }

    genericErrorBuilder (status,code,message) {
        return {
            statusCode: status,
            error     : code,
            message   :message || 'Error ocurred'
        };
    }

    async checkAPI (req, reply) {
        try {
            const notValid = this.validateCheckApiParams(req.payload);
            if(notValid) return this.genericErrorBuilder(valid);

            req.payload.password = Buffer.from(req.payload.password, 'base64').toString('ascii');
        
            let response = await needle('get', `${req.payload.url}:${req.payload.port}/version`, {}, {
                username          : req.payload.user,
                password          : req.payload.password,
                rejectUnauthorized: !req.payload.insecure
            })
            
    
            // Check wrong credentials
            if(parseInt(response.statusCode) === 401){
                return reply(this.genericErrorBuilder(500,10401,'wrong_credentials')).code(500);
            }
    
            if (parseInt(response.body.error) === 0 && response.body.data) {
                    
                response = await needle('get', `${req.payload.url}:${req.payload.port}/agents/000`, {}, {
                    username          : req.payload.user,
                    password          : req.payload.password,
                    rejectUnauthorized: !req.payload.insecure
                })
      
                if (!response.body.error) {
                    const managerName = response.body.data.name;
                    
                    response = await needle('get', `${req.payload.url}:${req.payload.port}/cluster/status`, {}, { // Checking the cluster status
                        username          : req.payload.user,
                        password          : req.payload.password,
                        rejectUnauthorized: !req.payload.insecure
                    })

                    if (!response.body.error) {
                        if (response.body.data.enabled === 'yes') { 
                            
                            // If cluster mode is active
                            response = await needle('get', `${req.payload.url}:${req.payload.port}/cluster/node`, {}, {
                                username          : req.payload.user,
                                password          : req.payload.password,
                                rejectUnauthorized: !req.payload.insecure
                            })

                            if (!response.body.error) {
                                return reply({
                                    manager: managerName,
                                    node   :    response.body.data.node,
                                    cluster: response.body.data.cluster,
                                    status : 'enabled'
                                });
                            } 
                            
                        } else { 
                            
                            // Cluster mode is not active
                            return reply({
                                manager: managerName,
                                cluster: 'Disabled',
                                status : 'disabled'
                            });
                        }
                    }
                }
            } 
              
            throw new Error(response.body.message)

        } catch(error) {
            return reply(this.genericErrorBuilder(500,5,error.message || error)).code(500);
        }
    }

    async getPciRequirement (req, reply) {
        try {
            
            if(!protectedRoute(req)) return reply(this.genericErrorBuilder(401,7,'Session expired.')).code(401);

            let pci_description = '';

            if (req.params.requirement === 'all') {
                if(!req.headers.id) {
                    return reply(pciRequirementsFile);
                }
                let wapi_config = await this.wzWrapper.getWazuhConfigurationById(req.headers.id);

                if (wapi_config.error_code > 1) {
                    // Can not connect to elasticsearch
                    return reply({ statusCode: 200, error: '1', data: 'no_elasticsearch' });
                } else if (wapi_config.error_code > 0) {
                    // Credentials not found
                    return reply({ statusCode: 400, error: '2', data: 'no_credentials' });
                }
    
                const response = await needle('get', `${wapi_config.url}:${wapi_config.port}/rules/pci`, {}, {
                    username          : wapi_config.user,
                    password          : wapi_config.password,
                    rejectUnauthorized: !wapi_config.insecure
                })
        
                if(response.body.data && response.body.data.items){
                    let PCIobject = {};
                    for(let item of response.body.data.items){
                        if(typeof pciRequirementsFile[item] !== 'undefined') PCIobject[item] = pciRequirementsFile[item];
                    }
                    return reply(PCIobject);
                } else {
                    return reply({ statusCode: 400, error: '9998', data: 'An error occurred trying to parse PCI DSS requirements' });
                }
              
            } else {
                if (typeof pciRequirementsFile[req.params.requirement] !== 'undefined'){
                    pci_description = pciRequirementsFile[req.params.requirement];
                }
                
                return reply({
                    pci: {
                        requirement: req.params.requirement,
                        description: pci_description
                    }
                });
            }
        } catch (error) {

            return reply({ 
                statusCode: 400, 
                error     : '9999', 
                data      : `An error occurred trying to obtain PCI DSS requirements due to ${error.message || error}` 
            });
        }

    }

    errorControl(error, response) {
        if (error) {
            return {
                isError: true,
                body: {
                    statusCode  : 500,
                    error       : 5,
                    message     : 'Request error',
                    errorMessage: error.message || error
                }
            };
        } else if (!error && response.body.error) {
            return {
                isError: true,
                body: {
                    statusCode: 500,
                    error     : 6,
                    message   : 'Wazuh api error',
                    errorData : response.body
                }
            };
        }

        return ({ isError: false });
    }

    async makeRequest (method, path, data, id, reply) {
        try {
            const wapi_config = await this.wzWrapper.getWazuhConfigurationById(id);

            if (wapi_config.error_code > 1) {
                //Can not connect to elasticsearch
                return reply({
                    statusCode: 404,
                    error     : 2,
                    message   : 'Could not connect with elasticsearch'
                }).code(404);
                
            } else if (wapi_config.error_code > 0) {
                //Credentials not found
                return reply({
                    statusCode: 404,
                    error     : 1,
                    message   : 'Credentials does not exists'
                }).code(404);
            }

            if (!data) {
                data = {};
            }

            const options = {
                headers: {
                    'wazuh-app-version': packageInfo.version
                },
                username          : wapi_config.user,
                password          : wapi_config.password,
                rejectUnauthorized: !wapi_config.insecure
            };

            const fullUrl   = getPath(wapi_config) + path;
            const response  = await needle(method, fullUrl, data, options);
            const errorData = this.errorControl(false, response);

            if (errorData.isError) {
                return reply(errorData.body).code(500);
            } 

            return reply(response.body);
            
        } catch (error) {
            return reply({
                statusCode: 500,
                data      : error.message || error
            }).code(500);
        }
    }

    requestApi (req, reply) {
        if(!protectedRoute(req)) return reply(this.genericErrorBuilder(401,7,'Session expired.')).code(401);
        if (!req.payload.method) {
            return reply({
                statusCode: 400,
                error     : 3,
                message   : 'Missing param: Method'
            }).code(400);
        } else if (!req.payload.path) {
            return reply({
                statusCode: 400,
                error     : 4,
                message   : 'Missing param: Path'
            }).code(400);
        } else {
            return this.makeRequest(req.payload.method, req.payload.path, req.payload.body, req.payload.id, reply);
        }
    }

    async getApiSettings (req, reply) {
        try{
            if(!protectedRoute(req)) return reply(this.genericErrorBuilder(401,7,'Session expired.')).code(401);

            const wapi_config = await this.wzWrapper.getWazuhConfigurationById(req.payload.id); 
    
            if (wapi_config.error_code > 1) {
                throw new Error('no_elasticsearch');                
            } else if (wapi_config.error_code > 0) {
                throw new Error('no_credentials');            
            }
            return reply({
                statusCode: 200,
                data      : ''
            });
            
        } catch(error){
            return reply({
                statusCode: 200,
                error     : '1',
                data      : error.message || error
            }); 
        }

    };

    // Fetch agent status and insert it directly on demand
    fetchAgents (req, reply) {
        if(!protectedRoute(req)) return reply(this.genericErrorBuilder(401,7,'Session expired.')).code(401);
        fetchAgentsExternal();
        return reply({
            'statusCode': 200,
            'error':      '0',
            'data':       ''
        });
    }

    postErrorLog (req, reply) {

        if (!req.payload.message) {
            console.log('Error logging failed:');
            console.log('You must provide at least one error message to log');

            return reply({
                'statusCode': 500,
                'message':    'You must provide at least one error message to log'
            });
        
        } else {
            
            console.log( req.payload.message);
            if (req.payload.details) {
                console.log( req.payload.details);
            }

            return reply({ statusCode: 200, message: 'Error logged succesfully' });
        }
    }

    getConfigurationFile (req,reply) {
        try{
            const configFile = yml.load(fs.readFileSync(path.join(__dirname,'../../config.yml'), {encoding: 'utf-8'}));
  
            if(configFile && configFile['login.password']){
                delete configFile['login.password'];
            }
            
            return reply({
                statusCode: 200,
                error     : 0,
                data      : configFile || {}
            });

        } catch (error) {
            return reply(this.genericErrorBuilder(500,6,error.message || error)).code(500)
        }
    }

    login(req,reply) {
        try{
            
            const configFile = yml.load(fs.readFileSync(path.join(__dirname,'../../config.yml'), {encoding: 'utf-8'}));

            if(!configFile){
                throw new Error('Configuration file not found');
            }

            if(!req.payload.password) {
                return reply(this.genericErrorBuilder(401,7,'Please give me a password.')).code(401)
            } else if(req.payload.password !== configFile['login.password']){
                return reply(this.genericErrorBuilder(401,7,'Wrong password, please try again.')).code(401)
            }

            const code = (new Date()-1) + 'wazuhapp';

            sessions[code] = {
                created: new Date(),
                exp    : 86400
            }

            return reply({ statusCode: 200, error: 0, code });

        } catch (error) {
            return reply(this.genericErrorBuilder(500,6,error.message || error)).code(500)
        }
    }
}