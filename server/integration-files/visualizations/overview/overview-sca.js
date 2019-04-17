/*
 * Wazuh app - Module for Overview/CA visualizations
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
    _id: 'Wazuh-App-Overview-SCA-Score-by-Policy',
    _type: 'visualization',
    _source: {
      title: 'Score by policy',
      visState:
        '{"title":"Score by policy","type":"gauge","params":{"type":"gauge","addTooltip":true,"addLegend":false,"isDisplayWarning":false,"gauge":{"verticalSplit":false,"extendRange":false,"percentageMode":true,"gaugeType":"Circle","gaugeStyle":"Full","backStyle":"Full","orientation":"vertical","colorSchema":"Green to Red","gaugeColorMode":"Labels","colorsRange":[{"from":0,"to":40},{"from":40,"to":70},{"from":70,"to":100}],"invertColors":true,"labels":{"show":true,"color":"black"},"scale":{"show":false,"labels":false,"color":"#333"},"type":"meter","style":{"bgWidth":0.9,"width":0.9,"mask":false,"bgMask":false,"maskBars":50,"bgFill":"#eee","bgColor":false,"subText":"","fontSize":60,"labelColor":false},"minAngle":0,"maxAngle":6.283185307179586}},"aggs":[{"id":"1","enabled":true,"type":"avg","schema":"metric","params":{"field":"data.sca.score","customLabel":"Scores by policy"}},{"id":"2","enabled":true,"type":"terms","schema":"group","params":{"field":"data.sca.policy_id","size":5,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"}}]}',
      uiStateJSON:
        '{"vis":{"defaultColors":{"0 - 40":"rgb(165,0,38)","40 - 70":"rgb(255,255,190)","70 - 100":"rgb(0,104,55)"}}}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","query":{"query":"","language":"lucene"},"filter":[]}'
      }
    }
  },
  {
    _id: 'Wazuh-App-Overview-SCA-Overall-score',
    _type: 'visualization',
    _source: {
      title: 'Overall score',
      visState:
        '{"title":"Overall score","type":"metric","params":{"addTooltip":true,"addLegend":false,"type":"metric","metric":{"percentageMode":true,"useRanges":false,"colorSchema":"Green to Red","metricColorMode":"None","colorsRange":[{"from":0,"to":100}],"labels":{"show":true},"invertColors":false,"style":{"bgFill":"#000","bgColor":false,"labelColor":false,"subText":"","fontSize":60}}},"aggs":[{"id":"1","enabled":true,"type":"avg","schema":"metric","params":{"field":"data.sca.score","customLabel":"Overall score"}}]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","query":{"query":"","language":"lucene"},"filter":[]}'
      }
    }
  },
  {
    _id: 'Wazuh-App-Overview-SCA-Top-5-failed-checks',
    _type: 'visualization',
    _source: {
      title: 'Top 5 failed checks',
      visState:
        '{"title": "TOP5FAILED","type": "pie","params": {  "type": "pie",  "addTooltip": true,  "addLegend": true,  "legendPosition": "right",  "isDonut": true,  "labels": {    "show": false,    "values": true,    "last_level": true,    "truncate": 100  }},"aggs": [  {    "id": "1",    "enabled": true,    "type": "count",    "schema": "metric",    "params": {}  },  {    "id": "2",    "enabled": true,    "type": "terms",    "schema": "segment",    "params": {      "field": "data.sca.check.title",      "size": 5,      "order": "desc",      "orderBy": "1",      "otherBucket": false,      "otherBucketLabel": "Other",      "missingBucket": false,      "missingBucketLabel": "Missing"    }  }]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index": "wazuh-alerts","query": {  "query": "", "language": "lucene"},"filter": [  {"meta": {"index": "wazuh-alerts-3.x-*","negate": false,"disabled": false,      "alias": null,      "type": "phrase",      "key": "data.sca.check.result",      "value": "failed",      "params": {        "query": "failed",        "type": "phrase"      }    },    "query": {      "match": {        "data.sca.check.result": {          "query": "failed",          "type": "phrase"        }      }    },    "$state": {      "store": "appState"    }  }]}'
      }
    }
  },
  {
    _id: 'Wazuh-App-Overview-SCA-Top-5-passed-checks',
    _type: 'visualization',
    _source: {
      title: 'Top 5 passed checks',
      visState:
        '{"title":"Top 5 passed checks","type":"pie","params":{"type":"pie","addTooltip":true,"addLegend":true,"legendPosition":"right","isDonut":true,"labels":{"show":false,"values":true,"last_level":true,"truncate":100}},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"terms","schema":"segment","params":{"field":"data.sca.check.title","size":5,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"}}]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","query":{"query":"","language":"lucene"},"filter":[{"meta":{"index":"wazuh-alerts-3.x-*","negate":false,"disabled":false,"alias":null,"type":"phrase","key":"data.sca.check.result","value":"passed","params":{"query":"passed","type":"phrase"}},"query":{"match":{"data.sca.check.result":{"query":"passed","type":"phrase"}}},"$state":{"store":"appState"}}]}'
      }
    }
  },
  {
    _id: 'Wazuh-App-Overview-SCA-Result-distribution-by-policy',
    _type: 'visualization',
    _source: {
      title: 'Result distribution by policy',
      visState:
        '{"title": "New Visualization","type": "horizontal_bar","params": {  "type": "histogram",  "grid": {    "categoryLines": false,    "style": {      "color": "#eee"    }  },  "categoryAxes": [    {      "id": "CategoryAxis-1",      "type": "category",      "position": "left",      "show": false,      "style": {},      "scale": {        "type": "linear"      },      "labels": {        "show": true,        "rotate": 0,        "filter": false,        "truncate": 200      },      "title": {}    }  ],  "valueAxes": [    {      "id": "ValueAxis-1",      "name": "LeftAxis-1",      "type": "value",      "position": "bottom",      "show": true,      "style": {},      "scale": {        "type": "linear",        "mode": "normal"      },      "labels": {        "show": true,        "rotate": 75,        "filter": true,        "truncate": 100      },      "title": {        "text": "Count"      }    }  ],  "seriesParams": [    {      "show": true,      "type": "histogram",      "mode": "stacked",      "data": {        "label": "Count",        "id": "1"      },      "valueAxis": "ValueAxis-1",      "drawLinesBetweenPoints": true,      "showCircles": true    }  ],  "addTooltip": true,  "addLegend": true,  "legendPosition": "right",  "times": [],  "addTimeMarker": false},"aggs": [  {    "id": "1",    "enabled": true,    "type": "count",    "schema": "metric",    "params": {}  },  {    "id": "2",    "enabled": true,    "type": "terms",    "schema": "group",    "params": {      "field": "data.sca.check.result",      "size": 5,      "order": "desc",      "orderBy": "1",      "otherBucket": false,      "otherBucketLabel": "Other",      "missingBucket": false,      "missingBucketLabel": "Missing"    }  },  {    "id": "3",    "enabled": true,    "type": "terms",    "schema": "split",    "params": {      "field": "data.sca.policy",      "size": 5,      "order": "desc",      "orderBy": "1",      "otherBucket": false,      "otherBucketLabel": "Other",      "missingBucket": false,      "missingBucketLabel": "Missing",      "row": true    }  }]}',
      uiStateJSON:
        '{"vis": {  "colors": {"failed": "#BF1B00","passed": "#508642"  }}}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index": "wazuh-alerts","query": {  "query": "",  "language": "lucene"},"filter": []}'
      }
    }
  },
  {
    _id: 'Wazuh-App-Overview-CA-Checks-over-time',
    _source: {
      title: 'Checks over time',
      visState:
        '{"title":"Checks over time","type":"line","params":{"type":"line","grid":{"categoryLines":true,"style":{"color":"#eee"},"valueAxis":"ValueAxis-1"},"categoryAxes":[{"id":"CategoryAxis-1","type":"category","position":"bottom","show":true,"style":{},"scale":{"type":"linear"},"labels":{"show":true,"truncate":100},"title":{}}],"valueAxes":[{"id":"ValueAxis-1","name":"LeftAxis-1","type":"value","position":"left","show":true,"style":{},"scale":{"type":"linear","mode":"normal"},"labels":{"show":true,"rotate":0,"filter":false,"truncate":100},"title":{"text":"Count"}}],"seriesParams":[{"show":"true","type":"line","mode":"normal","data":{"label":"Count","id":"1"},"valueAxis":"ValueAxis-1","drawLinesBetweenPoints":true,"showCircles":true,"interpolate":"cardinal"}],"addTooltip":true,"addLegend":true,"legendPosition":"right","times":[],"addTimeMarker":false},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"date_histogram","schema":"segment","params":{"field":"@timestamp","timeRange":{"from":"now-4h","to":"now","mode":"quick"},"useNormalizedEsInterval":true,"interval":"auto","time_zone":"Europe/Berlin","drop_partials":false,"customInterval":"2h","min_doc_count":1,"extended_bounds":{}}},{"id":"3","enabled":true,"type":"terms","schema":"group","params":{"field":"data.sca.check.result","size":5000,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"}}]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","query":{"query":"","language":"lucene"},"filter":[]}'
      }
    },
    _type: 'visualization'
  },
  {
    _id: 'Wazuh-App-Overview-CA-Rule-level-over-time',
    _source: {
      title: 'Rule level distribution over time',
      visState:
        '{"title":"Rule level distribution over time","type":"area","params":{"type":"area","grid":{"categoryLines":true,"style":{"color":"#eee"},"valueAxis":"ValueAxis-1"},"categoryAxes":[{"id":"CategoryAxis-1","type":"category","position":"bottom","show":true,"style":{},"scale":{"type":"linear"},"labels":{"show":true,"truncate":100},"title":{}}],"valueAxes":[{"id":"ValueAxis-1","name":"LeftAxis-1","type":"value","position":"left","show":true,"style":{},"scale":{"type":"linear","mode":"normal"},"labels":{"show":true,"rotate":0,"filter":false,"truncate":100},"title":{"text":"Count"}}],"seriesParams":[{"show":"true","type":"area","mode":"stacked","data":{"label":"Count","id":"1"},"drawLinesBetweenPoints":true,"showCircles":true,"interpolate":"cardinal","valueAxis":"ValueAxis-1"}],"addTooltip":true,"addLegend":true,"legendPosition":"right","times":[],"addTimeMarker":false},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"date_histogram","schema":"segment","params":{"field":"@timestamp","timeRange":{"from":"now-4h","to":"now","mode":"quick"},"useNormalizedEsInterval":true,"interval":"auto","time_zone":"Europe/Berlin","drop_partials":false,"customInterval":"2h","min_doc_count":1,"extended_bounds":{}}},{"id":"3","enabled":true,"type":"terms","schema":"group","params":{"field":"rule.level","size":5,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"}}]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","query":{"query":"","language":"lucene"},"filter":[]}'
      }
    },
    _type: 'visualization'
  },
  {
    _id: 'Wazuh-App-Overview-CA-Passed-vs-failed',
    _source: {
      title: 'Passed vs failed',
      visState:
        '{"title":"Passed vs failed","type":"pie","params":{"type":"pie","addTooltip":true,"addLegend":true,"legendPosition":"right","isDonut":true,"labels":{"show":false,"values":true,"last_level":true,"truncate":100}},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"terms","schema":"segment","params":{"field":"data.sca.check.result","size":5,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"}}]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","filter":[],"query":{"query":"","language":"lucene"}}'
      }
    },
    _type: 'visualization'
  },
  {
    _id: 'Wazuh-App-Overview-CA-Alerts-summary',
    _type: 'visualization',
    _source: {
      title: 'Alerts summary',
      visState:
        '{"title":"Alerts summary","type":"table","params":{"perPage":10,"showPartialRows":false,"showMetricsAtAllLevels":false,"sort":{"columnIndex":3,"direction":"desc"},"showTotal":false,"totalFunc":"sum"},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{"customLabel":"Count"}},{"id":"2","enabled":true,"type":"terms","schema":"bucket","params":{"field":"data.sca.policy","size":5000,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing","customLabel":"Policy"}},{"id":"3","enabled":true,"type":"terms","schema":"bucket","params":{"field":"data.sca.passed","size":1,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing","customLabel":"Pass"}},{"id":"4","enabled":true,"type":"terms","schema":"bucket","params":{"field":"data.sca.failed","size":1,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing","customLabel":"Fail"}}]}',
      uiStateJSON:
        '{"vis":{"params":{"sort":{"columnIndex":3,"direction":"desc"}}}}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","filter":[],"query":{"query":"","language":"lucene"}}'
      }
    }
  }
];
