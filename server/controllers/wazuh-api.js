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
import needle               from 'needle';
import pciRequirementsFile  from '../integration-files/pci-requirements';
import gdprRequirementsFile from '../integration-files/gdpr-requirements';
import ElasticWrapper       from '../lib/elastic-wrapper';
import getPath              from '../../util/get-path';
import packageInfo          from '../../package.json';
import monitoring           from '../monitoring';
import ErrorResponse        from './error-response';
import { Parser }           from 'json2csv';
import getConfiguration     from '../lib/get-configuration';
import { totalmem }         from 'os';
import simpleTail           from 'simple-tail';
import path                 from 'path';

export default class WazuhApi {
    constructor(server){
        this.wzWrapper = new ElasticWrapper(server);
        this.fetchAgentsExternal = monitoring(server,{disableCron:true})
    }

    async checkStoredAPI (req, reply) {
        try{

            // Get config from elasticsearch
            const wapi_config = await this.wzWrapper.getWazuhConfigurationById(req.payload)
            if (wapi_config.error_code > 1) {
                throw new Error(`Could not find Wazuh API entry on Elasticsearch.`)
            } else if (wapi_config.error_code > 0) {
                throw new Error('Valid credentials not found in Elasticsearch. It seems the credentials were not saved.')
            }

            let response = await needle('get', `${wapi_config.url}:${wapi_config.port}/version`, {}, {
                headers: {
                    'wazuh-app-version': packageInfo.version
                },
                username          : wapi_config.user,
                password          : wapi_config.password,
                rejectUnauthorized: !wapi_config.insecure
            })

            if (parseInt(response.body.error) === 0 && response.body.data) {
                // Checking the cluster status
                response = await needle('get', `${wapi_config.url}:${wapi_config.port}/cluster/status`, {}, {
                    headers: {
                        'wazuh-app-version': packageInfo.version
                    },
                    username          : wapi_config.user,
                    password          : wapi_config.password,
                    rejectUnauthorized: !wapi_config.insecure
                })

                if (!response.body.error) {
                    // If cluster mode is active
                    if (response.body.data.enabled === 'yes') {
                        response = await needle('get', `${wapi_config.url}:${wapi_config.port}/cluster/node`, {}, {
                            headers: {
                                'wazuh-app-version': packageInfo.version
                            },
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

        if (!('password' in payload) && !('id' in payload)) {
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
            
            let apiAvailable = null;
            
            const notValid = this.validateCheckApiParams(req.payload);
            if(notValid) return ErrorResponse(notValid, 3003, 500, reply);

            // Check if a Wazuh API id is given (already stored API)
            if(req.payload && req.payload.id && !req.payload.password) {

                const data = await this.wzWrapper.getWazuhConfigurationById(req.payload.id);
                if(data) apiAvailable = data;
                else return ErrorResponse(`The API ${req.payload.id} was not found`, 3029, 500, reply);

            // Check if a password is given
            } else if(req.payload && req.payload.password) {

                apiAvailable = req.payload;
                apiAvailable.password = Buffer.from(req.payload.password, 'base64').toString('ascii');
                
            } 

            let response = await needle('get', `${apiAvailable.url}:${apiAvailable.port}/version`, {}, {
                headers: {
                    'wazuh-app-version': packageInfo.version
                },
                username          : apiAvailable.user,
                password          : apiAvailable.password,
                rejectUnauthorized: !apiAvailable.insecure
            })


            // Check wrong credentials
            if(parseInt(response.statusCode) === 401){
                return ErrorResponse('Wrong credentials', 3004, 500, reply);
            }

            if (parseInt(response.body.error) === 0 && response.body.data) {

                response = await needle('get', `${apiAvailable.url}:${apiAvailable.port}/agents/000`, {}, {
                    headers: {
                        'wazuh-app-version': packageInfo.version
                    },
                    username          : apiAvailable.user,
                    password          : apiAvailable.password,
                    rejectUnauthorized: !apiAvailable.insecure
                })

                if (!response.body.error) {
                    const managerName = response.body.data.name;

                    response = await needle('get', `${apiAvailable.url}:${apiAvailable.port}/cluster/status`, {}, { // Checking the cluster status
                        headers: {
                            'wazuh-app-version': packageInfo.version
                        },
                        username          : apiAvailable.user,
                        password          : apiAvailable.password,
                        rejectUnauthorized: !apiAvailable.insecure
                    })

                    if (!response.body.error) {
                        if (response.body.data.enabled === 'yes') {

                            // If cluster mode is active
                            response = await needle('get', `${apiAvailable.url}:${apiAvailable.port}/cluster/node`, {}, {
                                headers: {
                                    'wazuh-app-version': packageInfo.version
                                },
                                username          : apiAvailable.user,
                                password          : apiAvailable.password,
                                rejectUnauthorized: !apiAvailable.insecure
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

            let pci_description = '';

            if (req.params.requirement === 'all') {
                if(!req.headers.id) {
                    return reply(pciRequirementsFile);
                }
                let wapi_config = await this.wzWrapper.getWazuhConfigurationById(req.headers.id);

                if (wapi_config.error_code > 1) {
                    // Can not connect to elasticsearch
                    return ErrorResponse('Elasticsearch unexpected error or cannot connect', 3007, 400, reply);
                } else if (wapi_config.error_code > 0) {
                    // Credentials not found
                    return ErrorResponse('Credentials does not exists', 3008, 400, reply);
                }

                const response = await needle('get', `${wapi_config.url}:${wapi_config.port}/rules/pci`, {}, {
                    headers: {
                        'wazuh-app-version': packageInfo.version
                    },
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
                    return ErrorResponse('An error occurred trying to parse PCI DSS requirements', 3009, 400, reply);
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
            return ErrorResponse(error.message || error, 3010, 400, reply);
        }

    }

    async getGdprRequirement (req, reply) {
        try {
            let gdpr_description = '';

            if (req.params.requirement === 'all') {
                if(!req.headers.id) {
                    return reply(gdprRequirementsFile);
                }
                const wapi_config = await this.wzWrapper.getWazuhConfigurationById(req.headers.id);
                
                // Checking for GDPR 
                const version = await needle('get', `${wapi_config.url}:${wapi_config.port}/version`, {}, {
                    headers: {
                        'wazuh-app-version': packageInfo.version
                    },
                    username          : wapi_config.user,
                    password          : wapi_config.password,
                    rejectUnauthorized: !wapi_config.insecure
                });
                
                const number = version.body.data;

                const major = number.split('v')[1].split('.')[0]
                const minor = number.split('v')[1].split('.')[1].split('.')[0]
                const patch = number.split('v')[1].split('.')[1].split('.')[1]

                if((major >= 3 && minor < 2) || (major >= 3 && minor >= 2 && patch < 3)){
                    return reply({});
                }

                if (wapi_config.error_code > 1) {
                    // Can not connect to elasticsearch
                    return ErrorResponse('Elasticsearch unexpected error or cannot connect', 3024, 400, reply);
                } else if (wapi_config.error_code > 0) {
                    // Credentials not found
                    return ErrorResponse('Credentials does not exists', 3025, 400, reply);
                }

                const response = await needle('get', `${wapi_config.url}:${wapi_config.port}/rules/gdpr`, {}, {
                    headers: {
                        'wazuh-app-version': packageInfo.version
                    },
                    username          : wapi_config.user,
                    password          : wapi_config.password,
                    rejectUnauthorized: !wapi_config.insecure
                })

                if(response.body.data && response.body.data.items){
                    let GDPRobject = {};
                    for(let item of response.body.data.items){
                        if(typeof gdprRequirementsFile[item] !== 'undefined') GDPRobject[item] = gdprRequirementsFile[item];
                    }
                    return reply(GDPRobject);
                } else {
                    return ErrorResponse('An error occurred trying to parse GDPR requirements', 3026, 400, reply);
                }

            } else {
                if (typeof gdprRequirementsFile[req.params.requirement] !== 'undefined'){
                    gdpr_description = gdprRequirementsFile[req.params.requirement];
                }

                return reply({
                    gdpr: {
                        requirement: req.params.requirement,
                        description: gdpr_description
                    }
                });
            }
        } catch (error) {
            return ErrorResponse(error.message || error, 3027, 400, reply);
        }

    }

    async makeRequest (method, path, data, id, reply) {
        try {
            const wapi_config = await this.wzWrapper.getWazuhConfigurationById(id);

            if (wapi_config.error_code > 1) {
                //Can not connect to elasticsearch
                return ErrorResponse('Could not connect with elasticsearch', 3011, 404, reply);
            } else if (wapi_config.error_code > 0) {
                //Credentials not found
                return ErrorResponse('Credentials does not exists', 3012, 404, reply);
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
            return ErrorResponse(error.message || error, 3013, 500, reply);
        }
    }

    requestApi (req, reply) {
        if (!req.payload.method) {
            return ErrorResponse('Missing param: method', 3015, 400, reply);
        } else if (!req.payload.path) {
            return ErrorResponse('Missing param: path', 3016, 400, reply);
        } else {
            if(req.payload.method !== 'GET' && req.payload.body && req.payload.body.devTools){
                const configuration = getConfiguration();
                if(!configuration || (configuration && !configuration['devtools.allowall'])){
                    return ErrorResponse('Allowed method: [GET]', 3029, 400, reply);
                }
            }
            if(req.payload.body.devTools) {
                delete req.payload.body.devTools;
                const keyRegex = new RegExp(/.*agents\/\d*\/key.*/)
                if(typeof req.payload.path === 'string' &&  keyRegex.test(req.payload.path)){
                    return ErrorResponse('Forbidden route /agents/<id>/key', 3028, 400, reply);
                }
            }
            return this.makeRequest(req.payload.method, req.payload.path, req.payload.body, req.payload.id, reply);
        }
    }

    // Fetch agent status and insert it directly on demand
    async fetchAgents (req, reply) {
        try{
            const output = await this.fetchAgentsExternal();
            return reply({
                'statusCode': 200,
                'error':      '0',
                'data':       '',
                output
            });
        } catch(error){
            return ErrorResponse(error.message || error, 3018, 500, reply);
        }
    }

    getConfigurationFile (req,reply) {
        try{
            const configFile = getConfiguration();

            return reply({
                statusCode: 200,
                error     : 0,
                data      : configFile || {}
            });

        } catch (error) {
            return ErrorResponse(error.message || error, 3019, 500, reply);
        }
    }

    /**
     * Get full data on CSV format from a list Wazuh API endpoint
     * @param {*} req
     * @param {*} res
     */
    async csv(req,reply) {
        try{

            if(!req.payload || !req.payload.path) throw new Error('Field path is required')
            if(!req.payload.id) throw new Error('Field id is required')

            const filters = req.payload && req.payload.filters && Array.isArray(req.payload.filters) ?
                            req.payload.filters :
                            [];

            const config = await this.wzWrapper.getWazuhConfigurationById(req.payload.id)

            let path_tmp = req.payload.path;

            if(path_tmp && typeof path_tmp === 'string'){
                path_tmp = path_tmp[0] === '/' ? path_tmp.substr(1) : path_tmp
            }

            if(!path_tmp) throw new Error('An error occurred parsing path field')

            // Real limit, regardless the user query
            const params = { limit: 45000 };

            if(filters.length) {
                for(const filter of filters) {
                    if(!filter.name || !filter.value) continue;
                    params[filter.name] = filter.value;
                }
            }

            const output = await needle('get', `${config.url}:${config.port}/${path_tmp}`, params, {
                headers: {
                    'wazuh-app-version': packageInfo.version
                },
                username          : config.user,
                password          : config.password,
                rejectUnauthorized: !config.insecure
            })

            if(output && output.body && output.body.data && output.body.data.totalItems) {
                const fields = Object.keys(output.body.data.items[0]);
                const data   = output.body.data.items;

                const json2csvParser = new Parser({ fields });
                const csv            = json2csvParser.parse(data);

                return reply(csv).type('text/csv')

            } else if (output && output.body && output.body.data && !output.body.data.totalItems) {

                throw new Error('No results')

            } else {

                throw new Error('An error occurred fetching data from the Wazuh API')

            }

        } catch (error) {
            return ErrorResponse(error.message || error, 3034, 500, reply);
        }
    }

    

    async totalRam(req,reply) {
        try{
            // RAM in MB
            const ram = Math.ceil(totalmem()/1024/1024);
            return reply({ statusCode: 200, error: 0, ram });
        } catch (error) {
            return ErrorResponse(error.message || error, 3033, 500, reply);
        }
    }


    async getAgentsFieldsUniqueCount(req, reply) {
        try {

            if(!req.params || !req.params.api) throw new Error('Field api is required')

            const config  = await this.wzWrapper.getWazuhConfigurationById(req.params.api);
            
            const headers = {
                headers: {
                    'wazuh-app-version': packageInfo.version
                },
                username          : config.user,
                password          : config.password,
                rejectUnauthorized: !config.insecure
            };
            
            const url = `${config.url}:${config.port}/agents`;

            const params = {
                limit : 500,
                offset: 0,
                sort  :'-dateAdd'
            }
            
            const items = [];

            const output = await needle('get', url, params, headers)

            items.push(...output.body.data.items)

            const totalItems = output.body.data.totalItems;

            while(items.length < totalItems){
                params.offset += params.limit;
                const tmp = await needle('get', url, params, headers)
                items.push(...tmp.body.data.items)
            }

            const result = {
                groups     : [],
                nodes      : [],
                versions   : [],
                osPlatforms: [],
                lastAgent  : items[0],
                summary: {
                    agentsCountActive        :0,
                    agentsCountDisconnected  :0,
                    agentsCountNeverConnected:0,
                    agentsCountTotal         :0,
                    agentsCoverity           :0
                }
            }

            for(const agent of items){
                if(agent.id === '000') continue;
                if(agent.group && !result.groups.includes(agent.group)) result.groups.push(agent.group);
                if(agent.node_name && !result.nodes.includes(agent.node_name)) result.nodes.push(agent.node_name);
                if(agent.version && !result.versions.includes(agent.version)) result.versions.push(agent.version);
                if(agent.os && agent.os.name){
                    const exists = result.osPlatforms.filter((e) => e.name === agent.os.name && e.platform === agent.os.platform && e.version === agent.os.version);
                    if(!exists.length){
                        result.osPlatforms.push({
                            name:     agent.os.name,
                            platform: agent.os.platform,
                            version:  agent.os.version
                        });
                    }
                }
            }

            const summary = await needle('get', url + '/summary', {}, headers)

            // Once Wazuh core fixes agent 000 issues, this should be adjusted
            const active = summary.body.data.Active - 1;
            const total  = summary.body.data.Total - 1;

            result.summary.agentsCountActive         = active;
            result.summary.agentsCountDisconnected   = summary.body.data.Disconnected;
            result.summary.agentsCountNeverConnected = summary.body.data['Never connected'];
            result.summary.agentsCountTotal          = total;
            result.summary.agentsCoverity            = (active / total) * 100;
            
            return reply({error:0, result})

        } catch (error) {
            return ErrorResponse(error.message || error, 3035, 500, reply)
        }
    }

    async getAppLogs(req, reply) {
        try {
            const lastLogs = await simpleTail(path.join(__dirname, '../../../../optimize/wazuh-logs/wazuhapp.log'),20);
            return lastLogs && Array.isArray(lastLogs) ? 
                             reply({error:0,lastLogs: lastLogs.filter(item => typeof item === 'string' && item.length)}) :
                             reply({error:0,lastLogs:[]});
        } catch (error) {
            return ErrorResponse(error.message || error, 3036, 500, reply);
        }
    }

}
