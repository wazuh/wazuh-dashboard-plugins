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
      title: 'Alerts over time',
      visState:
        '{"title":"Alerts over time","type":"metrics","params":{"id":"61ca57f0-469d-11e7-af02-69e470af7417","type":"timeseries","series":[{"id":"61ca57f1-469d-11e7-af02-69e470af7417","color":"rgba(0,156,224,1)","split_mode":"terms","metrics":[{"id":"61ca57f2-469d-11e7-af02-69e470af7417","type":"count"}],"separate_axis":0,"axis_position":"right","formatter":"number","chart_type":"line","line_width":1,"point_size":1,"fill":0.5,"stacked":"none","terms_field":"data.sca.policy_id","terms_size":"5","terms_order_by":"_count","label":"Alerts"}],"time_field":"@timestamp","index_pattern":"wazuh-alerts","interval":"auto","axis_position":"left","axis_formatter":"number","axis_scale":"normal","show_legend":1,"show_grid":1,"gauge_color_rules":[{"id":"414efe60-3753-11e9-8d90-91d4615ec8c6"}],"gauge_width":10,"gauge_inner_width":10,"gauge_style":"half","bar_color_rules":[{"value":0,"id":"4220f460-3753-11e9-8d90-91d4615ec8c6","bar_color":null}],"drilldown_url":"","filter":"","background_color":null,"background_color_rules":[{"id":"74c34bc0-3753-11e9-8d90-91d4615ec8c6"}]},"aggs":[]}',
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
    _id: 'Wazuh-App-Agents-CA-Top-5-CIS-Requirements',
    _source: {
      title: 'Top 5 CIS Requirements',
      visState:
        '{"title":"Top 5 CIS Requirements","type":"pie","params":{"type":"pie","addTooltip":true,"addLegend":true,"legendPosition":"right","isDonut":true},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"terms","schema":"segment","params":{"field":"data.sca.check.compliance.cis","size":5,"order":"desc","orderBy":"1"}}]}',
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
    _id: 'Wazuh-App-Agents-CA-Top-5-PCI-DSS-Requirements-passed',
    _source: {
      title: 'Top 5 PCI DSS Requirements passed',
      visState:
        '{"title":"Top 5 PCI DSS Requirements passed","type":"pie","params":{"type":"pie","addTooltip":true,"addLegend":true,"legendPosition":"right","isDonut":true,"labels":{"show":false,"values":true,"last_level":true,"truncate":100}},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"terms","schema":"segment","params":{"field":"data.sca.check.compliance.pci_dss","size":5,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"}}]}',
      uiStateJSON: '{}',
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
    _id: 'Wazuh-App-Agents-CA-Top-5-PCI-DSS-Requirements-failed',
    _source: {
      title: 'Top 5 PCI DSS Requirements failed',
      visState:
        '{"title":"Top 5 PCI DSS Requirements failed","type":"pie","params":{"type":"pie","addTooltip":true,"addLegend":true,"legendPosition":"right","isDonut":true,"labels":{"show":false,"values":true,"last_level":true,"truncate":100}},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"terms","schema":"segment","params":{"field":"data.sca.check.compliance.pci_dss","size":5,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"}}]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","query":{"query":"","language":"lucene"},"filter":[{"meta":{"index":"wazuh-alerts","negate":false,"disabled":false,"alias":null,"type":"phrase","key":"data.sca.check.result","value":"failed","params":{"query":"failed","type":"phrase"}},"query":{"match":{"data.sca.check.result":{"query":"failed","type":"phrase"}}},"$state":{"store":"appState"}}]}'
      }
    },
    _type: 'visualization'
  },
  {
    _id: 'Wazuh-App-Agents-CA-Top-5-CIS-CSC-Requirements-passed',
    _source: {
      title: 'Top 5 PCI DSS Requirements passed',
      visState:
        '{"title":"Top 5 PCI DSS Requirements passed","type":"pie","params":{"type":"pie","addTooltip":true,"addLegend":true,"legendPosition":"right","isDonut":true,"labels":{"show":false,"values":true,"last_level":true,"truncate":100}},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"terms","schema":"segment","params":{"field":"data.sca.check.compliance.cis_csc","size":5,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"}}]}',
      uiStateJSON: '{}',
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
    _id: 'Wazuh-App-Agents-CA-Top-5-CIS-CSC-Requirements-failed',
    _source: {
      title: 'Top 5 PCI DSS Requirements failed',
      visState:
        '{"title":"Top 5 PCI DSS Requirements failed","type":"pie","params":{"type":"pie","addTooltip":true,"addLegend":true,"legendPosition":"right","isDonut":true,"labels":{"show":false,"values":true,"last_level":true,"truncate":100}},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"terms","schema":"segment","params":{"field":"data.sca.check.compliance.cis_csc","size":5,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"}}]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","query":{"query":"","language":"lucene"},"filter":[{"meta":{"index":"wazuh-alerts","negate":false,"disabled":false,"alias":null,"type":"phrase","key":"data.sca.check.result","value":"failed","params":{"query":"failed","type":"phrase"}},"query":{"match":{"data.sca.check.result":{"query":"failed","type":"phrase"}}},"$state":{"store":"appState"}}]}'
      }
    },
    _type: 'visualization'
  },
  {
    _id: 'Wazuh-App-Agents-CA-Top-5-CIS-Requirements-passed',
    _source: {
      title: 'Top 5 PCI DSS Requirements passed',
      visState:
        '{"title":"Top 5 PCI DSS Requirements passed","type":"pie","params":{"type":"pie","addTooltip":true,"addLegend":true,"legendPosition":"right","isDonut":true,"labels":{"show":false,"values":true,"last_level":true,"truncate":100}},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"terms","schema":"segment","params":{"field":"data.sca.check.compliance.cis","size":5,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"}}]}',
      uiStateJSON: '{}',
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
    _id: 'Wazuh-App-Agents-CA-Top-5-CIS-Requirements-failed',
    _source: {
      title: 'Top 5 PCI DSS Requirements failed',
      visState:
        '{"title":"Top 5 PCI DSS Requirements failed","type":"pie","params":{"type":"pie","addTooltip":true,"addLegend":true,"legendPosition":"right","isDonut":true,"labels":{"show":false,"values":true,"last_level":true,"truncate":100}},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"terms","schema":"segment","params":{"field":"data.sca.check.compliance.cis","size":5,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"}}]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","query":{"query":"","language":"lucene"},"filter":[{"meta":{"index":"wazuh-alerts","negate":false,"disabled":false,"alias":null,"type":"phrase","key":"data.sca.check.result","value":"failed","params":{"query":"failed","type":"phrase"}},"query":{"match":{"data.sca.check.result":{"query":"failed","type":"phrase"}}},"$state":{"store":"appState"}}]}'
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
        '{"title":"Alerts summary","type":"table","params":{"perPage":10,"showPartialRows":false,"showMetricsAtAllLevels":false,"sort":{"columnIndex":null,"direction":null},"showTotal":false,"totalFunc":"sum"},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"terms","schema":"bucket","params":{"field":"data.sca.check.remediation","size":10,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing","customLabel":"Change required"}},{"id":"3","enabled":true,"type":"terms","schema":"bucket","params":{"field":"data.sca.check.rationale","size":1,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing","customLabel":"Reason"}}]}',
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
