/*
 * Wazuh app - Module for Overview MITRE-2 visualizations
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
  { // Wazuh-App-Overview-MITRE-2-alerts-metric
    _id: 'Wazuh-App-Overview-MITRE-2-alerts-metric',
    _source: {
      title: 'Mitre Tactics Metrics',
      visState:
        '{"title":"Mitre Tactics Metrics","type":"metric","params":{"metric":{"percentageMode":false,"useRanges":false,"colorSchema":"Green to Red","metricColorMode":"None","colorsRange":[{"type":"range","from":0,"to":10000}],"labels":{"show":true},"invertColors":false,"style":{"bgFill":"#000","bgColor":false,"labelColor":false,"subText":"","fontSize":17}},"dimensions":{"metrics":[{"type":"vis_dimension","accessor":1,"format":{"id":"number","params":{}}}],"bucket":{"type":"vis_dimension","accessor":0,"format":{"id":"terms","params":{"id":"string","otherBucketLabel":"Other","missingBucketLabel":"Missing"}}}},"addTooltip":true,"addLegend":false,"type":"metric"},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{"customLabel":"Alerts"}},{"id":"2","enabled":true,"type":"terms","schema":"group","params":{"field":"rule.mitre.tactics","orderBy":"1","order":"desc","size":5,"otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"}}]}',
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
  { // Wazuh-App-Overview-MITRE-2-techniques-by-top-five-agents
    _id: 'Wazuh-App-Overview-MITRE-2-techniques-by-top-five-agents',
    _source: {
      title: 'Techniques Refs by top five agents',
      visState:
        '{"title":"Techniques Refs by top five agents","type":"pie","params":{"type":"pie","addTooltip":true,"addLegend":true,"legendPosition":"right","isDonut":true,"labels":{"show":false,"values":true,"last_level":true,"truncate":100},"dimensions":{"metric":{"accessor":3,"format":{"id":"number"},"params":{},"aggType":"count"},"buckets":[{"accessor":2,"format":{"id":"terms","params":{"id":"string","otherBucketLabel":"Other","missingBucketLabel":"Missing"}},"params":{},"aggType":"terms"}],"splitColumn":[{"accessor":0,"format":{"id":"terms","params":{"id":"string","otherBucketLabel":"Other","missingBucketLabel":"Missing"}},"params":{},"aggType":"terms"}]}},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"terms","schema":"split","params":{"field":"agent.name","orderBy":"1","order":"desc","size":5,"otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing","row":false}},{"id":"3","enabled":true,"type":"terms","schema":"segment","params":{"field":"rule.mitre.id","orderBy":"1","order":"desc","size":10,"otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"}}]}',
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
  { // Wazuh-App-Overview-MITRE-2-top-tactics
    _id: 'Wazuh-App-Overview-MITRE-2-top-tactics',
    _source: {
      title: 'Top tactics alerts',
      visState:
        '{"title":"Top tactics alerts","type":"metrics","params":{"id":"61ca57f0-469d-11e7-af02-69e470af7417","type":"top_n","series":[{"id":"61ca57f1-469d-11e7-af02-69e470af7417","color":"#68BC00","split_mode":"terms","metrics":[{"id":"61ca57f2-469d-11e7-af02-69e470af7417","type":"count"}],"separate_axis":0,"axis_position":"right","formatter":"number","chart_type":"line","line_width":1,"point_size":1,"fill":0.5,"stacked":"none","override_index_pattern":1,"time_range_mode":"entire_time_range","terms_field":"rule.mitre.tactics"}],"time_field":"","index_pattern":"","interval":"","axis_position":"left","axis_formatter":"number","axis_scale":"normal","show_legend":1,"show_grid":1,"default_index_pattern":"wazuh-alerts-3.x-*","default_timefield":"timestamp","isModelInvalid":false,"background_color_rules":[{"id":"9bbc86f0-4cca-11ea-8371-b7a1d79a4e12"}],"bar_color_rules":[{"id":"9c7bb840-4cca-11ea-8371-b7a1d79a4e12"}],"gauge_color_rules":[{"id":"9d7ab1b0-4cca-11ea-8371-b7a1d79a4e12"}],"gauge_width":10,"gauge_inner_width":10,"gauge_style":"half"},"aggs":[]}',
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
  { // Wazuh-App-Overview-MITRE-2-top-techniques
    _id: 'Wazuh-App-Overview-MITRE-2-top-techniques',
    _source: {
      title: 'Top Techniques alerts',
      visState:
        '{"title":"Top Techniques alerts","type":"metrics","params":{"id":"61ca57f0-469d-11e7-af02-69e470af7417","type":"top_n","series":[{"id":"61ca57f1-469d-11e7-af02-69e470af7417","color":"#68BC00","split_mode":"terms","metrics":[{"id":"61ca57f2-469d-11e7-af02-69e470af7417","type":"count"}],"separate_axis":0,"axis_position":"right","formatter":"number","chart_type":"line","line_width":1,"point_size":1,"fill":0.5,"stacked":"none","override_index_pattern":1,"time_range_mode":"entire_time_range","terms_field":"rule.mitre.id"}],"time_field":"","index_pattern":"","interval":"","axis_position":"left","axis_formatter":"number","axis_scale":"normal","show_legend":1,"show_grid":1,"default_index_pattern":"wazuh-alerts-3.x-*","default_timefield":"timestamp","isModelInvalid":false,"background_color_rules":[{"id":"9bbc86f0-4cca-11ea-8371-b7a1d79a4e12"}],"bar_color_rules":[{"id":"9c7bb840-4cca-11ea-8371-b7a1d79a4e12"}],"gauge_color_rules":[{"id":"9d7ab1b0-4cca-11ea-8371-b7a1d79a4e12"}],"gauge_width":10,"gauge_inner_width":10,"gauge_style":"half"},"aggs":[]}',
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
  { // Wazuh-App-Overview-MITRE-2-total-alerts
    _id: 'Wazuh-App-Overview-MITRE-2-total-alerts',
    _source: {
      title: 'Total alerst of MITRE ATT&CK™',
      visState:
        '{"title":"Total alerst of MITRE ATT&CK™","type":"metrics","params":{"id":"61ca57f0-469d-11e7-af02-69e470af7417","type":"timeseries","series":[{"id":"61ca57f1-469d-11e7-af02-69e470af7417","color":"#68BC00","split_mode":"everything","metrics":[{"id":"61ca57f2-469d-11e7-af02-69e470af7417","type":"count"}],"separate_axis":0,"axis_position":"right","formatter":"number","chart_type":"line","line_width":1,"point_size":1,"fill":0.5,"stacked":"none","label":"Alerts"}],"time_field":"","index_pattern":"","interval":"","axis_position":"left","axis_formatter":"number","axis_scale":"normal","show_legend":1,"show_grid":1,"default_index_pattern":"wazuh-alerts-3.x-*","default_timefield":"timestamp","isModelInvalid":false},"aggs":[]}',
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
