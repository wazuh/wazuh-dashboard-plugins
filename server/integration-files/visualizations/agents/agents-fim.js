/*
 * Wazuh app - Module for Agents/FIM visualizations
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
		"_id": "Wazuh-App-Agents-FIM-Users",
		"_source": {
			"title": "Users",
			"visState":
				"{\"title\":\"Users\",\"type\":\"pie\",\"params\":{\"type\":\"pie\",\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"isDonut\":true},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"syscheck.uname_after\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
			"uiStateJSON": "{}",
			"description": "",
			"version": 1,
			"kibanaSavedObjectMeta": {
				"searchSourceJSON":
					"{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"\",\"language\":\"lucene\"}}"
			}
		},
		"_type": "visualization"
	},
    {
        "_id": "Wazuh-App-Agents-FIM-Groups",
        "_source": {
            "title": "Groups",
            "visState": "{\"title\":\"Groups\",\"type\":\"pie\",\"params\":{\"type\":\"pie\",\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"isDonut\":true},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"syscheck.gname_after\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
            "uiStateJSON": "{}",
            "description": "",
            "version": 1,
            "kibanaSavedObjectMeta": {
                "searchSourceJSON": "{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"\",\"language\":\"lucene\"}}"
            }
        },
        "_type": "visualization"
    },
    {
        "_id": "Wazuh-App-Agents-FIM-Permissions",
        "_source": {
            "title": "Permissions",
            "visState": "{\"title\":\"Permissions\",\"type\":\"pie\",\"params\":{\"type\":\"pie\",\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"isDonut\":true},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"syscheck.perm_after\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
            "uiStateJSON": "{}",
            "description": "",
            "version": 1,
            "kibanaSavedObjectMeta": {
                "searchSourceJSON": "{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"\",\"language\":\"lucene\"}}"
            }
        },
        "_type": "visualization"
    },
    {
        "_id": "Wazuh-App-Agents-FIM-Events",
        "_source": {
            "title": "Events",
            "visState": "{\"title\":\"Events\",\"type\":\"histogram\",\"params\":{\"type\":\"histogram\",\"grid\":{\"categoryLines\":false,\"style\":{\"color\":\"#eee\"}},\"categoryAxes\":[{\"id\":\"CategoryAxis-1\",\"type\":\"category\",\"position\":\"bottom\",\"show\":true,\"style\":{},\"scale\":{\"type\":\"linear\"},\"labels\":{\"show\":true,\"truncate\":100},\"title\":{}}],\"valueAxes\":[{\"id\":\"ValueAxis-1\",\"name\":\"LeftAxis-1\",\"type\":\"value\",\"position\":\"left\",\"show\":true,\"style\":{},\"scale\":{\"type\":\"linear\",\"mode\":\"normal\"},\"labels\":{\"show\":true,\"rotate\":0,\"filter\":false,\"truncate\":100},\"title\":{\"text\":\"Count\"}}],\"seriesParams\":[{\"show\":\"true\",\"type\":\"histogram\",\"mode\":\"stacked\",\"data\":{\"label\":\"Count\",\"id\":\"1\"},\"valueAxis\":\"ValueAxis-1\",\"drawLinesBetweenPoints\":true,\"showCircles\":true}],\"addTooltip\":true,\"addLegend\":false,\"legendPosition\":\"right\",\"times\":[],\"addTimeMarker\":false},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"date_histogram\",\"schema\":\"segment\",\"params\":{\"field\":\"@timestamp\",\"interval\":\"h\",\"customInterval\":\"2h\",\"min_doc_count\":1,\"extended_bounds\":{}}}]}",
            "uiStateJSON": "{\"vis\":{\"legendOpen\":false}}",
            "description": "",
            "version": 1,
            "kibanaSavedObjectMeta": {
                "searchSourceJSON": "{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"\",\"language\":\"lucene\"}}"
            }
        },
        "_type": "visualization"
    },
    {
        "_id": "Wazuh-App-Agents-FIM-Files-added",
        "_source": {
            "title": "Files added",
            "visState": "{\"title\":\"Files added\",\"type\":\"pie\",\"params\":{\"type\":\"pie\",\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"isDonut\":true},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"syscheck.path\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
            "uiStateJSON": "{}",
            "description": "",
            "version": 1,
            "kibanaSavedObjectMeta": {
                "searchSourceJSON":`{
                    "index":"wazuh-alerts",
                    "filter":[
                        {
                            "meta": {
                              "index": "wazuh-alerts",
                              "type": "phrases",
                              "key": "syscheck.event",
                              "value": "added, readded",
                              "params": [
                                "added",
                                "readded"
                              ],
                              "negate": false,
                              "disabled": false,
                              "alias": null
                            },
                            "query": {
                              "bool": {
                                "should": [
                                  {
                                    "match_phrase": {
                                      "syscheck.event": "added"
                                    }
                                  },
                                  {
                                    "match_phrase": {
                                      "syscheck.event": "readded"
                                    }
                                  }
                                ],
                                "minimum_should_match": 1
                              }
                            },
                            "$state": {
                              "store": "appState"
                            }
                          }
                    ],
                    "query":{"query":"","language":"lucene"}
                }`
            }
        },
        "_type": "visualization"
    },
    {
        "_id": "Wazuh-App-Agents-FIM-Files-modified",
        "_source": {
            "title": "Files modified",
            "visState": "{\"title\":\"Files modified\",\"type\":\"pie\",\"params\":{\"type\":\"pie\",\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"isDonut\":true},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"syscheck.path\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
            "uiStateJSON": "{}",
            "description": "",
            "version": 1,
            "kibanaSavedObjectMeta": {
                "searchSourceJSON": `{
                    "index":"wazuh-alerts",
                    "filter":[
                        {
                            "meta": {
                              "index": "wazuh-alerts",
                              "negate": false,
                              "disabled": false,
                              "alias": null,
                              "type": "phrase",
                              "key": "syscheck.event",
                              "value": "modified",
                              "params": {
                                "query": "modified",
                                "type": "phrase"
                              }
                            },
                            "query": {
                              "match": {
                                "syscheck.event": {
                                  "query": "modified",
                                  "type": "phrase"
                                }
                              }
                            },
                            "$state": {
                              "store": "appState"
                            }
                          }
                    ],
                    "query":{"query":"","language":"lucene"}
                }`
            }
        },
        "_type": "visualization"
    },
    {
        "_id": "Wazuh-App-Agents-FIM-Files-deleted",
        "_source": {
            "title": "Files deleted",
            "visState": "{\"title\":\"Files deleted\",\"type\":\"pie\",\"params\":{\"type\":\"pie\",\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"isDonut\":true},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"syscheck.path\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
            "uiStateJSON": "{}",
            "description": "",
            "version": 1,
            "kibanaSavedObjectMeta": {
                "searchSourceJSON": `{
                    "index":"wazuh-alerts",
                    "filter":[
                        {
                            "meta": {
                              "index": "wazuh-alerts",
                              "negate": false,
                              "disabled": false,
                              "alias": null,
                              "type": "phrase",
                              "key": "syscheck.event",
                              "value": "deleted",
                              "params": {
                                "query": "deleted",
                                "type": "phrase"
                              }
                            },
                            "query": {
                              "match": {
                                "syscheck.event": {
                                  "query": "deleted",
                                  "type": "phrase"
                                }
                              }
                            },
                            "$state": {
                              "store": "appState"
                            }
                          }
                    ],
                    "query":{"query":"","language":"lucene"}
                }`
            }
        },
        "_type": "visualization"
    },
    {
        "_id": "Wazuh-App-Agents-FIM-Alerts-summary",
        "_type": "visualization",
        "_source": {
            "title": "Alerts summary",
            "visState": "{\"title\":\"Alerts summary\",\"type\":\"table\",\"params\":{\"perPage\":10,\"showPartialRows\":false,\"showMeticsAtAllLevels\":false,\"sort\":{\"columnIndex\":null,\"direction\":null},\"showTotal\":false,\"totalFunc\":\"sum\"},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"3\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"syscheck.path\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"size\":50,\"order\":\"desc\",\"orderBy\":\"1\",\"customLabel\":\"File\"}},{\"id\":\"5\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"rule.description\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"size\":10,\"order\":\"desc\",\"orderBy\":\"1\",\"customLabel\":\"Description\"}}]}",
            "uiStateJSON": "{\"vis\":{\"params\":{\"sort\":{\"columnIndex\":null,\"direction\":null}}}}",
            "description": "",
            "version": 1,
            "kibanaSavedObjectMeta": {
                "searchSourceJSON": "{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"\",\"language\":\"lucene\"}}"
            }
        }
    }
]
