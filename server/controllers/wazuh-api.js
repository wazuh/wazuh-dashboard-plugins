/*
 * Wazuh app - Class for Wazuh-API functions
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

// Require some libraries
import needle              from 'needle'
import fs                  from 'fs'
import yml                 from 'js-yaml'
import path                from 'path'
import colors              from 'ansicolors'
import pciRequirementsFile from '../integration-files/pci-requirements'
import ElasticWrapper      from '../lib/elastic-wrapper'
import getPath             from '../../util/get-path'
import packageInfo         from '../../package.json'
import monitoring          from '../monitoring'
import ErrorResponse       from './error-response'

const blueWazuh = colors.blue('wazuh');

export default class WazuhApi {
    constructor(server){
        this.wzWrapper = new ElasticWrapper(server);
        this.fetchAgentsExternal = monitoring(server,{disableCron:true})
    }

    async checkStoredAPI (req, reply) {
        try{
            if(!protectedRoute(req)) return ErrorResponse('Session expired', 3001, 401, reply);
            // Get config from elasticsearch
            const wapi_config = await this.wzWrapper.getWazuhConfigurationById(req.payload)

            if (wapi_config.error_code > 1) {
                // Can not connect to elasticsearch
                throw new Error(`Could not connect with elasticsearch, maybe it's down.`)
            } else if (wapi_config.error_code > 0) {
                // Credentials not found
                throw new Error('Valid credentials not found in elasticsearch. It seems the credentials were not saved.')
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
                            const tmpMsg = response && response.body && response.body.message ? 
                                           response.body.message : 
                                           'Unexpected error from /cluster/node';
                            
                            throw new Error(tmpMsg)
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
                    const tmpMsg = response && response.body && response.body.message ? 
                                   response.body.message : 
                                   'Unexpected error from /cluster/status';

                    throw new Error(tmpMsg)
                }

            } else {
                throw new Error(`${wapi_config.url}:${wapi_config.port}/version is unreachable`)
            }
        } catch(error){
            if(error.code === 'ECONNREFUSED'){
                return reply({ statusCode: 200, data: {password: '****', apiIsDown: true } });
            } else {
                return ErrorResponse(error.message || error, 3002, 500, reply);
            }
        }
    }

    validateCheckApiParams (payload)  {
        if (!('user' in payload)) {
            return 'Missing param: API USER';
        }

        if (!('password' in payload)) {
            return 'Missing param: API PASSWORD';
        }

        if (!('url' in payload)) {
            return 'Missing param: API URL';
        }

        if (!('port' in payload)) {
            return 'Missing param: API PORT';
        }

        if (!(payload.url.includes('https://')) && !(payload.url.includes('http://'))) {
            return 'protocol_error';
        }

        return false;
    }

    async checkAPI (req, reply) {
        try {
            const notValid = this.validateCheckApiParams(req.payload);
            if(notValid) return ErrorResponse(notValid, 3003, 500, reply); // UPDATE CODE

            req.payload.password = Buffer.from(req.payload.password, 'base64').toString('ascii');

            let response = await needle('get', `${req.payload.url}:${req.payload.port}/version`, {}, {
                username          : req.payload.user,
                password          : req.payload.password,
                rejectUnauthorized: !req.payload.insecure
            })


            // Check wrong credentials
            if(parseInt(response.statusCode) === 401){
                return ErrorResponse('Wrong credentials', 3004, 500, reply);
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
            const tmpMsg = response.body && response.body.message ? 
                           response.body.message : 
                           'Unexpected error checking the Wazuh API';

            throw new Error(tmpMsg)

        } catch(error) {
            return ErrorResponse(error.message || error, 3005, 500, reply);
        }
    }

    async getPciRequirement (req, reply) {
        try {

            if(!protectedRoute(req)) return ErrorResponse('Session expired', 3006, 401, reply);

            let pci_description = '';

            if (req.params.requirement === 'all') {
                if(!req.headers.id) {
                    return reply(pciRequirementsFile);
                }
                let wapi_config = await this.wzWrapper.getWazuhConfigurationById(req.headers.id);

                if (wapi_config.error_code > 1) {
                    // Can not connect to elasticsearch
                    return ErrorResponse('Elasticsearch unexpected error or cannot connect', 3007, 400, reply); // UPDATE CODE
                } else if (wapi_config.error_code > 0) {
                    // Credentials not found
                    return ErrorResponse('Credentials does not exists', 3008, 400, reply); // UPDATE CODE
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
                    return ErrorResponse('An error occurred trying to parse PCI DSS requirements', 3009, 400, reply); // UPDATE CODE
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
            return ErrorResponse(error.message || error, 3010, 400, reply); // UPDATE CODE
        }

    }

    async makeRequest (method, path, data, id, reply) {
        try {
            const wapi_config = await this.wzWrapper.getWazuhConfigurationById(id);

            if (wapi_config.error_code > 1) {
                //Can not connect to elasticsearch
                return ErrorResponse('Could not connect with elasticsearch', 3011, 404, reply); // UPDATE CODE
            } else if (wapi_config.error_code > 0) {
                //Credentials not found
                return ErrorResponse('Credentials does not exists', 3012, 404, reply); // UPDATE CODE
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

            if(response && response.body && !response.body.error && response.body.data) {
                return reply(response.body)
            }

            throw response && response.body && response.body.error && response.body.message ?
                  new Error(response.body.message) :
                  new Error('Unexpected error fetching data from the Wazuh API')
            
        } catch (error) {
            return ErrorResponse(error.message || error, 3013, 500, reply); // UPDATE CODE
        }
    }

    requestApi (req, reply) {
        if(!protectedRoute(req)) return ErrorResponse('Session expired', 3014, 401, reply);
        if (!req.payload.method) {
            return ErrorResponse('Missing param: method', 3015, 400, reply); // UPDATE CODE
        } else if (!req.payload.path) {
            return ErrorResponse('Missing param: path', 3016, 400, reply);   // UPDATE CODE
        } else {
            return this.makeRequest(req.payload.method, req.payload.path, req.payload.body, req.payload.id, reply);
        }
    }

    // Fetch agent status and insert it directly on demand
    async fetchAgents (req, reply) {
        try{
            if(!protectedRoute(req)) return ErrorResponse('Session expired', 3017, 401, reply);
            const output = await this.fetchAgentsExternal();
            return reply({
                'statusCode': 200,
                'error':      '0',
                'data':       '',
                output
            });
        } catch(error){
            return ErrorResponse(error.message || error, 3018, 500, reply); // UPDATE CODE
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
            return ErrorResponse(error.message || error, 3019, 500, reply); // UPDATE CODE
        }
    }

    login(req,reply) {
        try{

            const configFile = yml.load(fs.readFileSync(path.join(__dirname,'../../config.yml'), {encoding: 'utf-8'}));

            if(!configFile){
                throw new Error('Configuration file not found');
            }

            if(!req.payload.password) {
                return ErrorResponse('Please give me a password.', 3020, 401, reply); // UPDATE CODE
            } else if(req.payload.password !== configFile['login.password']){
                return ErrorResponse('Wrong password, please try again.', 3021, 401, reply); // UPDATE CODE
            }

            const code = (new Date()-1) + 'wazuhapp';

            sessions[code] = {
                created: new Date(),
                exp    : 86400
            }

            return reply({ statusCode: 200, error: 0, code });

        } catch (error) {
            return ErrorResponse(error.message || error, 3022, 500, reply); // UPDATE CODE
        }
    }
}
