/*
 * Wazuh app - Module for Overview MITRE-1 visualizations
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
  { // Wazuh-App-Overview-MITRE-1-techniques-count
    _id: 'Wazuh-App-Overview-MITRE-1-techniques-count',
    _source: {
      title: 'Mitre Techniques count',
      visState:
      '{"title":"Mitre Techniques count","type":"metrics","params":{"id":"61ca57f0-469d-11e7-af02-69e470af7417","type":"timeseries","series":[{"id":"61ca57f1-469d-11e7-af02-69e470af7417","color":"#68BC00","split_mode":"terms","metrics":[{"id":"61ca57f2-469d-11e7-af02-69e470af7417","type":"count"}],"separate_axis":0,"axis_position":"right","formatter":"number","chart_type":"line","line_width":1,"point_size":1,"fill":0.5,"stacked":"none","terms_field":"rule.mitre.id","split_color_mode":"rainbow","label":"Techniques"}],"time_field":"","index_pattern":"","interval":"","axis_position":"left","axis_formatter":"number","axis_scale":"normal","show_legend":1,"show_grid":1,"default_index_pattern":"wazuh-alerts-3.x-*","default_timefield":"timestamp","isModelInvalid":false,"background_color_rules":[{"id":"f8c506a0-4ca8-11ea-bfb3-2f3028302f0d"}],"bar_color_rules":[{"id":"f9a02460-4ca8-11ea-bfb3-2f3028302f0d"}],"gauge_color_rules":[{"id":"fa302f60-4ca8-11ea-bfb3-2f3028302f0d"}],"gauge_width":10,"gauge_inner_width":10,"gauge_style":"half"},"aggs":[]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"query":{"query":"","language":"kuery"},"filter":[]}',
      },
    },
    _type: 'visualization',
  },
  { // Wazuh-App-Overview-MITRE-1-tactics-count
    _id: 'Wazuh-App-Overview-MITRE-1-tactics-count',
    _source: {
      title: 'Mitre Tactics count',
      visState:
        '{"title":"Mitre Tactics count","type":"metrics","params":{"id":"61ca57f0-469d-11e7-af02-69e470af7417","type":"timeseries","series":[{"id":"61ca57f1-469d-11e7-af02-69e470af7417","color":"#68BC00","split_mode":"terms","metrics":[{"id":"61ca57f2-469d-11e7-af02-69e470af7417","type":"count"}],"separate_axis":0,"axis_position":"right","formatter":"number","chart_type":"line","line_width":1,"point_size":1,"fill":0.5,"stacked":"none","terms_field":"rule.mitre.tactics","split_color_mode":"rainbow","label":"Techniques"}],"time_field":"","index_pattern":"","interval":"","axis_position":"left","axis_formatter":"number","axis_scale":"normal","show_legend":1,"show_grid":1,"default_index_pattern":"wazuh-alerts-3.x-*","default_timefield":"timestamp","isModelInvalid":false,"background_color_rules":[{"id":"f8c506a0-4ca8-11ea-bfb3-2f3028302f0d"}],"bar_color_rules":[{"id":"f9a02460-4ca8-11ea-bfb3-2f3028302f0d"}],"gauge_color_rules":[{"id":"fa302f60-4ca8-11ea-bfb3-2f3028302f0d"}],"gauge_width":10,"gauge_inner_width":10,"gauge_style":"half"},"aggs":[]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"query":{"query":"","language":"kuery"},"filter":[]}',
      },
    },
    _type: 'visualization',
  },
  { // Wazuh-App-Overview-MITRE-1-groups-by-tactics-refs
    _id: 'Wazuh-App-Overview-MITRE-1-groups-by-tactics-refs',
    _source: {
      title: 'Groups by Tactics Refs',
      visState:
        '{"title":"Groups by Tactics Refs","type":"histogram","params":{"type":"histogram","grid":{"categoryLines":false},"categoryAxes":[{"id":"CategoryAxis-1","type":"category","position":"bottom","show":true,"style":{},"scale":{"type":"linear"},"labels":{"show":true,"filter":true,"truncate":100},"title":{}}],"valueAxes":[{"id":"ValueAxis-1","name":"LeftAxis-1","type":"value","position":"left","show":true,"style":{},"scale":{"type":"linear","mode":"normal"},"labels":{"show":true,"rotate":0,"filter":false,"truncate":100},"title":{"text":"Count"}}],"seriesParams":[{"show":true,"type":"histogram","mode":"normal","data":{"label":"Count","id":"1"},"valueAxis":"ValueAxis-1","drawLinesBetweenPoints":true,"lineWidth":2,"showCircles":true}],"addTooltip":true,"addLegend":true,"legendPosition":"right","times":[],"addTimeMarker":false,"labels":{"show":false},"thresholdLine":{"show":false,"value":10,"width":1,"style":"full","color":"#34130C"},"dimensions":{"x":{"accessor":0,"format":{"id":"terms","params":{"id":"string","otherBucketLabel":"Other","missingBucketLabel":"Missing"}},"params":{},"aggType":"terms"},"y":[{"accessor":2,"format":{"id":"number"},"params":{},"aggType":"count"}],"series":[{"accessor":1,"format":{"id":"terms","params":{"id":"string","otherBucketLabel":"Other","missingBucketLabel":"Missing"}},"params":{},"aggType":"terms"}]}},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"terms","schema":"segment","params":{"field":"rule.mitre.tactics","orderBy":"1","order":"desc","size":5,"otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"}},{"id":"3","enabled":true,"type":"terms","schema":"group","params":{"field":"rule.groups","orderBy":"1","order":"desc","size":5,"otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"}}]}',
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
  { // Wazuh-App-Overview-MITRE-1-tactics-by-top-five-agents
    _id: 'Wazuh-App-Overview-MITRE-1-tactics-by-top-five-agents',
    _source: {
      title: 'Tactics by top 5 Agents',
      visState:
        '{"title":"Tactics by top 5 Agents","type":"pie","params":{"type":"pie","addTooltip":true,"addLegend":true,"legendPosition":"right","isDonut":true,"labels":{"show":false,"values":true,"last_level":true,"truncate":100},"dimensions":{"metric":{"accessor":1,"format":{"id":"number"},"params":{},"aggType":"count"},"buckets":[{"accessor":0,"format":{"id":"terms","params":{"id":"string","otherBucketLabel":"Other","missingBucketLabel":"Missing"}},"params":{},"aggType":"terms"},{"accessor":2,"format":{"id":"terms","params":{"id":"string","otherBucketLabel":"Other","missingBucketLabel":"Missing"}},"params":{},"aggType":"terms"}]}},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"3","enabled":true,"type":"terms","schema":"segment","params":{"field":"agent.name","orderBy":"1","order":"desc","size":5,"otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"}},{"id":"2","enabled":true,"type":"terms","schema":"segment","params":{"field":"rule.mitre.tactics","orderBy":"1","order":"desc","size":15,"otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"}}]}',
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
  { // Wazuh-App-Overview-MITRE-1-techniques-by-top-five-agents
    _id: 'Wazuh-App-Overview-MITRE-1-techniques-by-top-five-agents',
    _source: {
      title: 'Techniques Refs by top 5 Agents',
      visState:
        '{"title":"Techniques Refs by top 5 Agents","type":"pie","params":{"type":"pie","addTooltip":true,"addLegend":true,"legendPosition":"right","isDonut":true,"labels":{"show":false,"values":true,"last_level":true,"truncate":100},"dimensions":{"metric":{"accessor":1,"format":{"id":"number"},"params":{},"aggType":"count"},"buckets":[{"accessor":0,"format":{"id":"terms","params":{"id":"string","otherBucketLabel":"Other","missingBucketLabel":"Missing"}},"params":{},"aggType":"terms"},{"accessor":2,"format":{"id":"terms","params":{"id":"string","otherBucketLabel":"Other","missingBucketLabel":"Missing"}},"params":{},"aggType":"terms"}]}},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"3","enabled":true,"type":"terms","schema":"segment","params":{"field":"agent.name","orderBy":"1","order":"desc","size":5,"otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"}},{"id":"2","enabled":true,"type":"terms","schema":"segment","params":{"field":"rule.mitre.id","orderBy":"1","order":"desc","size":15,"otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"}}]}',
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
  { // Wazuh-App-Overview-MITRE-1-mitre-attack-alerts-by-agents
    _id: 'Wazuh-App-Overview-MITRE-1-mitre-attack-alerts-by-agents',
    _source: {
      title: 'MITRE ATT&CK™ Alerts by Agents',
      visState:
        '{"aggs":[{"enabled":true,"id":"1","params":{},"schema":"metric","type":"count"},{"enabled":true,"id":"2","params":{"field":"agent.name","missingBucket":false,"missingBucketLabel":"Missing","order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","size":10},"schema":"group","type":"terms"}],"params":{"addLegend":true,"addTimeMarker":false,"addTooltip":true,"categoryAxes":[{"id":"CategoryAxis-1","labels":{"filter":false,"rotate":0,"show":true,"truncate":200},"position":"left","scale":{"type":"linear"},"show":true,"style":{},"title":{},"type":"category"}],"dimensions":{"series":[{"accessor":0,"aggType":"terms","format":{"id":"terms","params":{"id":"string","missingBucketLabel":"Missing","otherBucketLabel":"Other"}},"params":{}}],"x":null,"y":[{"accessor":1,"aggType":"count","format":{"id":"number"},"params":{}}]},"grid":{"categoryLines":false},"labels":{},"legendPosition":"right","seriesParams":[{"data":{"id":"1","label":"Count"},"drawLinesBetweenPoints":true,"lineWidth":2,"mode":"normal","show":true,"showCircles":true,"type":"histogram","valueAxis":"ValueAxis-1"}],"thresholdLine":{"color":"#34130C","show":false,"style":"full","value":10,"width":1},"times":[],"type":"histogram","valueAxes":[{"id":"ValueAxis-1","labels":{"filter":true,"rotate":75,"show":true,"truncate":100},"name":"LeftAxis-1","position":"bottom","scale":{"defaultYExtents":false,"mode":"normal","setYExtents":false,"type":"linear"},"show":true,"style":{},"title":{"text":"MITRE ATT&CK™ Alerts by Agents" },"type":"value"}]},"title":"MITRE ATT&CK™ Alerts by Agents","type":"horizontal_bar"}',
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
];
