/*
 * Wazuh app - Module for Overview/Vulnerabilities visualizations
 * Copyright (C) 2015-2019 Wazuh, Inc.
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
    _id: 'Wazuh-App-Overview-vulnerability-Alerts-severity',
    _type: 'visualization',
    _source: {
      title: 'Severity count',
      visState:
        '{"title":"Severity count","type":"metrics","params":{"id":"61ca57f0-469d-11e7-af02-69e470af7417","type":"timeseries","series":[{"id":"61ca57f1-469d-11e7-af02-69e470af7417","color":"rgba(0,156,224,1)","split_mode":"terms","metrics":[{"id":"61ca57f2-469d-11e7-af02-69e470af7417","type":"count"}],"separate_axis":0,"axis_position":"right","formatter":"number","chart_type":"line","line_width":1,"point_size":1,"fill":0.5,"stacked":"none","terms_field":"data.vulnerability.severity","terms_size":"5","terms_order_by":"_count","label":"Alerts"}],"time_field":"@timestamp","index_pattern":"wazuh-alerts","interval":"auto","axis_position":"left","axis_formatter":"number","axis_scale":"normal","show_legend":1,"show_grid":1,"gauge_color_rules":[{"id":"414efe60-3753-11e9-8d90-91d4615ec8c6"}],"gauge_width":10,"gauge_inner_width":10,"gauge_style":"half","bar_color_rules":[{"value":0,"id":"4220f460-3753-11e9-8d90-91d4615ec8c6","bar_color":null}],"drilldown_url":"","filter":"","background_color":null,"background_color_rules":[{"id":"74c34bc0-3753-11e9-8d90-91d4615ec8c6"}]},"aggs":[]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","filter":[],"query":{"query":"","language":"lucene"}}'
      }
    }
  },
  {
    _id: 'Wazuh-App-Overview-vulnerability-Alert-summary',
    _type: 'visualization',
    _source: {
      title: 'Alert summary',
      visState:
        '{"title":"vulnerability","type":"table","params":{"perPage":10,"showPartialRows":false,"showMetricsAtAllLevels":false,"sort":{"columnIndex":null,"direction":null},"showTotal":false,"totalFunc":"sum"},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"terms","schema":"bucket","params":{"field":"data.vulnerability.severity","size":5,"order":"asc","orderBy":"_key","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing","customLabel":"Severity"}},{"id":"3","enabled":true,"type":"terms","schema":"bucket","params":{"field":"data.vulnerability.title","size":5,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing","customLabel":"Title"}},{"id":"4","enabled":true,"type":"terms","schema":"bucket","params":{"field":"data.vulnerability.reference","size":5,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing","customLabel":"Reference"}},{"id":"5","enabled":true,"type":"terms","schema":"bucket","params":{"field":"data.vulnerability.cve","size":1,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing","customLabel":"CVE"}}]}',
      uiStateJSON:
        '{"vis":{"params":{"sort":{"columnIndex":0,"direction":null}}}}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","filter":[],"query":{"query":"","language":"lucene"}}'
      }
    }
  },
  {
    _id: 'Wazuh-App-Overview-vulnerability-Commonly-affected-packages',
    _type: 'visualization',
    _source: {
      title: 'Commonly affected packages',
      visState:
        '{"title":"Commonly affected packages","type":"pie","params":{"type":"pie","addTooltip":true,"addLegend":true,"legendPosition":"right","isDonut":true,"labels":{"show":false,"values":true,"last_level":true,"truncate":100}},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"terms","schema":"segment","params":{"field":"data.vulnerability.package.name","size":5,"order":"desc","orderBy":"1","customLabel":"Affected package"}}]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","filter":[],"query":{"query":"","language":"lucene"}}'
      }
    }
  },
  {
    _id: 'Wazuh-App-Overview-vulnerability-Most-common-CVEs',
    _type: 'visualization',
    _source: {
      title: 'Most common CVEs',
      visState:
        '{"title":"Most common CVEs","type":"pie","params":{"type":"pie","addTooltip":true,"addLegend":true,"legendPosition":"right","isDonut":true,"labels":{"show":false,"values":true,"last_level":true,"truncate":100}},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"terms","schema":"segment","params":{"field":"data.vulnerability.cve","size":5,"order":"desc","orderBy":"1","customLabel":"Severity"}}]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","filter":[],"query":{"query":"","language":"lucene"}}'
      }
    }
  },
  {
    _id: 'Wazuh-App-Overview-vulnerability-Most-common-CWEs',
    _type: 'visualization',
    _source: {
      title: 'Most common CWEs',
      visState:
        '{"title":"Most common CWEs","type":"pie","params":{"type":"pie","addTooltip":true,"addLegend":true,"legendPosition":"right","isDonut":true,"labels":{"show":false,"values":true,"last_level":true,"truncate":100}},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"terms","schema":"segment","params":{"field":"data.vulnerability.cwe_reference","size":5,"order":"desc","orderBy":"1","customLabel":"Severity"}}]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","filter":[],"query":{"query":"","language":"lucene"}}'
      }
    }
  },
  {
    _id: 'Wazuh-App-Overview-vulnerability-Metric-Critical-severity',
    _type: 'visualization',
    _source: {
      title: 'Metric Critical severity',
      visState:
        '{"title":"Metric Critical severity","type":"metric","params":{"addTooltip":true,"addLegend":false,"type":"metric","metric":{"percentageMode":false,"useRanges":false,"colorSchema":"Green to Red","metricColorMode":"None","colorsRange":[{"from":0,"to":10000}],"labels":{"show":true},"invertColors":false,"style":{"bgFill":"#000","bgColor":false,"labelColor":false,"subText":"","fontSize":20}}},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{"customLabel":"Critical severity alerts"}}]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON: `{
                    "index":"wazuh-alerts",
                    "filter":[
                        {
                            "meta": {
                              "index": "wazuh-alerts",
                              "negate": false,
                              "disabled": false,
                              "alias": null,
                              "type": "phrase",
                              "key": "data.vulnerability.severity",
                              "value": "Critical",
                              "params": {
                                "query": "Critical",
                                "type": "phrase"
                              }
                            },
                            "query": {
                              "match": {
                                "data.vulnerability.severity": {
                                  "query": "Critical",
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
    _id: 'Wazuh-App-Overview-vulnerability-Metric-High-severity',
    _type: 'visualization',
    _source: {
      title: 'Metric High severity',
      visState:
        '{"title":"Metric High severity","type":"metric","params":{"addTooltip":true,"addLegend":false,"type":"metric","metric":{"percentageMode":false,"useRanges":false,"colorSchema":"Green to Red","metricColorMode":"None","colorsRange":[{"from":0,"to":10000}],"labels":{"show":true},"invertColors":false,"style":{"bgFill":"#000","bgColor":false,"labelColor":false,"subText":"","fontSize":20}}},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{"customLabel":"High severity alerts"}}]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON: `{
                    "index":"wazuh-alerts",
                    "filter":[
                        {
                            "meta": {
                              "index": "wazuh-alerts",
                              "negate": false,
                              "disabled": false,
                              "alias": null,
                              "type": "phrase",
                              "key": "data.vulnerability.severity",
                              "value": "High",
                              "params": {
                                "query": "High",
                                "type": "phrase"
                              }
                            },
                            "query": {
                              "match": {
                                "data.vulnerability.severity": {
                                  "query": "High",
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
    _id: 'Wazuh-App-Overview-vulnerability-Metric-Medium-severity',
    _type: 'visualization',
    _source: {
      title: 'Metric Medium severity',
      visState:
        '{"title":"Metric Medium severity","type":"metric","params":{"addTooltip":true,"addLegend":false,"type":"metric","metric":{"percentageMode":false,"useRanges":false,"colorSchema":"Green to Red","metricColorMode":"None","colorsRange":[{"from":0,"to":10000}],"labels":{"show":true},"invertColors":false,"style":{"bgFill":"#000","bgColor":false,"labelColor":false,"subText":"","fontSize":20}}},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{"customLabel":"Medium severity alerts"}}]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON: `{
                    "index":"wazuh-alerts",
                    "filter":[
                        {
                            "meta": {
                              "index": "wazuh-alerts",
                              "negate": false,
                              "disabled": false,
                              "alias": null,
                              "type": "phrase",
                              "key": "data.vulnerability.severity",
                              "value": "Medium",
                              "params": {
                                "query": "Medium",
                                "type": "phrase"
                              }
                            },
                            "query": {
                              "match": {
                                "data.vulnerability.severity": {
                                  "query": "Medium",
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
    _id: 'Wazuh-App-Overview-vulnerability-Metric-Low-severity',
    _type: 'visualization',
    _source: {
      title: 'Metric Low severity',
      visState:
        '{"title":"Metric Low severity","type":"metric","params":{"addTooltip":true,"addLegend":false,"type":"metric","metric":{"percentageMode":false,"useRanges":false,"colorSchema":"Green to Red","metricColorMode":"None","colorsRange":[{"from":0,"to":10000}],"labels":{"show":true},"invertColors":false,"style":{"bgFill":"#000","bgColor":false,"labelColor":false,"subText":"","fontSize":20}}},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{"customLabel":"Low severity alerts"}}]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON: `{
                    "index":"wazuh-alerts",
                    "filter":[
                        {
                            "meta": {
                              "index": "wazuh-alerts",
                              "negate": false,
                              "disabled": false,
                              "alias": null,
                              "type": "phrase",
                              "key": "data.vulnerability.severity",
                              "value": "Low",
                              "params": {
                                "query": "Low",
                                "type": "phrase"
                              }
                            },
                            "query": {
                              "match": {
                                "data.vulnerability.severity": {
                                  "query": "Low",
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
    _id: 'Wazuh-App-Overview-vulnerability-Most-affected-agents',
    _type: 'visualization',
    _source: {
      title: 'Most affected agents',
      visState:
        '{"title":"Most affected agents","type":"pie","params":{"type":"pie","addTooltip":true,"addLegend":true,"legendPosition":"right","isDonut":true,"labels":{"show":false,"values":true,"last_level":true,"truncate":100}},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"terms","schema":"segment","params":{"field":"agent.name","size":5,"order":"desc","orderBy":"1","customLabel":"Affected agent"}}]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","filter":[],"query":{"query":"","language":"lucene"}}'
      }
    }
  },
  {
    _id: 'Wazuh-App-Overview-vulnerability-Vulnerability-severity-distribution',
    _type: 'visualization',
    _source: {
      title: 'Severity distribution',
      visState:
        '{"title":"Severity distribution","type":"pie","params":{"type":"pie","addTooltip":true,"addLegend":true,"legendPosition":"right","isDonut":true,"labels":{"show":false,"values":true,"last_level":true,"truncate":100}},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"terms","schema":"segment","params":{"field":"data.vulnerability.severity","size":5,"order":"desc","orderBy":"1","customLabel":"Severity"}}]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","filter":[],"query":{"query":"","language":"lucene"}}'
      }
    }
  }
];
