/*
 * Wazuh app - Specific methods to fetch Wazuh PCI DSS data from Elasticsearch
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

export default class PciRequest {
    /**
     * Constructor
     * @param {*} server Hapi.js server object provided by Kibana
     */
    constructor(server) {
        this.wzWrapper = new ElasticWrapper(server);
    }

    /**
     * Returns top 5 PCI DSS requirements
     * @param {Number} gte Timestamp (ms) from
     * @param {Number} lte Timestamp (ms) to
     * @param {String} filters E.g: cluster.name: wazuh AND rule.groups: vulnerability
     * @returns {Array<String>} 
     */
    async topPCIRequirements(gte, lte, filters, pattern = 'wazuh-alerts-3.x-*') {
        if (filters.includes('rule.pci_dss: exists')) {
            const first = filters.split('AND rule.pci_dss: exists')[0];
            const second = filters.split('AND rule.pci_dss: exists')[1];
            filters = first + second;
        }

        try {
            const base = {};

            Object.assign(base, Base(pattern, filters, gte, lte));

            Object.assign(base.aggs, {
                "2": {
                    "terms": {
                        "field": "rule.pci_dss",
                        "size": 5,
                        "order": {
                            "_count": "desc"
                        }
                    }
                }
            });

            base.query.bool.must.push({
                "exists": {
                    "field": "rule.pci_dss"
                }
            });

            const response = await this.wzWrapper.searchWazuhAlertsWithPayload(base);
            const aggArray = response.aggregations['2'].buckets;

            return aggArray.map(item => item.key).sort((a, b) => {
                const a_split = a.split('.');
                const b_split = b.split('.');
                if (parseInt(a_split[0]) > parseInt(b_split[0])) return 1;
                else if (parseInt(a_split[0]) < parseInt(b_split[0])) return -1;
                else {
                    if (parseInt(a_split[1]) > parseInt(b_split[1])) return 1;
                    else if (parseInt(a_split[1]) < parseInt(b_split[1])) return -1;
                    else {
                        if (parseInt(a_split[2]) > parseInt(b_split[2])) return 1;
                        else if (parseInt(a_split[2]) < parseInt(b_split[2])) return -1;
                    }
                }
            });

        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Returns top 3 rules for specific PCI DSS requirement
     * @param {Number} gte Timestamp (ms) from
     * @param {Number} lte Timestamp (ms) to
     * @param {String} requirement PCI DSS requirement. E.g: '10.2.3'
     * @param {String} filters E.g: cluster.name: wazuh AND rule.groups: vulnerability
     * @returns {Array<String>} 
     */
    async getRulesByRequirement(gte, lte, filters, requirement, pattern = 'wazuh-alerts-3.x-*') {
        if (filters.includes('rule.pci_dss: exists')) {
            const first = filters.split('AND rule.pci_dss: exists')[0];
            const second = filters.split('AND rule.pci_dss: exists')[1];
            filters = first + second;
        }

        try {
            const base = {};

            Object.assign(base, Base(pattern, filters, gte, lte));

            Object.assign(base.aggs, {
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
            });

            base.query.bool.must[0].query_string.query = base.query.bool.must[0].query_string.query + " AND rule.pci_dss: \"" + requirement + "\"";

            const response    = await this.wzWrapper.searchWazuhAlertsWithPayload(base);
            const { buckets } = response.aggregations['2'];

            const result = [];
            for (const bucket of buckets) {
                if (!bucket || !bucket['3'] || !bucket['3'].buckets || !bucket['3'].buckets[0] || !bucket['3'].buckets[0].key || !bucket.key) {
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