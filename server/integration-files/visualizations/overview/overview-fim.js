/*
 * Wazuh app - Module for Overview/FIM visualizations
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
    "_id":  'Wazuh-App-Overview-FIM-Events-summary',
    "_type": "visualization",
    "_source": {
      "title": 'Events summary',
      "visState": "{\"title\":\"Events summary\",\"type\":\"vega\",\"params\":{\"spec\":\"{\\n\\n\\n  $schema: https://vega.github.io/schema/vega-lite/v2.json\\n \\n  // Define the data source\\n  data: {\\n    url: {\\n\\n\\n      // Apply dashboard context filters when set\\n      %context%: true\\n      // Filter the time picker (upper right corner) with this field\\n      %timefield%: @timestamp\\n\\n\\n\\n      // Which index to search\\n      index: _all\\n      // Aggregate data by the time field into time buckets, counting the number of documents in each bucket.\\n      body: {\\n        aggs: {\\n          time_buckets: {\\n            date_histogram: {\\n              // Use date histogram aggregation on @timestamp field\\n              field: @timestamp\\n              // The interval value will depend on the daterange picker (true), or use an integer to set an approximate bucket count\\n              interval: {%autointerval%: true}\\n              // Make sure we get an entire range, even if it has no data\\n              extended_bounds: {\\n                // Use the current time range's start and end\\n                min: {%timefilter%: \\\"min\\\"}\\n                max: {%timefilter%: \\\"max\\\"}\\n              }\\n              // Use this for linear (e.g. line, area) graphs.  Without it, empty buckets will not show up\\n              min_doc_count: 0\\n            }\\n          }\\n        }\\n        // Speed up the response by only including aggregation results\\n        size: 0\\n      }\\n    }\\n\\n    format: {property: \\\"aggregations.time_buckets.buckets\\\"}\\n  }\\n\\n mark: line\\n\\n  // \\\"encoding\\\" tells the \\\"mark\\\" what data to use and in what way.  See https://vega.github.io/vega-lite/docs/encoding.html\\n  encoding: {\\n    x: {\\n      // The \\\"key\\\" value is the timestamp in milliseconds.  Use it for X axis.\\n      field: key\\n      type: temporal\\n      axis: {title: false} // Customize X axis format\\n    }\\n    y: {\\n      // The \\\"doc_count\\\" is the count per bucket.  Use it for Y axis.\\n      field: doc_count\\n      type: quantitative\\n      axis: {title: \\\"Alerts count\\\"}\\n    }\\n  }\\n}\\n\"},\"aggs\":[]}",
      "uiStateJSON": "{}",
      "description": "",
      "version": 1,
      "kibanaSavedObjectMeta": {
        "searchSourceJSON": "{\"query\":{\"query\":\"\",\"language\":\"lucene\"},\"filter\":[]}"
        
      }
    }
  },
  {
    "_id": "Wazuh-App-Overview-FIM-Top-5-rules",
    "_type": "visualization",
    "_source": {
      "title": "Top 5 rules",
      "visState": "{\"title\":\"Top 5 rules\",\"type\":\"table\",\"params\":{\"perPage\":10,\"showPartialRows\":false,\"showMetricsAtAllLevels\":false,\"sort\":{\"columnIndex\":null,\"direction\":null},\"showTotal\":false,\"totalFunc\":\"sum\"},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"rule.id\",\"size\":3,\"order\":\"desc\",\"orderBy\":\"1\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"customLabel\":\"Rule\"}},{\"id\":\"3\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"rule.description\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"customLabel\":\"Description\"}}]}",
      "uiStateJSON": "{\"vis\":{\"params\":{\"sort\":{\"columnIndex\":null,\"direction\":null}}}}",
      "description": "",
      "version": 1,
      "kibanaSavedObjectMeta": {
        "searchSourceJSON": "{\"index\":\"wazuh-alerts\",\"query\":{\"query\":\"\",\"language\":\"lucene\"},\"filter\":[]}"
      }
    }
  },
  {
    "_id": "Wazuh-App-Overview-FIM-Top-5-agents",
    "_type": "visualization",
    "_source": {
      "title": "Top 5 agents",
      "visState": "{\"title\":\"Top 5 agents\",\"type\":\"pie\",\"params\":{\"type\":\"pie\",\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"isDonut\":true,\"labels\":{\"show\":false,\"values\":true,\"last_level\":true,\"truncate\":100}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"agent.name\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\"}}]}",
      "uiStateJSON": "{}",
      "description": "",
      "version": 1,
      "kibanaSavedObjectMeta": {
        "searchSourceJSON": "{\"index\":\"wazuh-alerts\",\"query\":{\"query\":\"\",\"language\":\"lucene\"},\"filter\":[{\"meta\":{\"index\":\"wazuh-alerts\",\"negate\":false,\"disabled\":false,\"alias\":null,\"type\":\"phrase\",\"key\":\"syscheck.audit.effective_user.name\",\"value\":\"root\",\"params\":{\"query\":\"root\",\"type\":\"phrase\"}},\"query\":{\"match\":{\"syscheck.audit.effective_user.name\":{\"query\":\"root\",\"type\":\"phrase\"}}},\"$state\":{\"store\":\"appState\"}}]}"
      }
    }
  },
  {
    "_id": "Wazuh-App-Overview-FIM-Percentage-affected",
    "_type": "visualization",
    "_source": {
      "title": "Affected alerts",
      "visState": "{\"title\":\"Affected alerts\",\"type\":\"goal\",\"params\":{\"addTooltip\":true,\"addLegend\":false,\"isDisplayWarning\":false,\"type\":\"gauge\",\"gauge\":{\"verticalSplit\":false,\"autoExtend\":false,\"percentageMode\":true,\"gaugeType\":\"Arc\",\"gaugeStyle\":\"Full\",\"backStyle\":\"Full\",\"orientation\":\"vertical\",\"useRanges\":false,\"colorSchema\":\"Green to Red\",\"gaugeColorMode\":\"None\",\"colorsRange\":[{\"from\":0,\"to\":10000}],\"invertColors\":false,\"labels\":{\"show\":true,\"color\":\"black\"},\"scale\":{\"show\":false,\"labels\":false,\"color\":\"#333\",\"width\":2},\"type\":\"meter\",\"style\":{\"bgFill\":\"#000\",\"bgColor\":false,\"labelColor\":false,\"subText\":\"\",\"fontSize\":60}}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}}]}",
      "uiStateJSON": "{\"vis\":{\"defaultColors\":{\"0 - 100\":\"rgb(0,104,55)\"}}}",
      "description": "",
      "version": 1,
      "kibanaSavedObjectMeta": {
        "searchSourceJSON": "{\"index\":\"wazuh-alerts\",\"query\":{\"query\":\"\",\"language\":\"lucene\"},\"filter\":[]}"
      }
    }
  },
  {
    "_id": "Wazuh-App-Overview-FIM-Whodata-usage",
    "_type": "visualization",
    "_source": {
      "title": "Whodata usage",
      "visState": "{\"title\":\"Whodata usage\",\"type\":\"area\",\"params\":{\"addLegend\":false,\"addTimeMarker\":false,\"addTooltip\":false,\"categoryAxes\":[{\"id\":\"CategoryAxis-1\",\"labels\":{\"show\":true,\"truncate\":100,\"rotate\":0},\"position\":\"bottom\",\"scale\":{\"type\":\"linear\"},\"show\":true,\"style\":{},\"title\":{},\"type\":\"category\"}],\"grid\":{\"categoryLines\":false,\"style\":{\"color\":\"#eee\"}},\"legendPosition\":\"right\",\"seriesParams\":[{\"data\":{\"id\":\"1\",\"label\":\"Count\"},\"drawLinesBetweenPoints\":true,\"interpolate\":\"linear\",\"mode\":\"normal\",\"show\":\"true\",\"showCircles\":true,\"type\":\"histogram\",\"valueAxis\":\"ValueAxis-1\"}],\"times\":[],\"type\":\"area\",\"valueAxes\":[{\"id\":\"ValueAxis-1\",\"labels\":{\"filter\":false,\"rotate\":0,\"show\":true,\"truncate\":100},\"name\":\"LeftAxis-1\",\"position\":\"left\",\"scale\":{\"mode\":\"normal\",\"type\":\"linear\"},\"show\":true,\"style\":{},\"title\":{\"text\":\"Count\"},\"type\":\"value\"}]},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"cardinality\",\"schema\":\"metric\",\"params\":{\"field\":\"agent.name\",\"customLabel\":\"Count\"}},{\"id\":\"2\",\"enabled\":true,\"type\":\"filters\",\"schema\":\"segment\",\"params\":{\"filters\":[{\"input\":{\"query\":\"\"},\"label\":\"Agents\"},{\"input\":{\"query\":\"_exists_:syscheck.audit.effective_user.name\"},\"label\":\"Agents using whodata\"}]}}]}",
      "uiStateJSON": "{}",
      "description": "",
      "version": 1,
      "kibanaSavedObjectMeta": {
        "searchSourceJSON": "{\"index\":\"wazuh-alerts\",\"query\":{\"language\":\"lucene\",\"query\":\"\"},\"filter\":[]}"
      }
    }
  },
  {
    "_id": "Wazuh-App-Overview-FIM-deleted",
    "_type": "visualization",
    "_source": {
      "title": "Top deleted",
      "visState": "{\"title\":\"Top deleted\",\"type\":\"pie\",\"params\":{\"type\":\"pie\",\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"isDonut\":true,\"labels\":{\"show\":false,\"values\":true,\"last_level\":true,\"truncate\":100}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"cardinality\",\"schema\":\"metric\",\"params\":{\"field\":\"syscheck.path\"}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"agent.name\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\"}}]}",
      "uiStateJSON": "{}",
      "description": "",
      "version": 1,
      "kibanaSavedObjectMeta": {
        "searchSourceJSON": "{\"index\":\"wazuh-alerts\",\"query\":{\"query\":\"\",\"language\":\"lucene\"},\"filter\":[{\"meta\":{\"index\":\"wazuh-alerts\",\"negate\":false,\"disabled\":false,\"alias\":null,\"type\":\"phrase\",\"key\":\"syscheck.event\",\"value\":\"deleted\",\"params\":{\"query\":\"deleted\",\"type\":\"phrase\"}},\"query\":{\"match\":{\"syscheck.event\":{\"query\":\"deleted\",\"type\":\"phrase\"}}},\"$state\":{\"store\":\"appState\"}}]}"
      }
    }
  },
  {
    "_id": "Wazuh-App-Overview-FIM-added",
    "_type": "visualization",
    "_source": {
      "title": "Top added",
      "visState": "{\"title\":\"Top added\",\"type\":\"pie\",\"params\":{\"type\":\"pie\",\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"isDonut\":true,\"labels\":{\"show\":false,\"values\":true,\"last_level\":true,\"truncate\":100}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"cardinality\",\"schema\":\"metric\",\"params\":{\"field\":\"syscheck.path\"}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"agent.name\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\"}}]}",
      "uiStateJSON": "{}",
      "description": "",
      "version": 1,
      "kibanaSavedObjectMeta": {
        "searchSourceJSON": "{\"index\":\"wazuh-alerts\",\"query\":{\"query\":\"\",\"language\":\"lucene\"},\"filter\":[{\"meta\":{\"index\":\"wazuh-alerts\",\"negate\":false,\"disabled\":false,\"alias\":null,\"type\":\"phrase\",\"key\":\"rule.groups\",\"value\":\"syscheck\",\"params\":{\"query\":\"syscheck\",\"type\":\"phrase\"}},\"query\":{\"match\":{\"rule.groups\":{\"query\":\"syscheck\",\"type\":\"phrase\"}}},\"$state\":{\"store\":\"appState\"}},{\"meta\":{\"index\":\"wazuh-alerts\",\"negate\":false,\"disabled\":false,\"alias\":null,\"type\":\"range\",\"key\":\"rule.level\",\"value\":\"7 to 16\",\"params\":{\"gte\":7,\"lt\":16}},\"range\":{\"rule.level\":{\"gte\":7,\"lt\":16}},\"$state\":{\"store\":\"appState\"}}]}"
      }
    }
  },
  {
    "_id": "Wazuh-App-Overview-FIM-modified",
    "_type": "visualization",
    "_source": {
      "title": "Top modified",
      "visState": "{\"title\":\"Top modified\",\"type\":\"pie\",\"params\":{\"type\":\"pie\",\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"isDonut\":true,\"labels\":{\"show\":false,\"values\":true,\"last_level\":true,\"truncate\":100}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"cardinality\",\"schema\":\"metric\",\"params\":{\"field\":\"syscheck.path\"}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"agent.name\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\"}}]}",
      "uiStateJSON": "{}",
      "description": "",
      "version": 1,
      "kibanaSavedObjectMeta": {
        "searchSourceJSON": "{\"index\":\"wazuh-alerts\",\"query\":{\"query\":\"\",\"language\":\"lucene\"},\"filter\":[{\"meta\":{\"index\":\"wazuh-alerts\",\"negate\":false,\"disabled\":false,\"alias\":null,\"type\":\"phrase\",\"key\":\"syscheck.event\",\"value\":\"modified\",\"params\":{\"query\":\"modified\",\"type\":\"phrase\"}},\"query\":{\"match\":{\"syscheck.event\":{\"query\":\"modified\",\"type\":\"phrase\"}}},\"$state\":{\"store\":\"appState\"}}]}"
      }
    }
  },
  {
    "_id": "Wazuh-App-Overview-FIM-top-agents-user",
    "_type": "visualization",
    "_source": {
      "title": "Top users",
      "visState": "{\"title\":\"Top users\",\"type\":\"table\",\"params\":{\"perPage\":10,\"showPartialRows\":false,\"showMetricsAtAllLevels\":false,\"sort\":{\"columnIndex\":null,\"direction\":null},\"showTotal\":false,\"totalFunc\":\"sum\"},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"agent.id\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"customLabel\":\"Agent ID\"}},{\"id\":\"3\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"agent.name\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"customLabel\":\"Agent name\"}},{\"id\":\"4\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"syscheck.audit.effective_user.name\",\"size\":1,\"order\":\"desc\",\"orderBy\":\"1\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"customLabel\":\"Top user\"}}]}",
      "uiStateJSON": "{\"vis\":{\"params\":{\"sort\":{\"columnIndex\":null,\"direction\":null}}}}",
      "description": "",
      "version": 1,
      "kibanaSavedObjectMeta": {
        "searchSourceJSON": "{\"index\":\"wazuh-alerts\",\"query\":{\"query\":\"\",\"language\":\"lucene\"},\"filter\":[{\"meta\":{\"index\":\"wazuh-alerts\",\"negate\":false,\"disabled\":false,\"alias\":null,\"type\":\"phrase\",\"key\":\"rule.groups\",\"value\":\"syscheck\",\"params\":{\"query\":\"syscheck\",\"type\":\"phrase\"}},\"query\":{\"match\":{\"rule.groups\":{\"query\":\"syscheck\",\"type\":\"phrase\"}}},\"$state\":{\"store\":\"appState\"}}]}"
      }
    }
  }
];
