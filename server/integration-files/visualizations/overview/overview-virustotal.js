/*
 * Wazuh app - Module for Overview/VirusTotal visualizations
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
      "_id": "Wazuh-App-Overview-Virustotal-Last-Files-Pie",
      "_type": "visualization",
      "_source": {
        "title": "Last files",
        "visState": "{\"title\":\"Last files\",\"type\":\"pie\",\"params\":{\"type\":\"pie\",\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"isDonut\":true,\"labels\":{\"show\":false,\"values\":true,\"last_level\":true,\"truncate\":100}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{\"customLabel\":\"Files\"}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"data.virustotal.source.file\",\"size\":5,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
        "uiStateJSON": "{\"vis\":{\"legendOpen\":true}}",
        "description": "",
        "version": 1,
        "kibanaSavedObjectMeta": {
          "searchSourceJSON": "{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"\",\"language\":\"lucene\"}}"
        }
      }
    },
    {
        "_id": "Wazuh-App-Overview-Virustotal-Files-Table",
        "_type": "visualization",
        "_source": {
            "title": "Files",
            "visState": "{\"title\":\"Files\",\"type\":\"table\",\"params\":{\"perPage\":10,\"showPartialRows\":false,\"showMeticsAtAllLevels\":false,\"sort\":{\"columnIndex\":null,\"direction\":null},\"showTotal\":false,\"totalFunc\":\"sum\"},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{\"customLabel\":\"Count\"}},{\"id\":\"4\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"data.virustotal.source.file\",\"size\":10,\"order\":\"desc\",\"orderBy\":\"1\",\"customLabel\":\"File\"}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"data.virustotal.permalink\",\"size\":1,\"order\":\"desc\",\"orderBy\":\"1\",\"customLabel\":\"Link\"}}]}",
            "uiStateJSON": "{\"vis\":{\"params\":{\"sort\":{\"columnIndex\":null,\"direction\":null}}}}",
            "description": "",
            "version": 1,
            "kibanaSavedObjectMeta": {
                "searchSourceJSON": "{\"index\":\"wazuh-alerts\",\"filter\":[],\"query\":{\"query\":\"\",\"language\":\"lucene\"}}"
            }
        }
    },
    {
        "_id": "Wazuh-App-Overview-Virustotal-Total-Malicious",
        "_type": "visualization",
        "_source": {
            "title": "Total Malicious",
            "visState": "{\"title\":\"Total Malicious\",\"type\":\"metric\",\"params\":{\"addTooltip\":true,\"addLegend\":false,\"type\":\"metric\",\"metric\":{\"percentageMode\":false,\"useRanges\":false,\"colorSchema\":\"Green to Red\",\"metricColorMode\":\"None\",\"colorsRange\":[{\"from\":0,\"to\":10000}],\"labels\":{\"show\":true},\"invertColors\":false,\"style\":{\"bgFill\":\"#000\",\"bgColor\":false,\"labelColor\":false,\"subText\":\"\",\"fontSize\":20}}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{\"customLabel\":\"Total malicious files\"}}]}",
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
                              "key": "data.virustotal.malicious",
                              "value": "1",
                              "params": {
                                "query": "1",
                                "type": "phrase"
                              }
                            },
                            "query": {
                              "match": {
                                "data.virustotal.malicious": {
                                  "query": "1",
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
        }
    },
    {
        "_id": "Wazuh-App-Overview-Virustotal-Total-Positives",
        "_type": "visualization",
        "_source": {
            "title": "Total Positives",
            "visState": "{\"title\":\"Total Positives\",\"type\":\"metric\",\"params\":{\"addTooltip\":true,\"addLegend\":false,\"type\":\"metric\",\"metric\":{\"percentageMode\":false,\"useRanges\":false,\"colorSchema\":\"Green to Red\",\"metricColorMode\":\"None\",\"colorsRange\":[{\"from\":0,\"to\":10000}],\"labels\":{\"show\":true},\"invertColors\":false,\"style\":{\"bgFill\":\"#000\",\"bgColor\":false,\"labelColor\":false,\"subText\":\"\",\"fontSize\":20}}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{\"customLabel\":\"Total positive files\"}}]}",
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
                              "key": "data.virustotal.positives",
                              "value": "exists"
                            },
                            "exists": {
                              "field": "data.virustotal.positives"
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
                              "key": "data.virustotal.positives",
                              "value": "0",
                              "params": {
                                "query": 0,
                                "type": "phrase"
                              }
                            },
                            "query": {
                              "match": {
                                "data.virustotal.positives": {
                                  "query": 0,
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
        }
    },
    {
        "_id": "Wazuh-App-Overview-Virustotal-Malicious-Evolution",
        "_type": "visualization",
        "_source": {
            "title": "Malicious Evolution",
            "visState": "{\"title\":\"Malicious Evolution\",\"type\":\"histogram\",\"params\":{\"type\":\"histogram\",\"grid\":{\"categoryLines\":false,\"style\":{\"color\":\"#eee\"}},\"categoryAxes\":[{\"id\":\"CategoryAxis-1\",\"type\":\"category\",\"position\":\"bottom\",\"show\":true,\"style\":{},\"scale\":{\"type\":\"linear\"},\"labels\":{\"show\":true,\"truncate\":100},\"title\":{}}],\"valueAxes\":[{\"id\":\"ValueAxis-1\",\"name\":\"LeftAxis-1\",\"type\":\"value\",\"position\":\"left\",\"show\":true,\"style\":{},\"scale\":{\"type\":\"linear\",\"mode\":\"normal\"},\"labels\":{\"show\":true,\"rotate\":0,\"filter\":false,\"truncate\":100},\"title\":{\"text\":\"Malicious\"}}],\"seriesParams\":[{\"show\":\"true\",\"type\":\"histogram\",\"mode\":\"stacked\",\"data\":{\"label\":\"Malicious\",\"id\":\"1\"},\"valueAxis\":\"ValueAxis-1\",\"drawLinesBetweenPoints\":true,\"showCircles\":true}],\"addTooltip\":true,\"addLegend\":false,\"legendPosition\":\"right\",\"times\":[],\"addTimeMarker\":false},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{\"customLabel\":\"Malicious\"}},{\"id\":\"2\",\"enabled\":true,\"type\":\"date_histogram\",\"schema\":\"segment\",\"params\":{\"field\":\"@timestamp\",\"interval\":\"auto\",\"customInterval\":\"2h\",\"min_doc_count\":1,\"extended_bounds\":{}}}]}",
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
                              "key": "data.virustotal.malicious",
                              "value": "exists"
                            },
                            "exists": {
                              "field": "data.virustotal.malicious"
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
                              "key": "data.virustotal.malicious",
                              "value": "0",
                              "params": {
                                "query": 0,
                                "type": "phrase"
                              }
                            },
                            "query": {
                              "match": {
                                "data.virustotal.malicious": {
                                  "query": 0,
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
        }
    },
    {
        "_id": "Wazuh-App-Overview-Virustotal-Total",
        "_type": "visualization",
        "_source": {
            "title": "Total",
            "visState": "{\"title\":\"Total\",\"type\":\"metric\",\"params\":{\"addTooltip\":true,\"addLegend\":false,\"type\":\"metric\",\"metric\":{\"percentageMode\":false,\"useRanges\":false,\"colorSchema\":\"Green to Red\",\"metricColorMode\":\"None\",\"colorsRange\":[{\"from\":0,\"to\":10000}],\"labels\":{\"show\":true},\"invertColors\":false,\"style\":{\"bgFill\":\"#000\",\"bgColor\":false,\"labelColor\":false,\"subText\":\"\",\"fontSize\":20}}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{\"customLabel\":\"Total scans\"}}]}",
            "uiStateJSON": "{}",
            "description": "",
            "version": 1,
            "kibanaSavedObjectMeta": {
                "searchSourceJSON": `{
                    "index":"wazuh-alerts",
                    "filter":[{
                        "meta": {
                        "index": "wazuh-alerts",
                        "negate": false,
                        "disabled": false,
                        "alias": null,
                        "type": "exists",
                        "key": "data.virustotal",
                        "value": "exists"
                        },
                        "exists": {
                        "field": "data.virustotal"
                        },
                        "$state": {
                        "store": "appState"
                        }
                    }],
                    "query":{"query":"","language":"lucene"}
                }`
            }
        }
    },
    {
        "_id": "Wazuh-App-Overview-Virustotal-Malicious-Per-Agent-Table",
        "_type": "visualization",
        "_source": {
            "title": "Malicious Per Agent Table",
            "visState": "{\"title\":\"Malicious Per Agent Table\",\"type\":\"table\",\"params\":{\"perPage\":10,\"showPartialRows\":false,\"showMeticsAtAllLevels\":false,\"sort\":{\"columnIndex\":null,\"direction\":null},\"showTotal\":false,\"totalFunc\":\"sum\"},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"cardinality\",\"schema\":\"metric\",\"params\":{\"field\":\"data.virustotal.source.md5\",\"customLabel\":\"Malicious detected files\"}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"bucket\",\"params\":{\"field\":\"agent.name\",\"size\":16,\"order\":\"desc\",\"orderBy\":\"1\",\"customLabel\":\"Agent\"}}]}",
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
                              "negate": true,
                              "disabled": false,
                              "alias": null,
                              "type": "phrase",
                              "key": "data.virustotal.malicious",
                              "value": "0",
                              "params": {
                                "query": "0",
                                "type": "phrase"
                              }
                            },
                            "query": {
                              "match": {
                                "data.virustotal.malicious": {
                                  "query": "0",
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
        }
    },
    {
        "_id": "Wazuh-App-Overview-Virustotal-Malicious-Per-Agent",
        "_type": "visualization",
        "_source": {
            "title": "Malicious Per Agent",
            "visState": "{\"title\":\"Malicious Per Agent\",\"type\":\"pie\",\"params\":{\"type\":\"pie\",\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"isDonut\":true,\"labels\":{\"show\":false,\"values\":true,\"last_level\":true,\"truncate\":100}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"cardinality\",\"schema\":\"metric\",\"params\":{\"field\":\"data.virustotal.source.md5\"}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"agent.name\",\"size\":1,\"order\":\"desc\",\"orderBy\":\"1\"}}]}",
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
                              "key": "data.virustotal.malicious",
                              "value": "0",
                              "params": {
                                "query": "0",
                                "type": "phrase"
                              }
                            },
                            "query": {
                              "match": {
                                "data.virustotal.malicious": {
                                  "query": "0",
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
        }
    },
    {
        "_id": "Wazuh-App-Overview-Virustotal-Positives-Heatmap",
        "_type": "visualization",
        "_source": {
            "title": "Positives Heatmap",
            "visState": "{\"title\":\"Positives Heatmap\",\"type\":\"heatmap\",\"params\":{\"type\":\"heatmap\",\"addTooltip\":true,\"addLegend\":true,\"enableHover\":false,\"legendPosition\":\"right\",\"times\":[],\"colorsNumber\":7,\"colorSchema\":\"Blues\",\"setColorRange\":false,\"colorsRange\":[],\"invertColors\":false,\"percentageMode\":false,\"valueAxes\":[{\"show\":false,\"id\":\"ValueAxis-1\",\"type\":\"value\",\"scale\":{\"type\":\"linear\",\"defaultYExtents\":false},\"labels\":{\"show\":false,\"rotate\":0,\"color\":\"#555\"}}]},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{\"customLabel\":\"Positives\"}},{\"id\":\"3\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"agent.name\",\"size\":10,\"order\":\"desc\",\"orderBy\":\"1\",\"customLabel\":\"Agent\"}},{\"id\":\"4\",\"enabled\":true,\"type\":\"date_histogram\",\"schema\":\"group\",\"params\":{\"field\":\"@timestamp\",\"interval\":\"auto\",\"customInterval\":\"2h\",\"min_doc_count\":1,\"extended_bounds\":{},\"customLabel\":\"Date\"}}]}",
            "uiStateJSON": "{\"vis\":{\"defaultColors\":{\"0 - 7\":\"rgb(247,251,255)\",\"7 - 13\":\"rgb(219,233,246)\",\"13 - 20\":\"rgb(187,214,235)\",\"20 - 26\":\"rgb(137,190,220)\",\"26 - 33\":\"rgb(83,158,205)\",\"33 - 39\":\"rgb(42,123,186)\",\"39 - 45\":\"rgb(11,85,159)\"},\"legendOpen\":true}}",
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
                              "key": "data.virustotal.positives",
                              "value": "exists"
                            },
                            "exists": {
                              "field": "data.virustotal.positives"
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
                              "key": "data.virustotal.positives",
                              "value": "0",
                              "params": {
                                "query": 0,
                                "type": "phrase"
                              }
                            },
                            "query": {
                              "match": {
                                "data.virustotal.positives": {
                                  "query": 0,
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
        }
    }
]
