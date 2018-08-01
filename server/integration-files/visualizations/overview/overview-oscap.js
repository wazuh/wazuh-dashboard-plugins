/*
 * Wazuh app - Module for Overview/OSCAP visualizations
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
		"_id": "Wazuh-App-Overview-OSCAP-Last-score",
		"_source": {
			"title": "Last score",
			"visState":
				"{\"title\":\"Last score\",\"type\":\"table\",\"params\":{\"perPage\":10,\"showPartialRows\":false,\"showMeticsAtAllLevels\":false,\"sort\":{\"columnIndex\":null,\"direction\":null},\"showTotal\":false,\"totalFunc\":\"sum\"},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"max\",\"schema\":\"metric\",\"params\":{\"field\":\"@timestamp\"}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"data.oscap.scan.score\",\"size\":1,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
			"uiStateJSON": "{\"vis\":{\"params\":{\"sort\":{\"columnIndex\":null,\"direction\":null}}}}",
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
        "_id": "Wazuh-App-Overview-OSCAP-Last-agent-scanned",
        "_source": {
            "title": "Last agent scanned",
            "visState": "{\"title\":\"Last agent scanned\",\"type\":\"table\",\"params\":{\"perPage\":10,\"showPartialRows\":false,\"showMeticsAtAllLevels\":false,\"sort\":{\"columnIndex\":null,\"direction\":null},\"showTotal\":false,\"totalFunc\":\"sum\"},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"max\",\"schema\":\"metric\",\"params\":{\"field\":\"@timestamp\"}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"agent.name\",\"size\":1,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
            "uiStateJSON": "{\"vis\":{\"params\":{\"sort\":{\"columnIndex\":null,\"direction\":null}}}}",
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
                              "key": "data.oscap.check.result",
                              "value": "fail",
                              "params": {
                                "query": "fail",
                                "type": "phrase"
                              }
                            },
                            "query": {
                              "match": {
                                "data.oscap.check.result": {
                                  "query": "fail",
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
        "_id": "Wazuh-App-Overview-OSCAP-Last-scan-profile",
        "_source": {
            "title": "Last scan profile",
            "visState": "{\"title\":\"Last scan profile\",\"type\":\"table\",\"params\":{\"perPage\":10,\"showPartialRows\":false,\"showMeticsAtAllLevels\":false,\"sort\":{\"columnIndex\":null,\"direction\":null},\"showTotal\":false,\"totalFunc\":\"sum\"},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"max\",\"schema\":\"metric\",\"params\":{\"field\":\"@timestamp\"}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"data.oscap.scan.profile.title\",\"size\":1,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
            "uiStateJSON": "{\"vis\":{\"params\":{\"sort\":{\"columnIndex\":null,\"direction\":null}}}}",
            "description": "",
            "version": 1,
            "kibanaSavedObjectMeta": {
                "searchSourceJSON": "{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"\",\"language\":\"lucene\"}}"
            }
        },
        "_type": "visualization"
    },
    {
        "_id": "Wazuh-App-Overview-OSCAP-Agents",
        "_source": {
            "title": "Agents",
            "visState": "{\"params\": {\"isDonut\": false, \"shareYAxis\": true, \"addTooltip\": true, \"addLegend\": true}, \"listeners\": {}, \"type\": \"pie\", \"aggs\": [{\"type\": \"count\", \"enabled\": true, \"id\": \"1\", \"params\": {}, \"schema\": \"metric\"}, {\"type\": \"terms\", \"enabled\": true, \"id\": \"2\", \"params\": {\"orderBy\": \"1\", \"field\": \"agent.name\", \"order\": \"desc\", \"size\": 5}, \"schema\": \"segment\"}], \"title\": \"Agents\"}",
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
                              "negate": true,
                              "disabled": false,
                              "alias": null,
                              "type": "phrase",
                              "key": "rule.groups",
                              "value": "syslog",
                              "params": {
                                "query": "syslog",
                                "type": "phrase"
                              }
                            },
                            "query": {
                              "match": {
                                "rule.groups": {
                                  "query": "syslog",
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
        "_id": "Wazuh-App-Overview-OSCAP-Profiles",
        "_source": {
            "title": "Profiles",
            "visState": "{\"params\": {\"isDonut\": false, \"legendPosition\": \"right\", \"shareYAxis\": true, \"addTooltip\": true, \"addLegend\": true}, \"listeners\": {}, \"type\": \"pie\", \"aggs\": [{\"type\": \"count\", \"enabled\": true, \"id\": \"1\", \"params\": {}, \"schema\": \"metric\"}, {\"type\": \"terms\", \"enabled\": true, \"id\": \"3\", \"params\": {\"orderBy\": \"1\", \"field\": \"data.oscap.scan.profile.title\", \"order\": \"desc\", \"size\": 5}, \"schema\": \"segment\"}], \"title\": \"Profiles\"}",
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
                              "negate": true,
                              "disabled": false,
                              "alias": null,
                              "type": "phrase",
                              "key": "rule.groups",
                              "value": "syslog",
                              "params": {
                                "query": "syslog",
                                "type": "phrase"
                              }
                            },
                            "query": {
                              "match": {
                                "rule.groups": {
                                  "query": "syslog",
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
        "_id": "Wazuh-App-Overview-OSCAP-Content",
        "_source": {
            "title": "Content",
            "visState": "{\"params\": {\"isDonut\": false, \"legendPosition\": \"right\", \"shareYAxis\": true, \"addTooltip\": true, \"addLegend\": true}, \"listeners\": {}, \"type\": \"pie\", \"aggs\": [{\"type\": \"count\", \"enabled\": true, \"id\": \"1\", \"params\": {}, \"schema\": \"metric\"}, {\"type\": \"terms\", \"enabled\": true, \"id\": \"2\", \"params\": {\"orderBy\": \"1\", \"field\": \"data.oscap.scan.content\", \"order\": \"desc\", \"size\": 5}, \"schema\": \"segment\"}], \"title\": \"Content\"}",
            "uiStateJSON": "{}",
            "version": 1,
            "description": "",
            "kibanaSavedObjectMeta": {
                "searchSourceJSON": `{
                    "index":"wazuh-alerts",
                    "filter":[
                        {
                            "meta": {
                              "index": "wazuh-alerts",
                              "negate": true,
                              "disabled": false,
                              "alias": null,
                              "type": "phrase",
                              "key": "rule.groups",
                              "value": "syslog",
                              "params": {
                                "query": "syslog",
                                "type": "phrase"
                              }
                            },
                            "query": {
                              "match": {
                                "rule.groups": {
                                  "query": "syslog",
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
        "_id": "Wazuh-App-Overview-OSCAP-Severity",
        "_source": {
            "title": "Severity",
            "visState": "{\"title\":\"Severity\",\"type\":\"pie\",\"params\":{\"type\":\"pie\",\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"isDonut\":true},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"data.oscap.check.severity\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
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
                              "key": "data.oscap.check.result",
                              "value": "fail",
                              "params": {
                                "query": "fail",
                                "type": "phrase"
                              }
                            },
                            "query": {
                              "match": {
                                "data.oscap.check.result": {
                                  "query": "fail",
                                  "type": "phrase"
                                }
                              }
                            },
                            "$state": {
                              "store": "appState"
                            }
                          },
                          {
                            "meta": {
                              "index": "wazuh-alerts",
                              "negate": true,
                              "disabled": false,
                              "alias": null,
                              "type": "phrase",
                              "key": "rule.groups",
                              "value": "syslog",
                              "params": {
                                "query": "syslog",
                                "type": "phrase"
                              }
                            },
                            "query": {
                              "match": {
                                "rule.groups": {
                                  "query": "syslog",
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
        "_id": "Wazuh-App-Overview-OSCAP-Top-5-agents-Severity-high",
        "_source": {
            "title": "Top 5 agents - Severity high",
            "visState": "{\"title\":\"Top 5 Agents - Severity high\",\"type\":\"histogram\",\"params\":{\"type\":\"histogram\",\"grid\":{\"categoryLines\":false,\"style\":{\"color\":\"#eee\"}},\"categoryAxes\":[{\"id\":\"CategoryAxis-1\",\"type\":\"category\",\"position\":\"bottom\",\"show\":true,\"style\":{},\"scale\":{\"type\":\"linear\"},\"labels\":{\"show\":true,\"truncate\":25,\"rotate\":0},\"title\":{}}],\"valueAxes\":[{\"id\":\"ValueAxis-1\",\"name\":\"LeftAxis-1\",\"type\":\"value\",\"position\":\"left\",\"show\":true,\"style\":{},\"scale\":{\"type\":\"linear\",\"mode\":\"normal\"},\"labels\":{\"show\":true,\"rotate\":0,\"filter\":false,\"truncate\":100},\"title\":{\"text\":\"Count\"}}],\"seriesParams\":[{\"show\":\"true\",\"type\":\"histogram\",\"mode\":\"stacked\",\"data\":{\"label\":\"Count\",\"id\":\"1\"},\"valueAxis\":\"ValueAxis-1\",\"drawLinesBetweenPoints\":true,\"showCircles\":true}],\"addTooltip\":true,\"addLegend\":false,\"legendPosition\":\"right\",\"times\":[],\"addTimeMarker\":false},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"agent.name\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
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
                              "key": "data.oscap.check.severity",
                              "value": "high",
                              "params": {
                                "query": "high",
                                "type": "phrase"
                              }
                            },
                            "query": {
                              "match": {
                                "data.oscap.check.severity": {
                                  "query": "high",
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
        "_id": "Wazuh-App-Overview-OSCAP-Top-10-alerts",
        "_source": {
            "title": "Top 10 alerts",
            "visState": "{\"title\":\"Wazuh App OSCAP Top 10 alerts\",\"type\":\"pie\",\"params\":{\"type\":\"pie\",\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"isDonut\":true},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"data.oscap.check.title\",\"size\":10,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
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
                              "key": "data.oscap.check.result",
                              "value": "fail",
                              "params": {
                                "query": "fail",
                                "type": "phrase"
                              }
                            },
                            "query": {
                              "match": {
                                "data.oscap.check.result": {
                                  "query": "fail",
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
        "_id": "Wazuh-App-Overview-OSCAP-Top-10-high-risk-alerts",
        "_source": {
            "title": "Top 10 high risk alerts",
            "visState": "{\"title\":\"Wazuh App OSCAP Top 10 high risk alerts\",\"type\":\"pie\",\"params\":{\"type\":\"pie\",\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"isDonut\":true},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"data.oscap.check.title\",\"size\":10,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
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
                              "key": "data.oscap.check.result",
                              "value": "fail",
                              "params": {
                                "query": "fail",
                                "type": "phrase"
                              }
                            },
                            "query": {
                              "match": {
                                "data.oscap.check.result": {
                                  "query": "fail",
                                  "type": "phrase"
                                }
                              }
                            },
                            "$state": {
                              "store": "appState"
                            }
                        },
                        {
                            "meta": {
                              "index": "wazuh-alerts",
                              "negate": false,
                              "disabled": false,
                              "alias": null,
                              "type": "phrase",
                              "key": "data.oscap.check.severity",
                              "value": "high",
                              "params": {
                                "query": "high",
                                "type": "phrase"
                              }
                            },
                            "query": {
                              "match": {
                                "data.oscap.check.severity": {
                                  "query": "high",
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
        "_id": "Wazuh-App-Overview-OSCAP-Highest-score",
        "_source": {
            "title": "Highest score",
            "visState": "{\"title\":\"Highest score\",\"type\":\"table\",\"params\":{\"perPage\":10,\"showPartialRows\":false,\"showMeticsAtAllLevels\":false,\"sort\":{\"columnIndex\":null,\"direction\":null},\"showTotal\":false,\"totalFunc\":\"sum\"},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"max\",\"schema\":\"metric\",\"params\":{\"field\":\"data.oscap.scan.score\"}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"data.oscap.scan.score\",\"size\":1,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
            "uiStateJSON": "{\"vis\":{\"params\":{\"sort\":{\"columnIndex\":0,\"direction\":null}}}}",
            "description": "",
            "version": 1,
            "kibanaSavedObjectMeta": {
                "searchSourceJSON": "{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"\",\"language\":\"lucene\"}}"
            }
        },
        "_type": "visualization"
    },
    {
        "_id": "Wazuh-App-Overview-OSCAP-Lowest-score",
        "_source": {
            "title": "Lowest score",
            "visState": "{\"title\":\"Lowest score\",\"type\":\"table\",\"params\":{\"perPage\":10,\"showPartialRows\":false,\"showMeticsAtAllLevels\":false,\"sort\":{\"columnIndex\":null,\"direction\":null},\"showTotal\":false,\"totalFunc\":\"sum\"},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"min\",\"schema\":\"metric\",\"params\":{\"field\":\"data.oscap.scan.score\"}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"data.oscap.scan.score\",\"size\":1,\"order\":\"asc\",\"orderBy\":\"1\"}}]}",
            "uiStateJSON": "{\"vis\":{\"params\":{\"sort\":{\"columnIndex\":null,\"direction\":null}}}}",
            "description": "",
            "version": 1,
            "kibanaSavedObjectMeta": {
                "searchSourceJSON": "{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"\",\"language\":\"lucene\"}}"
            }
        },
        "_type": "visualization"
    },
    {
        "_id": "Wazuh-App-Overview-OSCAP-Latest-alert",
        "_source": {
            "title": "Latest alert",
            "visState": "{\"title\":\"Latest alert\",\"type\":\"table\",\"params\":{\"perPage\":10,\"showPartialRows\":false,\"showMeticsAtAllLevels\":false,\"sort\":{\"columnIndex\":null,\"direction\":null},\"showTotal\":false,\"totalFunc\":\"sum\"},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"max\",\"schema\":\"metric\",\"params\":{\"field\":\"@timestamp\"}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"data.oscap.check.title\",\"size\":1,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
            "uiStateJSON": "{\"vis\":{\"params\":{\"sort\":{\"columnIndex\":null,\"direction\":null}}}}",
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
                              "key": "data.oscap.check.result",
                              "value": "fail",
                              "params": {
                                "query": "fail",
                                "type": "phrase"
                              }
                            },
                            "query": {
                              "match": {
                                "data.oscap.check.result": {
                                  "query": "fail",
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
        "_id": "Wazuh-App-Overview-OSCAP-Last-alerts",
        "_type": "visualization",
        "_source": {
            "title": "Last alerts",
            "visState": "{\"title\":\"Last alerts\",\"type\":\"table\",\"params\":{\"perPage\":10,\"showPartialRows\":false,\"showMeticsAtAllLevels\":false,\"sort\":{\"columnIndex\":null,\"direction\":null},\"showTotal\":false,\"totalFunc\":\"sum\"},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"agent.name\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"size\":40,\"order\":\"desc\",\"orderBy\":\"1\",\"customLabel\":\"Agent\"}},{\"id\":\"3\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"data.oscap.check.title\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\",\"customLabel\":\"Title\"}},{\"id\":\"4\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"data.oscap.scan.profile.title\",\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\",\"customLabel\":\"Profile\"}}]}",
            "description": "",
            "version": 1,
            "kibanaSavedObjectMeta": {
                "searchSourceJSON": "{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"\",\"language\":\"lucene\"}}"
            }
        }
    }
]
