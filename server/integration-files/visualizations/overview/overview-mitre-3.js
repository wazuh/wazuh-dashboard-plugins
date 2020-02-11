/*
 * Wazuh app - Module for Overview MITRE-3 visualizations
 * Copyright (C) 2015-2020 Wazuh, Inc.
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
    _id: 'Wazuh-App-Overview-MITRE-3',
    _source: {
      title: 'Mitre attack count',
      visState:
        '{"aggs":[{"enabled":true,"id":"1","params":{},"schema":"metric","type":"count"},{"enabled":true,"id":"2","params":{"field":"rule.mitre.id","customLabel":"Attack ID","missingBucket":false,"missingBucketLabel":"Missing","order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","size":244},"schema":"bucket","type":"terms"}],"params":{"dimensions":{"buckets":[],"metrics":[{"accessor":0,"aggType":"count","format":{"id":"number"},"params":{}}]},"perPage":10,"percentageCol":"","showMetricsAtAllLevels":false,"showPartialRows":false,"showTotal":false,"sort":{"columnIndex":null,"direction":null},"totalFunc":"sum"},"title":"mitre","type":"table"}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","filter":[],"query":{"language":"lucene","query":""}}',
      },
    },
    _type: 'visualization',
  },
  {
    _id: 'Wazuh-App-Overview-MITRE-3-Alerts-Evolution',
    _source: {
      title: 'Mitre alerts evolution',
      visState:
        "{\"title\":\"alerts evolution \",\"type\":\"line\",\"params\":{\"type\":\"line\",\"grid\":{\"categoryLines\":false,\"valueAxis\":\"ValueAxis-1\"},\"categoryAxes\":[{\"id\":\"CategoryAxis-1\",\"type\":\"category\",\"position\":\"bottom\",\"show\":true,\"style\":{},\"scale\":{\"type\":\"linear\"},\"labels\":{\"show\":true,\"filter\":true,\"truncate\":100,\"rotate\":75},\"title\":{}}],\"valueAxes\":[{\"id\":\"ValueAxis-1\",\"name\":\"LeftAxis-1\",\"type\":\"value\",\"position\":\"left\",\"show\":true,\"style\":{},\"scale\":{\"type\":\"linear\",\"mode\":\"normal\"},\"labels\":{\"show\":true,\"rotate\":0,\"filter\":false,\"truncate\":100},\"title\":{\"text\":\"Alerts count\"}}],\"seriesParams\":[{\"show\":true,\"type\":\"area\",\"mode\":\"normal\",\"data\":{\"label\":\"Alerts count\",\"id\":\"1\"},\"valueAxis\":\"ValueAxis-1\",\"drawLinesBetweenPoints\":true,\"lineWidth\":2,\"interpolate\":\"linear\",\"showCircles\":true}],\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"times\":[],\"addTimeMarker\":false,\"labels\":{},\"thresholdLine\":{\"show\":false,\"value\":10,\"width\":1,\"style\":\"full\",\"color\":\"#34130C\"},\"dimensions\":{\"x\":{\"accessor\":0,\"format\":{\"id\":\"date\",\"params\":{\"pattern\":\"YYYY-MM-DD\"}},\"params\":{\"date\":true,\"interval\":\"P1D\",\"intervalESValue\":1,\"intervalESUnit\":\"d\",\"format\":\"YYYY-MM-DD\",\"bounds\":{\"min\":\"2019-04-13T01:41:13.628Z\",\"max\":\"2019-09-15T06:36:24.430Z\"}},\"aggType\":\"date_histogram\"},\"y\":[{\"accessor\":1,\"format\":{\"id\":\"number\"},\"params\":{},\"aggType\":\"count\"}]}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{\"customLabel\":\"Alerts count\"}},{\"id\":\"2\",\"enabled\":true,\"type\":\"date_histogram\",\"schema\":\"segment\",\"params\":{\"field\":\"timestamp\",\"timeRange\":{\"from\":\"2019-04-13T01:41:13.628Z\",\"to\":\"2019-09-15T06:36:24.430Z\"},\"useNormalizedEsInterval\":true,\"scaleMetricValues\":false,\"interval\":\"auto\",\"drop_partials\":false,\"min_doc_count\":1,\"extended_bounds\":{},\"customLabel\":\"Alerts evolution\"}}]}",
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","filter":[],"query":{"language":"lucene","query":""}}',
      },
    },
    _type: 'visualization',
  },
  {
    _id: 'Wazuh-App-Overview-MITRE-3-Alerts-Evolution-By-Technique',
    _source: {
      title: 'Mitre alerts evolution',
      visState:
      "{\"title\":\"MITRE alerts evolution\",\"type\":\"line\",\"params\":{\"type\":\"line\",\"grid\":{\"categoryLines\":false,\"valueAxis\":\"ValueAxis-1\"},\"categoryAxes\":[{\"id\":\"CategoryAxis-1\",\"type\":\"category\",\"position\":\"bottom\",\"show\":true,\"style\":{},\"scale\":{\"type\":\"linear\"},\"labels\":{\"show\":true,\"filter\":true,\"truncate\":100,\"rotate\":75},\"title\":{}}],\"valueAxes\":[{\"id\":\"ValueAxis-1\",\"name\":\"LeftAxis-1\",\"type\":\"value\",\"position\":\"left\",\"show\":true,\"style\":{},\"scale\":{\"type\":\"linear\",\"mode\":\"normal\"},\"labels\":{\"show\":true,\"rotate\":0,\"filter\":false,\"truncate\":100},\"title\":{\"text\":\"Count\"}}],\"seriesParams\":[{\"show\":true,\"type\":\"area\",\"mode\":\"normal\",\"data\":{\"label\":\"Count\",\"id\":\"1\"},\"valueAxis\":\"ValueAxis-1\",\"drawLinesBetweenPoints\":true,\"lineWidth\":2,\"interpolate\":\"linear\",\"showCircles\":true}],\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"times\":[],\"addTimeMarker\":false,\"labels\":{},\"thresholdLine\":{\"show\":false,\"value\":10,\"width\":1,\"style\":\"full\",\"color\":\"#34130C\"},\"dimensions\":{\"x\":{\"accessor\":0,\"format\":{\"id\":\"date\",\"params\":{\"pattern\":\"YYYY-MM-DD\"}},\"params\":{\"date\":true,\"interval\":\"P7D\",\"intervalESValue\":1,\"intervalESUnit\":\"w\",\"format\":\"YYYY-MM-DD\",\"bounds\":{\"min\":\"2019-02-11T11:10:29.993Z\",\"max\":\"2020-02-11T11:10:29.993Z\"}},\"aggType\":\"date_histogram\"},\"y\":[{\"accessor\":2,\"format\":{\"id\":\"number\"},\"params\":{},\"aggType\":\"count\"}],\"series\":[{\"accessor\":1,\"format\":{\"id\":\"terms\",\"params\":{\"id\":\"string\",\"otherBucketLabel\":\"Other\",\"missingBucketLabel\":\"Missing\"}},\"params\":{},\"aggType\":\"terms\"}]}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"date_histogram\",\"schema\":\"segment\",\"params\":{\"field\":\"timestamp\",\"timeRange\":{\"from\":\"now-1y\",\"to\":\"now\"},\"useNormalizedEsInterval\":true,\"scaleMetricValues\":false,\"interval\":\"auto\",\"drop_partials\":false,\"min_doc_count\":1,\"extended_bounds\":{}}},{\"id\":\"3\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"group\",\"params\":{\"field\":\"rule.mitre.id\",\"orderBy\":\"1\",\"order\":\"desc\",\"size\":5,\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\"}}]}",
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","filter":[],"query":{"language":"lucene","query":""}}',
      },
    },
    _type: 'visualization',
  },
  {
    _id: 'Wazuh-App-Overview-MITRE-3-Attacks-By-Agent',
    _source: {
      title: 'Attacks count by agent',
      visState:
        '{"title":"top agents","type":"pie","params":{"type":"pie","addTooltip":true,"addLegend":true,"legendPosition":"right","isDonut":true,"labels":{"show":false,"values":true,"last_level":true,"truncate":100},"dimensions":{"metric":{"accessor":0,"format":{"id":"number"},"params":{},"aggType":"count"}}},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"terms","schema":"segment","params":{"field":"agent.name","orderBy":"1","order":"desc","size":5,"otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"}}]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","filter":[],"query":{"language":"lucene","query":""}}',
      },
    },
    _type: 'visualization',
  },
  {
    _id: 'Wazuh-App-Overview-MITRE-3-Attacks-By-Tactic',
    _source: {
      title: 'Alerts level by agent',
      visState:
        '{"title":"Attacks by tactic","type":"histogram","params":{"type":"histogram","grid":{"categoryLines":false},"categoryAxes":[{"id":"CategoryAxis-1","type":"category","position":"bottom","show":true,"style":{},"scale":{"type":"linear"},"labels":{"show":true,"filter":true,"truncate":100},"title":{}}],"valueAxes":[{"id":"ValueAxis-1","name":"LeftAxis-1","type":"value","position":"left","show":true,"style":{},"scale":{"type":"linear","mode":"normal"},"labels":{"show":true,"rotate":0,"filter":false,"truncate":100},"title":{"text":"Count"}}],"seriesParams":[{"show":"true","type":"histogram","mode":"stacked","data":{"label":"Count","id":"1"},"valueAxis":"ValueAxis-1","drawLinesBetweenPoints":true,"showCircles":true}],"addTooltip":true,"addLegend":true,"legendPosition":"right","times":[],"addTimeMarker":false,"labels":{"show":false},"thresholdLine":{"show":false,"value":10,"width":1,"style":"full","color":"#34130C"},"dimensions":{"x":null,"y":[{"accessor":1,"format":{"id":"number"},"params":{},"aggType":"count"}],"series":[{"accessor":0,"format":{"id":"terms","params":{"id":"string","otherBucketLabel":"Other","missingBucketLabel":"Missing"}},"params":{},"aggType":"terms"}]}},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"terms","schema":"group","params":{"field":"rule.mitre.id","orderBy":"1","order":"desc","size":5,"otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"}},{"id":"3","enabled":true,"type":"terms","schema":"segment","params":{"field":"rule.mitre.tactics","orderBy":"1","order":"desc","size":5,"otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"}}]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","filter":[],"query":{"language":"lucene","query":""}}',
      },
    },
    _type: 'visualization',
  },
  {
    _id: 'Wazuh-App-Overview-MITRE-3-Top-Tactics-By-Agent',
    _source: {
      title: 'Top tactics by agent',
      visState:
        '{"title":"Top tactics by agent - vertical","type":"area","params":{"addLegend":true,"addTimeMarker":false,"addTooltip":true,"categoryAxes":[{"id":"CategoryAxis-1","labels":{"filter":true,"show":true,"truncate":10},"position":"bottom","scale":{"type":"linear"},"show":true,"style":{},"title":{},"type":"category"}],"dimensions":{"x":{"accessor":1,"format":{"id":"terms","params":{"id":"string","otherBucketLabel":"Other","missingBucketLabel":"Missing"}},"params":{},"aggType":"terms"},"y":[{"accessor":2,"format":{"id":"number"},"params":{},"aggType":"count"}],"series":[{"accessor":0,"format":{"id":"terms","params":{"id":"string","otherBucketLabel":"Other","missingBucketLabel":"Missing"}},"params":{},"aggType":"terms"}]},"grid":{"categoryLines":false,"valueAxis":"ValueAxis-1"},"labels":{},"legendPosition":"right","seriesParams":[{"data":{"id":"1","label":"Count"},"drawLinesBetweenPoints":true,"interpolate":"linear","mode":"normal","show":"true","showCircles":true,"type":"histogram","valueAxis":"ValueAxis-1"}],"thresholdLine":{"color":"#34130C","show":false,"style":"full","value":10,"width":1},"times":[],"type":"area","valueAxes":[{"id":"ValueAxis-1","labels":{"filter":false,"rotate":0,"show":true,"truncate":100},"name":"LeftAxis-1","position":"left","scale":{"mode":"normal","type":"linear"},"show":true,"style":{},"title":{"text":"Count"},"type":"value"}]},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"3","enabled":true,"type":"terms","schema":"group","params":{"field":"rule.mitre.tactics","orderBy":"1","order":"desc","size":5,"otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"}},{"id":"4","enabled":true,"type":"terms","schema":"segment","params":{"field":"agent.name","orderBy":"1","order":"desc","size":5,"otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"}}]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","filter":[],"query":{"language":"lucene","query":""}}',
      },
    },
    _type: 'visualization',
  },
  {
    _id: 'Wazuh-App-Overview-MITRE-3-Top-Tactics',
    _source: {
      title: 'Top tactics',
      visState:
        '{"title":"Top tactics PIE2","type":"pie","params":{"type":"pie","addTooltip":true,"addLegend":true,"legendPosition":"right","isDonut":true,"labels":{"show":false,"values":true,"last_level":true,"truncate":100},"dimensions":{"metric":{"accessor":1,"format":{"id":"number"},"params":{},"aggType":"count"},"buckets":[{"accessor":0,"format":{"id":"terms","params":{"id":"string","otherBucketLabel":"Other","missingBucketLabel":"Missing"}},"params":{},"aggType":"terms"}]}},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"terms","schema":"segment","params":{"field":"rule.mitre.tactics","orderBy":"1","order":"desc","size":10,"otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"}}]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","filter":[],"query":{"language":"lucene","query":""}}',
      },
    },
    _type: 'visualization',
  },
  {
    _id: 'Wazuh-App-Overview-MITRE-3-Heat-map-rule-level',
    _source: {
      title: 'Top tactics',
      visState:
      "{\"title\":\"Heat Map tactics by rule levekl\",\"type\":\"heatmap\",\"params\":{\"type\":\"heatmap\",\"addTooltip\":true,\"addLegend\":true,\"enableHover\":false,\"legendPosition\":\"right\",\"times\":[],\"colorsNumber\":4,\"colorSchema\":\"Greens\",\"setColorRange\":false,\"colorsRange\":[],\"invertColors\":false,\"percentageMode\":false,\"valueAxes\":[{\"show\":false,\"id\":\"ValueAxis-1\",\"type\":\"value\",\"scale\":{\"type\":\"linear\",\"defaultYExtents\":false},\"labels\":{\"show\":false,\"rotate\":0,\"overwriteColor\":false,\"color\":\"black\"}}],\"dimensions\":{\"x\":{\"accessor\":0,\"format\":{\"id\":\"terms\",\"params\":{\"id\":\"string\",\"otherBucketLabel\":\"Other\",\"missingBucketLabel\":\"Missing\"}},\"params\":{},\"aggType\":\"terms\"},\"y\":[{\"accessor\":2,\"format\":{\"id\":\"number\"},\"params\":{},\"aggType\":\"count\"}],\"series\":[{\"accessor\":1,\"format\":{\"id\":\"terms\",\"params\":{\"id\":\"number\",\"otherBucketLabel\":\"Other\",\"missingBucketLabel\":\"Missing\"}},\"params\":{},\"aggType\":\"terms\"}]}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"rule.mitre.tactics\",\"orderBy\":\"1\",\"order\":\"desc\",\"size\":51,\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\"}},{\"id\":\"3\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"group\",\"params\":{\"field\":\"rule.level\",\"orderBy\":\"_key\",\"order\":\"desc\",\"size\":12,\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\"}}]}",      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","filter":[],"query":{"language":"lucene","query":""}}',
      },
    },
    _type: 'visualization',
  },
  {
    _id: 'Wazuh-App-Overview-MITRE-3-techniques-by-group',
    _source: {
      title: 'techniques-by-group',
      visState:
      "{\"title\":\"techniques by group\",\"type\":\"pie\",\"params\":{\"type\":\"pie\",\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"isDonut\":true,\"labels\":{\"show\":false,\"values\":true,\"last_level\":true,\"truncate\":100},\"dimensions\":{\"metric\":{\"accessor\":1,\"format\":{\"id\":\"number\"},\"params\":{},\"aggType\":\"count\"},\"buckets\":[{\"accessor\":0,\"format\":{\"id\":\"terms\",\"params\":{\"id\":\"string\",\"otherBucketLabel\":\"Other\",\"missingBucketLabel\":\"Missing\"}},\"params\":{},\"aggType\":\"terms\"}]}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"rule.groups\",\"orderBy\":\"1\",\"order\":\"desc\",\"size\":5,\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\"}},{\"id\":\"3\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"rule.mitre.id\",\"orderBy\":\"1\",\"order\":\"desc\",\"size\":5,\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\"}}]}",
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","filter":[],"query":{"language":"lucene","query":""}}',
      },
    },
    _type: 'visualization',
  },
  {
    _id: 'Wazuh-App-Overview-MITRE-3-techniques-by-agent',
    _source: {
      title: 'techniques-by-group',
      visState:
      "{\"title\":\"top techniques by agent\",\"type\":\"pie\",\"params\":{\"type\":\"pie\",\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"isDonut\":true,\"labels\":{\"show\":false,\"values\":true,\"last_level\":true,\"truncate\":100},\"dimensions\":{\"metric\":{\"accessor\":1,\"format\":{\"id\":\"number\"},\"params\":{},\"aggType\":\"count\"},\"buckets\":[{\"accessor\":0,\"format\":{\"id\":\"terms\",\"params\":{\"id\":\"string\",\"otherBucketLabel\":\"Other\",\"missingBucketLabel\":\"Missing\"}},\"params\":{},\"aggType\":\"terms\"},{\"accessor\":2,\"format\":{\"id\":\"terms\",\"params\":{\"id\":\"string\",\"otherBucketLabel\":\"Other\",\"missingBucketLabel\":\"Missing\"}},\"params\":{},\"aggType\":\"terms\"}]}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"agent.name\",\"orderBy\":\"1\",\"order\":\"desc\",\"size\":5,\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"customLabel\":\"Agent Name\"}},{\"id\":\"3\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"segment\",\"params\":{\"field\":\"rule.mitre.id\",\"orderBy\":\"1\",\"order\":\"desc\",\"size\":5,\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\",\"customLabel\":\"Technique\"}}]}",      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","filter":[],"query":{"language":"lucene","query":""}}',
      },
    },
    _type: 'visualization',
  },
  {
    _id: 'Wazuh-App-Overview-MITRE-3-evolution-by-agent',
    _source: {
      title: 'techniques-by-group',
      visState:
"{\"title\":\"alerts evolution by agent\",\"type\":\"histogram\",\"params\":{\"type\":\"histogram\",\"grid\":{\"categoryLines\":false},\"categoryAxes\":[{\"id\":\"CategoryAxis-1\",\"type\":\"category\",\"position\":\"bottom\",\"show\":true,\"style\":{},\"scale\":{\"type\":\"linear\"},\"labels\":{\"show\":true,\"filter\":true,\"truncate\":100},\"title\":{}}],\"valueAxes\":[{\"id\":\"ValueAxis-1\",\"name\":\"LeftAxis-1\",\"type\":\"value\",\"position\":\"left\",\"show\":true,\"style\":{},\"scale\":{\"type\":\"linear\",\"mode\":\"normal\"},\"labels\":{\"show\":true,\"rotate\":0,\"filter\":false,\"truncate\":100},\"title\":{\"text\":\"Count\"}}],\"seriesParams\":[{\"show\":true,\"type\":\"area\",\"mode\":\"normal\",\"data\":{\"label\":\"Count\",\"id\":\"1\"},\"valueAxis\":\"ValueAxis-1\",\"drawLinesBetweenPoints\":true,\"lineWidth\":20,\"showCircles\":true,\"interpolate\":\"cardinal\"}],\"addTooltip\":true,\"addLegend\":true,\"legendPosition\":\"right\",\"times\":[],\"addTimeMarker\":false,\"labels\":{\"show\":false},\"thresholdLine\":{\"show\":false,\"value\":10,\"width\":1,\"style\":\"full\",\"color\":\"#34130C\"},\"dimensions\":{\"x\":{\"accessor\":0,\"format\":{\"id\":\"date\",\"params\":{\"pattern\":\"YYYY-MM-DD\"}},\"params\":{\"date\":true,\"interval\":\"P1D\",\"intervalESValue\":1,\"intervalESUnit\":\"d\",\"format\":\"YYYY-MM-DD\",\"bounds\":{\"min\":\"2019-02-23T04:51:40.990Z\",\"max\":\"2019-11-05T04:31:29.108Z\"}},\"aggType\":\"date_histogram\"},\"y\":[{\"accessor\":2,\"format\":{\"id\":\"number\"},\"params\":{},\"aggType\":\"count\"}],\"series\":[{\"accessor\":1,\"format\":{\"id\":\"terms\",\"params\":{\"id\":\"string\",\"otherBucketLabel\":\"Other\",\"missingBucketLabel\":\"Missing\"}},\"params\":{},\"aggType\":\"terms\"}]}},\"aggs\":[{\"id\":\"1\",\"enabled\":true,\"type\":\"count\",\"schema\":\"metric\",\"params\":{}},{\"id\":\"2\",\"enabled\":true,\"type\":\"date_histogram\",\"schema\":\"segment\",\"params\":{\"field\":\"timestamp\",\"timeRange\":{\"from\":\"2019-02-23T04:51:40.990Z\",\"to\":\"2019-11-05T04:31:29.108Z\"},\"useNormalizedEsInterval\":true,\"scaleMetricValues\":false,\"interval\":\"auto\",\"drop_partials\":false,\"min_doc_count\":1,\"extended_bounds\":{}}},{\"id\":\"3\",\"enabled\":true,\"type\":\"terms\",\"schema\":\"group\",\"params\":{\"field\":\"agent.name\",\"orderBy\":\"1\",\"order\":\"desc\",\"size\":5,\"otherBucket\":false,\"otherBucketLabel\":\"Other\",\"missingBucket\":false,\"missingBucketLabel\":\"Missing\"}}]}",            description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","filter":[],"query":{"language":"lucene","query":""}}',
      },
    },
    _type: 'visualization',
  },
];


