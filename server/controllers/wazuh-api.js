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
import path                from 'path'
import colors              from 'ansicolors'
import pciRequirementsFile from '../integration-files/pci-requirements'
import gdprRequirementsFile from '../integration-files/gdpr-requirements'
import ElasticWrapper      from '../lib/elastic-wrapper'
import getPath             from '../../util/get-path'
import packageInfo         from '../../package.json'
import monitoring          from '../monitoring'
import ErrorResponse       from './error-response'
import { Parser }          from 'json2csv';
import getConfiguration    from '../lib/get-configuration'
import PDFDocument         from 'pdfkit'
import fs                  from 'fs'
import descriptions        from '../reporting/tab-description'
import * as TimSort        from 'timsort'

import { AgentsVisualizations, OverviewVisualizations, ClusterVisualizations } from '../integration-files/visualizations'

import { totalmem }        from 'os'


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
                throw new Error(`Could not find Wazuh API entry on Elasticsearch.`)
            } else if (wapi_config.error_code > 0) {
                throw new Error('Valid credentials not found in Elasticsearch. It seems the credentials were not saved.')
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
                    username          : apiAvailable.user,
                    password          : apiAvailable.password,
                    rejectUnauthorized: !apiAvailable.insecure
                })

                if (!response.body.error) {
                    const managerName = response.body.data.name;

                    response = await needle('get', `${apiAvailable.url}:${apiAvailable.port}/cluster/status`, {}, { // Checking the cluster status
                        username          : apiAvailable.user,
                        password          : apiAvailable.password,
                        rejectUnauthorized: !apiAvailable.insecure
                    })

                    if (!response.body.error) {
                        if (response.body.data.enabled === 'yes') {

                            // If cluster mode is active
                            response = await needle('get', `${apiAvailable.url}:${apiAvailable.port}/cluster/node`, {}, {
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

            if(!protectedRoute(req)) return ErrorResponse('Session expired', 3006, 401, reply);

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

            if(!protectedRoute(req)) return ErrorResponse('Session expired', 3023, 401, reply);



            let gdpr_description = '';

            if (req.params.requirement === 'all') {
                if(!req.headers.id) {
                    return reply(gdprRequirementsFile);
                }
                const wapi_config = await this.wzWrapper.getWazuhConfigurationById(req.headers.id);
                
                // Checking for GDPR 
                const version = await needle('get', `${wapi_config.url}:${wapi_config.port}/version`, {}, {
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
        if(!protectedRoute(req)) return ErrorResponse('Session expired', 3014, 401, reply);
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
            if(!protectedRoute(req)) return ErrorResponse('Session expired', 3017, 401, reply);
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

            if(configFile && configFile['login.password']){
                delete configFile['login.password'];
            }

            return reply({
                statusCode: 200,
                error     : 0,
                data      : configFile || {}
            });

        } catch (error) {
            return ErrorResponse(error.message || error, 3019, 500, reply);
        }
    }

    login(req,reply) {
        try{

            const configFile = getConfiguration();

            if(!configFile){
                throw new Error('Configuration file not found');
            }

            if(!req.payload.password) {
                return ErrorResponse('Please give me a password.', 3020, 401, reply);
            } else if(req.payload.password !== configFile['login.password']){
                return ErrorResponse('Wrong password, please try again.', 3021, 401, reply);
            }

            const code = (new Date()-1) + 'wazuhapp';

            sessions[code] = {
                created: new Date(),
                exp    : 86400
            }

            return reply({ statusCode: 200, error: 0, code });

        } catch (error) {
            return ErrorResponse(error.message || error, 3022, 500, reply);
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

    async report(req,reply) {
        try {

            if (!fs.existsSync(path.join(__dirname, '../../../wazuh-reporting'))) {
                fs.mkdirSync(path.join(__dirname, '../../../wazuh-reporting'));
            }
  
            if(req.payload && req.payload.array){
                const doc = new PDFDocument();
                doc.pipe(fs.createWriteStream(path.join(__dirname, '../../../wazuh-reporting/' + req.payload.name)));
                doc.image(path.join(__dirname, '../../public/img/logo.png'),410,20,{fit:[150,70]})
                doc.moveDown().fontSize(9).fillColor('blue').text('https://wazuh.com',442,50,{link: 'https://wazuh.com', underline:true, valign:'right', align: 'right'})

                const tab     = req.payload.tab;
                const section = req.payload.section;
                
                if(req.payload.section && typeof req.payload.section === 'string') {
                    doc.fontSize(18).fillColor('black').text(descriptions[tab].title + ' report',45,70)
                    doc.moveDown()
                }

                if(req.payload.time){
                    const str = `${req.payload.time.from} to ${req.payload.time.to}`
                    const currentY = doc.y;
                    const currentX = doc.x;
                    doc.fontSize(10).image(path.join(__dirname, '../reporting/clock.png'),currentX,currentY,{width:8, height:8}).text(str,currentX+10,currentY)
                    doc.moveDown()
                }
                
                if(req.payload.filters) {
                    doc.x -= 10;
                    let str = '';
                    const len = req.payload.filters.length;
                    for(let i=0; i < len; i++) {
                        const filter = req.payload.filters[i];
                        str += i === len - 1 ? 
                                     filter.meta.key + ': ' + filter.meta.value :
                                     filter.meta.key + ': ' + filter.meta.value + ' AND '
                    }
                    
                    if(req.payload.searchBar) {
                        str += ' AND ' + req.payload.searchBar;
                    }

                    const currentY = doc.y;
                    const currentX = doc.x;
                    doc.fontSize(10).image(path.join(__dirname, '../reporting/filters.png'),currentX,currentY,{width:8, height:8}).text(str,currentX+10,currentY)
                    doc.moveDown()
                    doc.x -= 10;
                }


                doc.fontSize(12).text(descriptions[tab].description)
                doc.moveDown()
                doc.moveDown()
                let counter = 0;
                let maxWidth = 0;
                for(const item of req.payload.array){
                    if(item.width > maxWidth) maxWidth = item.width;
                }

                const scaleFactor = 530 / maxWidth;

                let pageNumber = 0;
                doc.on('pageAdded', () => pageNumber++);
                const len = req.payload.array.length;
                for(let i = 0; i < len; i++){
                    const item = req.payload.array[i]
                    const title = req.payload.isAgents ? 
                                  AgentsVisualizations[tab].filter(v => v._id === item.id) :
                                  OverviewVisualizations[tab].filter(v => v._id === item.id);
                    counter++;
                    doc.fontSize(12).text(title[0]._source.title)
                    doc.moveDown()
                    doc.image(item.element,((doc.page.width - (item.width*scaleFactor)) / 2),doc.y,{ align: 'center', scale: scaleFactor });

                    doc.moveDown()
                    doc.moveDown()
                    if(counter >= 3 || counter === 2 && pageNumber === 0) {
                        doc.fontSize(7).text('Copyright © 2018 Wazuh, Inc.', 440, doc.page.height - 30, {
                            lineBreak: false
                        })
                        if(i !== (len - 1)) doc.addPage();
                        counter = 0;
                    }
                }

                doc.fontSize(7).text('Copyright © 2018 Wazuh, Inc.', 440, doc.page.height - 30, {
                    lineBreak: false
                })

                doc.end();
            }
            return reply({error: 0, data: null})
        } catch (error) {
            // Delete generated file if an error occurred
            if(req && req.payload && req.payload.name && 
               fs.existsSync(path.join(__dirname, '../../../wazuh-reporting/' + req.payload.name))
            ) {
                fs.unlinkSync(path.join(__dirname, '../../../wazuh-reporting/' + req.payload.name))
            }
            return ErrorResponse(error.message || error, 3029, 500, reply);
        }
    }

    async getReports(req,reply) {
        try {
            if (!fs.existsSync(path.join(__dirname, '../../../wazuh-reporting'))) {
                fs.mkdirSync(path.join(__dirname, '../../../wazuh-reporting'));
            }
            const list = [];
            const reportDir = path.join(__dirname, '../../../wazuh-reporting');
            const sortFunction = (a,b) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
            fs.readdirSync(reportDir).forEach(file => {
                const stats = fs.statSync(reportDir + '/' + file);
                file = {
                    name: file,
                    size: stats.size,
                    date: stats.birthtime
                }
                list.push(file)
            })
            TimSort.sort(list,sortFunction)
            return reply({list: list});
        } catch (error) {
            return ErrorResponse(error.message || error, 3031, 500, reply);
        }
    }

    async getReportByName(req,reply) {
        try {
            return reply.file(path.join(__dirname, '../../../wazuh-reporting/' + req.params.name));
        } catch (error) {
            return ErrorResponse(error.message || error, 3030, 500, reply);
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


    async deleteReportByName(req,reply) {
        try {
            fs.unlinkSync(path.join(__dirname, '../../../wazuh-reporting/' + req.params.name))
            return reply({error:0})
        } catch (error) {
            return ErrorResponse(error.message || error, 3032, 500, reply);
        }
    }

}
