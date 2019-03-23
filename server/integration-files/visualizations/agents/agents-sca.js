/*
 * Wazuh app - Module for Agents/CA visualizations
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
    _id: 'Wazuh-App-Agents-CA-Alerts-over-time',
    _source: {
      title: 'Alerts by policy',
      visState:
        '{"title":"Alerts over time","type":"metrics","params":{"id":"61ca57f0-469d-11e7-af02-69e470af7417","type":"timeseries","series":[{"id":"61ca57f1-469d-11e7-af02-69e470af7417","color":"rgba(0,156,224,1)","split_mode":"terms","metrics":[{"id":"61ca57f2-469d-11e7-af02-69e470af7417","type":"count"}],"separate_axis":0,"axis_position":"right","split_color_mode":"rainbow","formatter":"number","chart_type":"line","line_width":1,"point_size":1,"fill":0.9,"stacked":"stacked","terms_field":"data.sca.policy_id","terms_size":"5","terms_order_by":"_count","label":"Alerts"}],"time_field":"@timestamp","index_pattern":"wazuh-alerts","interval":"auto","axis_position":"left","axis_formatter":"number","axis_scale":"normal","show_legend":1,"show_grid":1,"gauge_color_rules":[{"id":"414efe60-3753-11e9-8d90-91d4615ec8c6"}],"gauge_width":10,"gauge_inner_width":10,"gauge_style":"half","bar_color_rules":[{"value":0,"id":"4220f460-3753-11e9-8d90-91d4615ec8c6","bar_color":null}],"drilldown_url":"","filter":"","background_color":null,"background_color_rules":[{"id":"74c34bc0-3753-11e9-8d90-91d4615ec8c6"}]},"aggs":[]}',
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
    _id: 'Wazuh-App-Overview-CA-Results-heatmap',
    _source: {
      title: 'Results over time',
      visState:
        '{"title":"heatmap-sca","type":"heatmap","params":{"type":"heatmap","addTooltip":true,"addLegend":true,"enableHover":true,"legendPosition":"right","times":[],"colorsNumber":10,"colorSchema":"Blues","setColorRange":false,"colorsRange":[],"invertColors":false,"percentageMode":false,"valueAxes":[{"show":false,"id":"ValueAxis-1","type":"value","scale":{"type":"linear","defaultYExtents":false},"labels":{"show":false,"rotate":0,"overwriteColor":false,"color":"#555"}}]},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{"customLabel":""}},{"id":"2","enabled":true,"type":"terms","schema":"segment","params":{"field":"data.sca.check.result","size":5,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing","customLabel":"Result"}},{"id":"3","enabled":true,"type":"terms","schema":"group","params":{"field":"data.sca.policy","size":5,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing","customLabel":"Policy"}}]}',
      uiStateJSON:
        '{"vis":{"defaultColors":{"0 - 14":"rgb(247,251,255)","14 - 28":"rgb(227,238,249)","28 - 42":"rgb(208,225,242)","42 - 56":"rgb(182,212,233)","56 - 70":"rgb(148,196,223)","70 - 84":"rgb(107,174,214)","84 - 98":"rgb(74,152,201)","98 - 112":"rgb(46,126,188)","112 - 126":"rgb(23,100,171)","126 - 140":"rgb(8,74,145)"}}}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","filter":[],"query":{"language":"lucene","query":""}}'
      }
    },
    _type: 'visualization'
  },
  {
    _id: 'Wazuh-App-Agents-CA-Checks-over-time',
    _source: {
      title: 'Checks over time',
      visState:
        '{"title":"Checks over time","type":"histogram","params":{"type":"histogram","grid":{"categoryLines":true,"style":{"color":"#eee"},"valueAxis":"ValueAxis-1"},"categoryAxes":[{"id":"CategoryAxis-1","type":"category","position":"bottom","show":true,"style":{},"scale":{"type":"linear"},"labels":{"show":true,"truncate":100},"title":{}}],"valueAxes":[{"id":"ValueAxis-1","name":"LeftAxis-1","type":"value","position":"left","show":true,"style":{},"scale":{"type":"linear","mode":"normal"},"labels":{"show":true,"rotate":0,"filter":false,"truncate":100},"title":{"text":"Alerts"}},{"id":"ValueAxis-2","name":"RightAxis-1","type":"value","position":"right","show":true,"style":{},"scale":{"type":"linear","mode":"normal"},"labels":{"show":true,"rotate":0,"filter":false,"truncate":100},"title":{"text":"Unique SCA checks"}}],"seriesParams":[{"show":"true","type":"histogram","mode":"stacked","data":{"label":"Alerts","id":"1"},"valueAxis":"ValueAxis-1","drawLinesBetweenPoints":true,"showCircles":true},{"show":true,"mode":"stacked","type":"line","drawLinesBetweenPoints":false,"showCircles":true,"interpolate":"linear","data":{"id":"3","label":"Unique SCA checks"},"valueAxis":"ValueAxis-2"}],"addTooltip":true,"addLegend":true,"legendPosition":"right","times":[],"addTimeMarker":false},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{"customLabel":"Alerts"}},{"id":"2","enabled":true,"type":"date_histogram","schema":"segment","params":{"field":"@timestamp","timeRange":{"from":"now-1h","to":"now","mode":"quick"},"useNormalizedEsInterval":true,"interval":"auto","time_zone":"Europe/Berlin","drop_partials":false,"customInterval":"2h","min_doc_count":1,"extended_bounds":{}}},{"id":"3","enabled":true,"type":"cardinality","schema":"metric","params":{"field":"data.sca.check.id","customLabel":"Unique SCA checks"}},{"id":"4","enabled":true,"type":"count","schema":"radius","params":{}}]}',
      uiStateJSON: '{"vis":{"legendOpen":false}}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","query":{"query":"","language":"lucene"},"filter":[{"meta":{"index":"wazuh-alerts","negate":false,"disabled":false,"alias":null,"type":"phrase","key":"data.sca.check.result","value":"passed","params":{"query":"passed","type":"phrase"}},"query":{"match":{"data.sca.check.result":{"query":"passed","type":"phrase"}}},"$state":{"store":"appState"}}]}'
      }
    },
    _type: 'visualization'
  },
  {
    _id: 'Wazuh-App-Agents-CA-Passed-vs-failed',
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
    _id: 'Wazuh-App-Agents-CA-Alerts-summary',
    _type: 'visualization',
    _source: {
      title: 'Alerts summary',
      visState:
        '{"title":"Alerts summary","type":"table","params":{"perPage":10,"showPartialRows":false,"showMetricsAtAllLevels":false,"sort":{"columnIndex":null,"direction":null},"showTotal":false,"totalFunc":"sum"},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"4","enabled":true,"type":"terms","schema":"bucket","params":{"field":"data.sca.check.id","size":30,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing","customLabel":"ID"}},{"id":"3","enabled":true,"type":"terms","schema":"bucket","params":{"field":"data.sca.check.description","size":30,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing","customLabel":"Reason"}},{"id":"2","enabled":true,"type":"terms","schema":"bucket","params":{"field":"data.sca.check.remediation","size":50,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing","customLabel":"Remediation"}}]}',
      uiStateJSON:
        '{"vis":{"params":{"sort":{"columnIndex":null,"direction":null}}}}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","filter":[],"query":{"query":"","language":"lucene"}}'
      }
    }
  }
];
