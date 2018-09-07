/*
 * Wazuh app - Specific methods to fetch Wazuh Audit data from Elasticsearch
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { ElasticWrapper } from '../lib/elastic-wrapper';
import Base from './base-query';
import AuditMap from './audit-map';

export class AuditRequest {
    /**
     * Constructor
     * @param {*} server Hapi.js server object provided by Kibana
     */
    constructor(server) {
        this.wzWrapper = new ElasticWrapper(server);
    }

    /**
     * Returns top 3 agents that execute sudo commands without success
     * @param {*} gte 
     * @param {*} lte 
     * @param {*} filters 
     * @param {*} pattern 
     */
    async getTop3AgentsSudoNonSuccessful(gte, lte, filters, pattern = 'wazuh-alerts-3.x-*') {
        try {
            const base = {};

            Object.assign(base,Base(pattern, filters, gte, lte));

            Object.assign(base.aggs,{
                "3": {
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
                    "data.audit.uid": {
                        "query": "0"
                    }
                }
            });

            base.query.bool.must.push({
                "match_phrase": {
                    "data.audit.success": {
                        "query": "no"
                    }
                }
            });

            base.query.bool.must_not.push({
                "match_phrase": {
                    "data.audit.auid": {
                        "query": "0"
                    }
                }
            });

            const response = await this.wzWrapper.searchWazuhAlertsWithPayload(base);
            const { buckets } = response.aggregations['3'];
            return buckets.map(item => item.key);

        } catch (error) {
            return Promise.reject(error);
        }
    }

    /**
     * Returns the most failed syscall in the top 3 agents with failed system calls
     * @param {*} gte 
     * @param {*} lte 
     * @param {*} filters 
     * @param {*} pattern 
     */
    async getTop3AgentsFailedSyscalls(gte, lte, filters, pattern = 'wazuh-alerts-3.x-*') {
        try {
            const base = {};

            Object.assign(base,Base(pattern, filters, gte, lte));

            Object.assign(base.aggs,{
                "3": {
                    "terms": {
                        "field": "agent.id",
                        "size": 3,
                        "order": {
                            "_count": "desc"
                        }
                    },
                    "aggs": {
                        "4": {
                            "terms": {
                                "field": "data.audit.syscall",
                                "size": 1,
                                "order": {
                                    "_count": "desc"
                                }
                            }
                        }
                    }
                }
            });

            base.query.bool.must.push({
                "match_phrase": {
                    "data.audit.success": {
                        "query": "no"
                    }
                }
            });

            const response = await this.wzWrapper.searchWazuhAlertsWithPayload(base);
            const { buckets } = response.aggregations['3'];

            const result = [];
            for (const bucket of buckets) {
                try {
                    const agent = bucket.key;
                    const syscall = { id: bucket['4'].buckets[0].key, syscall: AuditMap[bucket['4'].buckets[0].key] || 'Warning: Unknown system call' };
                    result.push({
                        agent, syscall
                    });
                } catch (error) {
                    continue;
                }

            }
            return result;

        } catch (error) {
            return Promise.reject(error);
        }
    }

    async getTopFailedSyscalls(gte, lte, filters, pattern = 'wazuh-alerts-3.x-*') {
        try {
            const base = {};

            Object.assign(base,Base(pattern, filters, gte, lte));

            Object.assign(base.aggs,{
                "2": {
                  "terms": {
                    "field": "data.audit.syscall",
                    "size": 10,
                    "order": {
                      "_count": "desc"
                    }
                  }
                }
            });

            base.query.bool.must.push({
                "match_phrase": {
                    "data.audit.success": {
                        "query": "no"
                    }
                }
            });

            const response = await this.wzWrapper.searchWazuhAlertsWithPayload(base);
            const { buckets } = response.aggregations['2'];

            return buckets.map(item => ({ id:item.key, syscall:AuditMap[item.key] }));

        } catch (error) {
            return Promise.reject(error);
        }
    }
}