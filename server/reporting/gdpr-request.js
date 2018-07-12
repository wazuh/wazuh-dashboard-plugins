/*
 * Wazuh app - Specific methods to fetch Wazuh GDPR data from Elasticsearch
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

export default class GdprRequest {
    /**
     * Constructor
     * @param {*} server Hapi.js server object provided by Kibana
     */
    constructor(server) {
        this.wzWrapper = new ElasticWrapper(server);
    }

    /**
     * Returns top 5 GDPR requirements
     * @param {Number} gte Timestamp (ms) from
     * @param {Number} lte Timestamp (ms) to
     * @param {String} filters E.g: cluster.name: wazuh AND rule.groups: vulnerability
     * @returns {Array<String>} 
     */
    async topGDPRRequirements(gte, lte, filters, pattern = 'wazuh-alerts-3.x-*') {
            if(filters.includes('rule.gdpr: exists')){
                const first = filters.split('AND rule.gdpr: exists')[0];
                const second = filters.split('AND rule.gdpr: exists')[1];
                filters = first + second;
            }

            try {
                const base = {
                    pattern,
                    "size": 0,
                    "aggs": {
                        "2": {
                            "terms": {
                                "field": "rule.gdpr",
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
                    "script_fields": {},
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
                                        "query": filters,
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
                                },
                                {
                                    "exists": {
                                      "field": "rule.gdpr"
                                    }
                                  }
                            ]
                        }
                    }
                };
                const response = await this.wzWrapper.searchWazuhAlertsWithPayload(base);
                const aggArray = response.aggregations['2'].buckets;
                return aggArray.map(item => item.key);
            } catch (error) {
                return Promise.reject(error);
            }
    }

    /**
     * Returns top 3 rules for specific GDPR requirement
     * @param {Number} gte Timestamp (ms) from
     * @param {Number} lte Timestamp (ms) to
     * @param {String} requirement GDPR requirement. E.g: 'II_5.1.F'
     * @param {String} filters E.g: cluster.name: wazuh AND rule.groups: vulnerability
     * @returns {Array<String>} 
     */
    async getRulesByRequirement(gte, lte, filters, requirement, pattern = 'wazuh-alerts-3.x-*') {
        if (filters.includes('rule.gdpr: exists')) {
            const first = filters.split('AND rule.gdpr: exists')[0];
            const second = filters.split('AND rule.gdpr: exists')[1];
            filters = first + second;
        }

        try {
            const base = {
                pattern,
                "size": 0,
                "aggs": {
                    "2": {
                        "terms": {
                            "field": "rule.description",
                            "size": 3,
                            "order": {
                                "_count": "desc"
                            }
                        },
                        "aggs": {
                            "3": {
                                "terms": {
                                    "field": "rule.id",
                                    "size": 1,
                                    "order": {
                                        "_count": "desc"
                                    }
                                }
                            }
                        }
                    }
                },
                "stored_fields": [
                    "*"
                ],
                "script_fields": {},
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
                                    "query": filters + " AND rule.gdpr: \"" + requirement + "\"",
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
            const { buckets } = response.aggregations['2'];
            const result = [];
            for (const bucket of buckets) {
                if(!bucket || !bucket['3'] || !bucket['3'].buckets || !bucket['3'].buckets[0] || !bucket['3'].buckets[0].key || !bucket.key){
                    continue;
                }
                const ruleId = bucket['3'].buckets[0].key;
                const ruleDescription = bucket.key;
                result.push({ ruleId, ruleDescription });
            }

            return result;
        } catch (error) {
            return Promise.reject(error);
        }
    }
}