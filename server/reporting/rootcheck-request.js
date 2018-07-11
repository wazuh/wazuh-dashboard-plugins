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
    async top3RootkitsDetected(gte, lte, filters) {
        try {
            
            const base = {
                "size": 0,
                "aggs": {
                    "2": {
                        "terms": {
                            "field": "data.title",
                            "size": 5,
                            "order": {
                                "_count": "desc"
                            }
                        }
                    }
                },
                "stored_fields": [
                    "*"
                ],
                "docvalue_fields": [
                    "@timestamp",
                    "data.vulnerability.published",
                    "data.vulnerability.updated",
                    "syscheck.mtime_after",
                    "syscheck.mtime_before",
                    "data.cis.timestamp"
                ],
                "query": {
                    "bool": {
                        "must": [
                            {
                                "query_string": {
                                    "query": filters + " AND \"rootkit\" AND \"detected\"",
                                    "analyze_wildcard": true,
                                    "default_field": "*"
                                }
                            },
                            {
                                "range": {
                                    "@timestamp": {
                                        "gte": gte,
                                        "lte": lte,
                                        "format": "epoch_millis"
                                    }
                                }
                            }
                        ]
                    }
                }
            };

            const response = await this.wzWrapper.searchWazuhAlertsWithPayload(base);
            const aggArray = response.aggregations['2'].buckets;
            const mapped   = aggArray.map(item => item.key);
            const result   = [];
            
            for (const item of mapped) {
                result.push(item.split("'")[1].split("'")[0]);
            }

            return result.filter((item, pos) => result.indexOf(item) === pos);

        } catch (error) {
            return Promise.reject(error);
        }
    }
}