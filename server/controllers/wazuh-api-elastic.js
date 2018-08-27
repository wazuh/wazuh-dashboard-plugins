/*
 * Wazuh app - Class for Wazuh-API-Elastic functions
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import ElasticWrapper from '../lib/elastic-wrapper';
import ErrorResponse  from './error-response';
import log            from '../logger';

const userRegEx  = new RegExp(/^.{3,100}$/);
const passRegEx  = new RegExp(/^.{3,100}$/);
const urlRegEx   = new RegExp(/^https?:\/\/[a-zA-Z0-9-.]{1,300}$/);
const urlRegExIP = new RegExp(/^https?:\/\/[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$/);
const portRegEx  = new RegExp(/^[0-9]{2,5}$/);

export default class WazuhApiElastic {
    constructor(server) {
        this.wzWrapper = new ElasticWrapper(server);
    }

    async getAPIEntries (req, reply) {
        try {
            const data = await this.wzWrapper.getWazuhAPIEntries();

            // Replacing password by ****
            const result = [];
            if(data && data.hits && data.hits.hits && Array.isArray(data.hits.hits)){
                for(const entry of data.hits.hits) {
                    if(entry && entry._source && entry._source.api_password){
                        entry._source.api_password = '****'
                    }
                    result.push(entry)
                }
            } 

            return reply(result);

        } catch(error){
            log('GET /api/wazuh-api/apiEntries',error.message || error);
            return ErrorResponse(error.message || error, 2001, 500, reply);
        }
    }

    async deleteAPIEntries (req, reply) {
        try {
            const data = await this.wzWrapper.deleteWazuhAPIEntriesWithRequest(req);

            return reply(data);

        } catch(error){
            log('DELETE /api/wazuh-api/apiEntries/{id}',error.message || error);
            return ErrorResponse(error.message || error, 2002, 500, reply);
        }
    }

    async setAPIEntryDefault (req, reply) {
        try{

            // Searching for previous default
            const data = await this.wzWrapper.searchActiveDocumentsWazuhIndex(req);

            if (data.hits.total === 1) {
                await this.wzWrapper.updateWazuhIndexDocument(data.hits.hits[0]._id, { doc: { active: 'false' } });
            }

            await this.wzWrapper.updateWazuhIndexDocument(req.params.id, { doc: { active: 'true' } });

            return reply({ statusCode: 200, message: 'ok' });

        }catch(error){
            log('PUT /api/wazuh-api/apiEntries/{id}',error.message || error);
            return ErrorResponse(`Could not save data in elasticsearch due to ${error.message || error}`, 2003, 500, reply);
        }
    }

    validateData (payload) {
        // Validate user
        if(!userRegEx.test(payload.user)){
            return { code: 2006, message: 'Invalid user field' }
        }

        // Validate password
        if(!passRegEx.test(payload.password)){
            return { code: 2007, message: 'Invalid password field' }
        }

        // Validate url
        if(!urlRegEx.test(payload.url) && !urlRegExIP.test(payload.url)){
            return { code: 2008, message: 'Invalid url field' }
        }

        // Validate port
        const validatePort = parseInt(payload.port);
        if(!portRegEx.test(payload.port) || validatePort <= 0 || validatePort >= 99999) {
            return { code: 2009, message: 'Invalid port field' }
        }

        return false;
    }

    buildSettingsObject (payload) {
        return {
            api_user    : payload.user,
            api_password: payload.password,
            url         : payload.url,
            api_port    : payload.port,
            insecure    : payload.insecure,
            component   : 'API',
            active      : payload.active,
            cluster_info: payload.cluster_info,
            extensions  : payload.extensions
        }
    }

    async saveAPI (req, reply) {
        try {
            if (!('user' in req.payload) || !('password' in req.payload) || !('url' in req.payload) || !('port' in req.payload)) {
                return ErrorResponse('Missing data', 2010, 400, reply);
            }

            const valid = this.validateData(req.payload);
            if(valid) return ErrorResponse(valid.message, valid.code, 400, reply);

            const settings = this.buildSettingsObject(req.payload);

            const response = await this.wzWrapper.createWazuhIndexDocument(req,settings);

            return reply({ statusCode: 200, message: 'ok', response });

        } catch (error){
            log('PUT /api/wazuh-api/settings',error.message || error);
            return ErrorResponse(`Could not save data in elasticsearch due to ${error.message || error}`, 2011, 500, reply);
        }
    }

    async updateAPIHostname (req, reply) {
        try {

            await this.wzWrapper.updateWazuhIndexDocument(req.params.id,{ doc: { cluster_info: req.payload.cluster_info }});

            return reply({ statusCode: 200, message: 'ok' });

        } catch (error) {
            log('PUT /api/wazuh-api/updateApiHostname/{id}',error.message || error);
            return ErrorResponse(`Could not save data in elasticsearch due to ${error.message || error}`, 2012, 500, reply);
        }
    }

    async updateFullAPI (req, reply) {
        try {
            if (!('user' in req.payload) || !('password' in req.payload) || !('url' in req.payload) || !('port' in req.payload)) {
                return ErrorResponse('Missing data', 2013, 400, reply);
            }

            const valid = this.validateData(req.payload);
            if(valid) return ErrorResponse(valid.message, valid.code, 400, reply);

            const settings = this.buildSettingsObject(req.payload);

            await this.wzWrapper.updateWazuhIndexDocument(req.payload.id, { doc: settings });

            return reply({ statusCode: 200, message: 'ok' });

        } catch (error) {
            log('PUT /api/wazuh-api/update-settings',error.message || error);
            return ErrorResponse(`Could not save data in elasticsearch due to ${error.message || error}`, 2014, 500, reply);
        }
    }
}
