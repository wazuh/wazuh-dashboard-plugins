/*
 * Wazuh app - Class for Wazuh-Elastic functions
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
import ErrorResponse  from './error-response'

import { AgentsVisualizations, OverviewVisualizations }  from '../integration-files/visualizations'

export default class WazuhElastic {
    constructor(server){
        this.wzWrapper = new ElasticWrapper(server);
    }

    async getTimeStamp(req,reply) {
        try {

            const data = await this.wzWrapper.getWazuhVersionIndexAsSearch();

            if(data.hits &&
               data.hits.hits[0] &&
               data.hits.hits[0]._source &&
               data.hits.hits[0]._source.installationDate &&
               data.hits.hits[0]._source.lastRestart){

                    return reply({
                        installationDate: data.hits.hits[0]._source.installationDate,
                        lastRestart     : data.hits.hits[0]._source.lastRestart
                    });

            } else {
                throw new Error('Could not fetch .wazuh-version index');
            }

        } catch (error) {
            return ErrorResponse(error.message || 'Could not fetch .wazuh-version index', 4001, 500, reply);
        }
    }

    async getTemplate(req, reply) {
        try {
            const data = await this.wzWrapper.getTemplates();

            if (req.params.pattern == "wazuh-alerts-3.x-*" && data.includes("wazuh-alerts-3.*")) {
                return reply({
                    statusCode: 200,
                    status    : true,
                    data      : `Template found for ${req.params.pattern}`
                });
            } else {

                const lastChar = req.params.pattern[req.params.pattern.length -1];
                const array    = data.match(/[^\s]+/g);

                let pattern = req.params.pattern;
                if (lastChar === '*') { // Remove last character if it is a '*'
                    pattern = pattern.slice(0, -1);
                }

                for (let i = 1; i < array.length; i++) {
                    if (array[i].includes(pattern) && array[i-1] == `wazuh`) {
                        return reply({
                            statusCode: 200,
                            status    : true,
                            data      : `Template found for ${req.params.pattern}`
                        });
                    }
                }

                return reply({
                    statusCode: 200,
                    status    : false,
                    data      : `No template found for ${req.params.pattern}`
                });
            }

        } catch (error){
            return ErrorResponse(`Could not retrieve templates from Elasticsearch due to ${error.message || error}`, 4002, 500, reply);
        }
    }

    async checkPattern (req, reply) {
        try {
            const response = await this.wzWrapper.getAllIndexPatterns();

            const filtered = response.hits.hits.filter(item => item._source['index-pattern'].title === req.params.pattern);

            return filtered.length >= 1 ?
                   reply({ statusCode: 200, status: true, data: 'Index pattern found' }) :
                   reply({ statusCode: 500, status: false, error:10020, message: 'Index pattern not found' });

        } catch (error) {
            return ErrorResponse(`Something went wrong retrieving index-patterns from Elasticsearch due to ${error.message || error}`, 4003, 500, reply);
        }
    }


    async getFieldTop (req, reply) {
        try{
            // Top field payload
            let payload = {
                size: 1,
                query: {
                    bool: {
                        must  : [],
                        filter: { range: { '@timestamp': {} } }
                    }
                },
                aggs: {
                    '2': {
                        terms: {
                            field: '',
                            size : 1,
                            order: { _count: 'desc' }
                        }
                    }
                }
            };

            // Set up time interval, default to Last 24h
            const timeGTE = 'now-1d';
            const timeLT  = 'now';
            payload.query.bool.filter.range['@timestamp']['gte'] = timeGTE;
            payload.query.bool.filter.range['@timestamp']['lt']  = timeLT;

            // Set up match for default cluster name
            payload.query.bool.must.push(
                req.params.mode === 'cluster'                     ?
                { match: { 'cluster.name': req.params.cluster } } :
                { match: { 'manager.name': req.params.cluster } }
            );

            payload.aggs['2'].terms.field = req.params.field;

            const data = await this.wzWrapper.searchWazuhAlertsWithPayload(payload);

            return (data.hits.total === 0 || typeof data.aggregations['2'].buckets[0] === 'undefined') ?
                    reply({ statusCode: 200, data: '' }) :
                    reply({ statusCode: 200, data: data.aggregations['2'].buckets[0].key });

        } catch (error) {
            return ErrorResponse(error.message || error, 4004, 500, reply);
        }
    }

    async getSetupInfo (req, reply) {
        try {
            const data = await this.wzWrapper.getWazuhVersionIndexAsSearch();

            return data.hits.total === 0 ?
                   reply({ statusCode: 200, data: '' }) :
                   reply({ statusCode: 200, data: data.hits.hits[0]._source });

        } catch (error) {
            return ErrorResponse(`Could not get data from elasticsearch due to ${error.message || error}`, 4005, 500, reply);
        }
    }

    async filterAllowedIndexPatternList (list,req) {
        let finalList = [];
        for(let item of list){
            let results = false, forbidden = false;
            try {
                results = await this.wzWrapper.searchWazuhElementsByIndexWithRequest(req, item.title);
            } catch (error){
                forbidden = true;
                console.log(`Some user tried to fetch the index pattern ${item.title} without permissions.`)
            }
            if((results && results.hits && results.hits.total >= 1) ||
               (!forbidden && results && results.hits && results.hits.total === 0)
            ) {
               
                finalList.push(item);
            
            }
        }
        return finalList;
    }

    validateIndexPattern(indexPatternList){
        const minimum = ["@timestamp", "full_log", "manager.name", "agent.id"];
        let list = [];
        for(const index of indexPatternList){
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
        return list;
    }

    async getlist (req,reply) {
        try {
            const xpack          = await this.wzWrapper.getPlugins();

            const isXpackEnabled = typeof XPACK_RBAC_ENABLED !== 'undefined' && 
                                   XPACK_RBAC_ENABLED && 
                                   typeof xpack === 'string' && 
                                   xpack.includes('x-pack');
            
            const isSuperUser    = isXpackEnabled && 
                                   req.auth && 
                                   req.auth.credentials && 
                                   req.auth.credentials.roles && 
                                   req.auth.credentials.roles.includes('superuser');

            const data = await this.wzWrapper.getAllIndexPatterns();

            if(data && data.hits && data.hits.hits.length === 0) throw new Error('There is no index pattern');

            if(data && data.hits && data.hits.hits){
                const list = this.validateIndexPattern(data.hits.hits);
                
                return reply({data: isXpackEnabled && !isSuperUser ? await this.filterAllowedIndexPatternList(list,req) : list});
            }

            throw new Error('The Elasticsearch request didn\'t fetch the expected data');

        } catch(error){
            return ErrorResponse(error.message || error, 4006, 500, reply);
        }
    }

    /**
     * Replaces visualizations main fields to fit a certain pattern.
     * @param {*} app_objects Object containing raw visualizations.
     * @param {*} id Index-pattern id to use in the visualizations. Eg: 'wazuh-alerts'
     */
    buildVisualizationsRaw (app_objects, id) {
        try{
            const visArray = [];
            let aux_source, bulk_content;
            for (let element of app_objects) {
            	// Stringify and replace index-pattern for visualizations
                aux_source = JSON.stringify(element._source);
                aux_source = aux_source.replace("wazuh-alerts", id);
                aux_source = JSON.parse(aux_source);

                // Bulk source
                bulk_content = {};
                bulk_content[element._type] = aux_source;

                visArray.push({
                    attributes: bulk_content.visualization,
                    type      : element._type,
                    id        : element._id,
                    _version  : bulk_content.visualization.version
                });
            }
            return visArray;
        } catch (error) {
            return Promise.reject(error)
        }
    }

    async createVis (req, reply) {
        try {
            if(!req.params.pattern ||
               !req.params.tab ||
               (req.params.tab && !req.params.tab.includes('overview-') && !req.params.tab.includes('agents-'))
            ) {
                throw new Error('Missing parameters creating visualizations');
            }

            const tabPrefix = req.params.tab.includes('overview') ?
                              'overview' :
                              'agents';

            const tabSplit = req.params.tab.split('-');
            const tabSufix = tabSplit[1];

            const file = tabPrefix === 'overview' ?
                         OverviewVisualizations[tabSufix] :
                         AgentsVisualizations[tabSufix];
           
            const raw = await this.buildVisualizationsRaw(file, req.params.pattern);
            return reply({acknowledge: true, raw: raw });
            
        } catch(error){
            return ErrorResponse(error.message || error, 4007, 500, reply);
        }
    }

    async refreshIndex (req,reply) {
        try {
            if(!req.params.pattern) throw new Error('Missing parameters');

            const output = await this.wzWrapper.updateIndexPatternKnownFields(req.params.pattern);

            return reply({acknowledge: true, output: output });

        } catch(error){
            return ErrorResponse(error.message || error, 4008, 500, reply);
        }
    }

}
