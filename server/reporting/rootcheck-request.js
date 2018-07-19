/*
 * Wazuh app - Specific methods to fetch Wazuh rootcheck data from Elasticsearch
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
import Base from './base-query';

export default class RootcheckRequest {
    /**
     * Constructor
     * @param {*} server Hapi.js server object provided by Kibana
     */
    constructor(server) {
        this.wzWrapper = new ElasticWrapper(server);
    }

    /**
     * Returns top 5 rootkits found along all agents
     * @param {Number} gte Timestamp (ms) from
     * @param {Number} lte Timestamp (ms) to
     * @param {String} filters E.g: cluster.name: wazuh AND rule.groups: vulnerability
     * @returns {Array<String>} 
     */
    async top5RootkitsDetected(gte, lte, filters, pattern = 'wazuh-alerts-3.x-*',size = 5) {
        try {   
            const base = {};

            Object.assign(base, Base(pattern, filters, gte, lte));

            Object.assign(base.aggs,{
                "2": {
                    "terms": {
                        "field": "data.title",
                        "size": size,
                        "order": {
                            "_count": "desc"
                        }
                    }
                }
            });

            base.query.bool.must[0].query_string.query = base.query.bool.must[0].query_string.query + " AND \"rootkit\" AND \"detected\"";

            const response = await this.wzWrapper.searchWazuhAlertsWithPayload(base);
            const aggArray = response.aggregations['2'].buckets;
            const mapped = aggArray.map(item => item.key);
            const result = [];

            for (const item of mapped) {
                result.push(item.split("'")[1].split("'")[0]);
            }

            return result.filter((item, pos) => result.indexOf(item) === pos);

        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Returns the number of agents that have one or more hidden processes
     * @param {Number} gte Timestamp (ms) from
     * @param {Number} lte Timestamp (ms) to
     * @param {String} filters E.g: cluster.name: wazuh AND rule.groups: vulnerability
     * @returns {Array<String>} 
     */
    async agentsWithHiddenPids(gte, lte, filters, pattern = 'wazuh-alerts-3.x-*') {
        try {
            const base = {};

            Object.assign(base, Base(pattern, filters, gte, lte));

            Object.assign(base.aggs,{
                "1": {
                    "cardinality": {
                        "field": "agent.id"
                    }
                }
            });

            base.query.bool.must[0].query_string.query = base.query.bool.must[0].query_string.query + " AND \"process\" AND \"hidden\"";

            // "aggregations": { "1": { "value": 1 } }
            const response = await this.wzWrapper.searchWazuhAlertsWithPayload(base);
           
            return (response && 
                    response.aggregations && 
                    response.aggregations['1'] && 
                    response.aggregations['1'].value) ?
                 
                    response.aggregations['1'].value :
                 
                    0;

        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Returns the number of agents that have one or more hidden ports
     * @param {Number} gte Timestamp (ms) from
     * @param {Number} lte Timestamp (ms) to
     * @param {String} filters E.g: cluster.name: wazuh AND rule.groups: vulnerability
     * @returns {Array<String>} 
     */
    async agentsWithHiddenPorts(gte, lte, filters, pattern = 'wazuh-alerts-3.x-*') {
        try {
            const base = {};

            Object.assign(base, Base(pattern, filters, gte, lte));

            Object.assign(base.aggs,{
                "1": {
                    "cardinality": {
                        "field": "agent.id"
                    }
                }
            });

            base.query.bool.must[0].query_string.query = base.query.bool.must[0].query_string.query + " AND \"port\" AND \"hidden\"";

            // "aggregations": { "1": { "value": 1 } }
            const response = await this.wzWrapper.searchWazuhAlertsWithPayload(base);
           
            return (response && 
                    response.aggregations && 
                    response.aggregations['1'] && 
                    response.aggregations['1'].value) ?
                 
                    response.aggregations['1'].value :
                 
                    0;

        } catch (error) {
            return Promise.reject(error);
        }
    }
}