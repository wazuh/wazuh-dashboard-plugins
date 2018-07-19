/*
 * Wazuh app - Specific methods to fetch Wazuh overview data from Elasticsearch
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

export default class VulnerabilityRequest {
    /**
     * Constructor
     * @param {*} server Hapi.js server object provided by Kibana
     */
    constructor(server) {
        this.wzWrapper = new ElasticWrapper(server);
    }

    /**
     * Returns top 3 agents with level 15 alerts
     * @param {Number} gte Timestamp (ms) from
     * @param {Number} lte Timestamp (ms) to
     * @param {String} filters E.g: cluster.name: wazuh AND rule.groups: vulnerability
     * @returns {Array<String>} E.g:['000','130','300']
     */
    async topLevel15(gte, lte, filters, pattern = 'wazuh-alerts-3.x-*') {
        try {
            const base = {};

            Object.assign(base, Base(pattern, filters, gte, lte));

            Object.assign(base.aggs, {
                "2": {
                    "terms": {
                        "field": "agent.id",
                        "size": 3,
                        "order": {
                            "_count": "desc"
                        }
                    }
                }
            });

            base.query.bool.must.push({
                "match_phrase": {
                    "rule.level": {
                        "query": 15
                    }
                }
            });

            const response = await this.wzWrapper.searchWazuhAlertsWithPayload(base);
            const aggArray = response.aggregations['2'].buckets;

            return aggArray.map(item => item.key);
       
        } catch (error) {
            return Promise.reject(error);
        }
    }

}