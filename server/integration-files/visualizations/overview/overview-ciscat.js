/*
 * Wazuh app - Module for Overview/CIS-CAT visualizations
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export default [
    {
        "_id": "Wazuh-app-Overview-CISCAT-alerts-summary",
        "_type": "visualization",
        "_source": {
            "title": "Alerts summary",
            "visState": "{\"title\":\"Alerts summary\",\"type\":\"table\",\"params\":{\"perPage\":10,\"showPartialRows\":false,\"showMeticsAtAllLevels\":false,\"sort\":{\"columnIndex\":null,\"direction\":null},\"showTotal\":false,\"totalFunc\":\"count\"},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"data.cis.rule_id\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"size\":100,\"order\":\"desc\",\"orderBy\":\"1\",\"customLabel\":\"Rule ID\"}},{\"id\":\"3\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"data.cis.rule_title\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"size\":1,\"order\":\"desc\",\"orderBy\":\"1\",\"customLabel\":\"Rule title\"}},{\"id\":\"4\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"data.cis.group\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"size\":1,\"order\":\"desc\",\"orderBy\":\"1\",\"customLabel\":\"Group\"}},{\"id\":\"5\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"data.cis.result\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"size\":1,\"order\":\"desc\",\"orderBy\":\"1\",\"customLabel\":\"Result\"}}]}",
            "uiStateJSON": "{\"vis\":{\"params\":{\"sort\":{\"columnIndex\":4,\"direction\":\"desc\"}}}}",
            "description": "",
            "version": 1,
            "kibanaSavedObjectMeta": {
                "searchSourceJSON": "{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"rule.groups: ciscat\",\"language\":\"lucene\"}}"
            }
        }
    },
    {
        "_id": "Wazuh-app-Overview-CISCAT-last-scan-not-checked",
        "_type": "visualization",
        "_source": {
            "title": "Last scan not checked",
            "visState": "{\"title\":\"Last scan not checked\",\"type\":\"table\",\"params\":{\"perPage\":10,\"showPartialRows\":false,\"showMeticsAtAllLevels\":false,\"sort\":{\"columnIndex\":null,\"direction\":null},\"showTotal\":false,\"totalFunc\":\"sum\"},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"max\",\"schema\":\"metric\",\"params\":{\"field\":\"@timestamp\"}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"data.cis.notchecked\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"size\":1,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
            "uiStateJSON": "{\"vis\":{\"params\":{\"sort\":{\"columnIndex\":null,\"direction\":null}}}}",
            "description": "",
            "version": 1,
            "kibanaSavedObjectMeta": {
                "searchSourceJSON": "{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"rule.groups: ciscat\",\"language\":\"lucene\"}}"
            }
        }
    },
    {
        "_id": "Wazuh-app-Overview-CISCAT-last-scan-score",
        "_type": "visualization",
        "_source": {
            "title": "Last scan score",
            "visState": "{\"title\":\"Last scan score\",\"type\":\"table\",\"params\":{\"perPage\":10,\"showPartialRows\":false,\"showMeticsAtAllLevels\":false,\"sort\":{\"columnIndex\":null,\"direction\":null},\"showTotal\":false,\"totalFunc\":\"sum\"},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"max\",\"schema\":\"metric\",\"params\":{\"field\":\"@timestamp\"}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"data.cis.score\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"size\":1,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
            "uiStateJSON": "{\"vis\":{\"params\":{\"sort\":{\"columnIndex\":null,\"direction\":null}}}}",
            "description": "",
            "version": 1,
            "kibanaSavedObjectMeta": {
                "searchSourceJSON": "{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"rule.groups: ciscat\",\"language\":\"lucene\"}}"
            }
        }
    },
    {
        "_id": "Wazuh-app-Overview-CISCAT-last-scan-pass",
        "_type": "visualization",
        "_source": {
            "title": "Last scan pass",
            "visState": "{\"title\":\"Last scan pass\",\"type\":\"table\",\"params\":{\"perPage\":10,\"showPartialRows\":false,\"showMeticsAtAllLevels\":false,\"sort\":{\"columnIndex\":null,\"direction\":null},\"showTotal\":false,\"totalFunc\":\"sum\"},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"max\",\"schema\":\"metric\",\"params\":{\"field\":\"@timestamp\"}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"data.cis.pass\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"size\":1,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
            "uiStateJSON": "{\"vis\":{\"params\":{\"sort\":{\"columnIndex\":null,\"direction\":null}}}}",
            "description": "",
            "version": 1,
            "kibanaSavedObjectMeta": {
                "searchSourceJSON": "{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"rule.groups: ciscat\",\"language\":\"lucene\"}}"
            }
        }
    },
    {
        "_id": "Wazuh-app-Overview-CISCAT-last-scan-fail",
        "_type": "visualization",
        "_source": {
            "title": "Last scan fail",
            "visState": "{\"title\":\"Last scan fail\",\"type\":\"table\",\"params\":{\"perPage\":10,\"showPartialRows\":false,\"showMeticsAtAllLevels\":false,\"sort\":{\"columnIndex\":null,\"direction\":null},\"showTotal\":false,\"totalFunc\":\"sum\"},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"max\",\"schema\":\"metric\",\"params\":{\"field\":\"@timestamp\"}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"data.cis.fail\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"size\":1,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
            "uiStateJSON": "{\"vis\":{\"params\":{\"sort\":{\"columnIndex\":null,\"direction\":null}}}}",
            "description": "",
            "version": 1,
            "kibanaSavedObjectMeta": {
                "searchSourceJSON": "{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"rule.groups: ciscat\",\"language\":\"lucene\"}}"
            }
        }
    },
    {
        "_id": "Wazuh-app-Overview-CISCAT-last-scan-timestamp",
        "_type": "visualization",
        "_source": {
            "title": "Last scan timestamp",
            "visState": "{\"title\":\"Last scan timestamp\",\"type\":\"table\",\"params\":{\"perPage\":10,\"showPartialRows\":false,\"showMeticsAtAllLevels\":false,\"sort\":{\"columnIndex\":null,\"direction\":null},\"showTotal\":false,\"totalFunc\":\"sum\"},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"max\",\"schema\":\"metric\",\"params\":{\"field\":\"@timestamp\"}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"data.cis.timestamp\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"size\":1,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
            "uiStateJSON": "{\"vis\":{\"params\":{\"sort\":{\"columnIndex\":null,\"direction\":null}}}}",
            "description": "",
            "version": 1,
            "kibanaSavedObjectMeta": {
                "searchSourceJSON": "{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"rule.groups: ciscat\",\"language\":\"lucene\"}}"
            }
        }
    },
    {
        "_id": "Wazuh-app-Overview-CISCAT-last-scan-error",
        "_type": "visualization",
        "_source": {
            "title": "Last scan error",
            "visState": "{\"title\":\"Last scan error\",\"type\":\"table\",\"params\":{\"perPage\":10,\"showPartialRows\":false,\"showMeticsAtAllLevels\":false,\"sort\":{\"columnIndex\":null,\"direction\":null},\"showTotal\":false,\"totalFunc\":\"sum\"},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"max\",\"schema\":\"metric\",\"params\":{\"field\":\"@timestamp\"}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"data.cis.error\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"size\":1,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
            "uiStateJSON": "{\"vis\":{\"params\":{\"sort\":{\"columnIndex\":null,\"direction\":null}}}}",
            "description": "",
            "version": 1,
            "kibanaSavedObjectMeta": {
                "searchSourceJSON": "{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"rule.groups: ciscat\",\"language\":\"lucene\"}}"
            }
        }
    }
]
