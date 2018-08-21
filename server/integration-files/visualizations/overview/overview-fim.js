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
		"_id": "Wazuh-App-Overview-FIM-Added",
		"_source": {
			"title": "Added",
			"visState": "{\"title\":\"Added\",\"type\":\"metric\",\"params\":{\"addTooltip\":true,\"addLegend\":false,\"type\":\"metric\",\"metric\":{\"percentageMode\":false,\"colorSchema\":\"Green to Red\",\"useRange\":false,\"colorsRange\":[{\"from\":0,\"to\":100}],\"invertColors\":false,\"labels\":{\"show\":true,\"color\":\"black\"},\"style\":{\"fontSize\":20,\"bgColor\":false,\"labelColor\":false,\"subText\":\"\"},\"metricColorMode\":\"None\"}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{\"customLabel\":\"Added\"}}]}",
			"uiStateJSON": "{\"vis\":{\"defaultColors\":{\"0 - 100\":\"rgb(0,104,55)\"}}}",
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
        "_id": "Wazuh-App-Overview-FIM-Modified",
        "_source": {
            "title": "Modified",
            "visState": "{\"title\":\"Modified\",\"type\":\"metric\",\"params\":{\"addTooltip\":true,\"addLegend\":false,\"type\":\"metric\",\"metric\":{\"percentageMode\":false,\"colorSchema\":\"Green to Red\",\"useRange\":false,\"colorsRange\":[{\"from\":0,\"to\":100}],\"invertColors\":false,\"labels\":{\"show\":true,\"color\":\"black\"},\"style\":{\"fontSize\":20,\"bgColor\":false,\"labelColor\":false,\"subText\":\"\"},\"metricColorMode\":\"None\"}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{\"customLabel\":\"Modified\"}}]}",
            "uiStateJSON": "{\"vis\":{\"defaultColors\":{\"0 - 100\":\"rgb(0,104,55)\"}}}",
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
        "_id": "Wazuh-App-Overview-FIM-Deleted",
        "_source": {
            "title": "Deleted",
            "visState": "{\"title\":\"Deleted\",\"type\":\"metric\",\"params\":{\"addTooltip\":true,\"addLegend\":false,\"type\":\"metric\",\"metric\":{\"percentageMode\":false,\"colorSchema\":\"Green to Red\",\"useRange\":false,\"colorsRange\":[{\"from\":0,\"to\":100}],\"invertColors\":false,\"labels\":{\"show\":true,\"color\":\"black\"},\"style\":{\"fontSize\":20,\"bgColor\":false,\"labelColor\":false,\"subText\":\"\"},\"metricColorMode\":\"None\"}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{\"customLabel\":\"Deleted\"}}]}",
            "uiStateJSON": "{\"vis\":{\"defaultColors\":{\"0 - 100\":\"rgb(0,104,55)\"}}}",
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
        "_id": "Wazuh-App-Overview-FIM-Events-over-time",
        "_source": {
            "title": "Events over time",
            "visState": "{\"title\":\"Events over time\",\"type\":\"area\",\"params\":{\"type\":\"area\",\"grid\":{\"categoryLines\":false,\"style\":{\"color\":\"#eee\"}},\"categoryAxes\":[{\"id\":\"CategoryAxis-1\",\"type\":\"category\",\"position\":\"bottom\",\"show\":true,\"style\":{},\"scale\":{\"type\":\"linear\"},\"labels\":{\"show\":true,\"truncate\":100},\"title\":{}}],\"valueAxes\":[{\"id\":\"ValueAxis-1\",\"name\":\"LeftAxis-1\",\"type\":\"value\",\"position\":\"left\",\"show\":true,\"style\":{},\"scale\":{\"type\":\"linear\",\"mode\":\"normal\"},\"labels\":{\"show\":true,\"rotate\":0,\"filter\":false,\"truncate\":100},\"title\":{\"text\":\"Count\"}}],\"seriesParams\":[{\"show\":\"true\",\"type\":\"area\",\"mode\":\"stacked\",\"data\":{\"label\":\"Count\",\"id\":\"1\"},\"drawLinesBetweenPoints\":true,\"showCircles\":true,\"interpolate\":\"linear\",\"valueAxis\":\"ValueAxis-1\"}],\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"times\":[],\"addTimeMarker\":false},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"date_histogram\",\"schema\":\"segment\",\"params\":{\"field\":\"@timestamp\",\"interval\":\"h\",\"customInterval\":\"30m\",\"min_doc_count\":1,\"extended_bounds\":{}}},{\"id\":\"3\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"group\",\"params\":{\"field\":\"rule.groups\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"_term\"}}]}",
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
        "_id": "Wazuh-App-Overview-FIM-Top-user-owners",
        "_type": "visualization",
        "_source": {
            "title": "Top user owners",
            "visState": "{\"title\":\"Top user owners\",\"type\":\"pie\",\"params\":{\"isDonut\":true,\"shareYAxis\":true,\"addTooltip\":true,\"addLegend\":true,\"type\":\"pie\",\"legendPosition\":\"right\",\"labels\":{\"show\":false,\"values\":true,\"last_level\":true,\"truncate\":100}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"3\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"syscheck.uname_after\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
            "uiStateJSON": "{}",
            "description": "",
            "version": 1,
            "kibanaSavedObjectMeta": {
                "searchSourceJSON": "{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"\",\"language\":\"lucene\"}}"
            }
        }
    },
    {
        "_id": "Wazuh-App-Overview-FIM-Top-group-owners",
        "_type": "visualization",
        "_source": {
            "title": "Top group owners",
            "visState": "{\"title\":\"Top group owners\",\"type\":\"pie\",\"params\":{\"isDonut\":true,\"shareYAxis\":true,\"addTooltip\":true,\"addLegend\":true,\"type\":\"pie\",\"legendPosition\":\"right\",\"labels\":{\"show\":false,\"values\":true,\"last_level\":true,\"truncate\":100}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"syscheck.gname_after\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
            "uiStateJSON": "{}",
            "description": "",
            "version": 1,
            "kibanaSavedObjectMeta": {
                "searchSourceJSON": "{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"\",\"language\":\"lucene\"}}"
            }
        }
    },
    {
        "_id": "Wazuh-App-Overview-FIM-Top-file-changes",
        "_source": {
            "title": "Top file changes",
            "visState": "{\"title\":\"Top file changes\",\"type\":\"pie\",\"params\":{\"isDonut\":false,\"shareYAxis\":true,\"addTooltip\":true,\"addLegend\":true,\"type\":\"pie\",\"legendPosition\":\"right\",\"labels\":{\"show\":false,\"values\":true,\"last_level\":true,\"truncate\":100}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"syscheck.path\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
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
        "_id": "Wazuh-App-Overview-FIM-Root-user-file-changes",
        "_source": {
            "title": "Root user file changes",
            "visState": "{\"title\":\"Root user file changes\",\"type\":\"pie\",\"params\":{\"isDonut\":false,\"shareYAxis\":true,\"addTooltip\":true,\"addLegend\":true,\"type\":\"pie\",\"legendPosition\":\"right\",\"labels\":{\"show\":false,\"values\":true,\"last_level\":true,\"truncate\":100}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"syscheck.path\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
            "uiStateJSON": "{}",
            "description": "",
            "version": 1,
            "kibanaSavedObjectMeta": {
              "searchSourceJSON": "{\"index\":\"wazuh-alerts\",\"filter\":[{\"meta\":{\"index\":\"wazuh-alerts\",\"negate\":false,\"disabled\":false,\"alias\":null,\"type\":\"phrase\",\"key\":\"rule.groups\",\"value\":\"syscheck\",\"params\":{\"query\":\"syscheck\",\"type\":\"phrase\"}},\"query\":{\"match\":{\"rule.groups\":{\"query\":\"syscheck\",\"type\":\"phrase\"}}},\"$state\":{\"store\":\"appState\"}},{\"query\":{\"query_string\":{\"query\":\"syscheck.uid_before:0 or syscheck.uid_after:0 or syscheck.gid_after:root or syscheck.gid_before:0\",\"analyze_wildcard\":true,\"default_field\":\"*\"}},\"meta\":{\"negate\":false,\"index\":\"wazuh-alerts\",\"disabled\":false,\"alias\":null,\"type\":\"query_string\",\"key\":\"query\",\"value\":\"syscheck.uid_before:0 or syscheck.uid_after:0 or syscheck.gid_after:root or syscheck.gid_before:0\"},\"$state\":{\"store\":\"appState\"}}],\"query\":{\"query\":\"\",\"language\":\"lucene\"}}"
            }
        },
        "_type": "visualization"
    },
    {
        "_id": "Wazuh-App-Overview-FIM-World-writable-modified-files",
        "_source": {
            "title": "World writable modified files",
            "visState": "{\"title\":\"World writable modified files\",\"type\":\"pie\",\"params\":{\"type\":\"pie\",\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"isDonut\":true},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"syscheck.path\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
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
                              "type": "exists",
                              "key": "syscheck.perm_after",
                              "value": "exists"
                            },
                            "exists": {
                              "field": "syscheck.perm_after"
                            },
                            "$state": {
                              "store": "appState"
                            }
                          },
                          {
                            "query": {
                              "regexp": {
                                "syscheck.perm_after": "[0-7]{5}([2367])"                                
                              }
                            },
                            "meta": {
                              "negate": false,
                              "index": "wazuh-alerts",
                              "disabled": false,
                              "alias": null,
                              "type": "custom",
                              "key": "query",
                              "value": {"regexp":{"syscheck.perm_after": "[0-7]{5}([2367])" }}
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
        "_id": "Wazuh-App-Overview-FIM-Events-summary",
        "_type": "visualization",
        "_source": {
            "title": "Events summary",
            "visState": "{\"title\":\"Events summary\",\"type\":\"table\",\"params\":{\"perPage\":10,\"showPartialRows\":false,\"showMeticsAtAllLevels\":false,\"sort\":{\"columnIndex\":null,\"direction\":null},\"showTotal\":false,\"totalFunc\":\"sum\"},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"agent.name\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"size\":50,\"order\":\"desc\",\"orderBy\":\"1\",\"customLabel\":\"Agent\"}},{\"id\":\"3\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"syscheck.path\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\",\"customLabel\":\"File\"}},{\"id\":\"5\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"rule.description\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\",\"customLabel\":\"Description\"}}]}",
            "uiStateJSON": "{\"vis\":{\"params\":{\"sort\":{\"columnIndex\":3,\"direction\":\"desc\"}}}}",
            "description": "",
            "version": 1,
            "kibanaSavedObjectMeta": {
                "searchSourceJSON": "{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"\",\"language\":\"lucene\"}}"
            }
        }
    }
]
