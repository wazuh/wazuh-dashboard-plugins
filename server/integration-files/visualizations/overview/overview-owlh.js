/*
 * Wazuh app - Module for Overview/Osquery visualizations
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
    _id: 'Wazuh-App-Overview-Owlh-Alerts-severity',
    _type: 'visualization',
    _source: {
      title: 'Alerts severity',
      visState:
        '{"title":"Alerts severity","type":"pie","params":{"type":"pie","addTooltip":true,"addLegend":true,"legendPosition":"right","isDonut":true,"labels":{"show":false,"values":true,"last_level":true,"truncate":100}},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"significant_terms","schema":"segment","params":{"field":"data.alert.severity","size":5}},{"id":"3","enabled":true,"type":"significant_terms","schema":"segment","params":{"field":"data.alert.signature_id","size":1}}]}',
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
    _id: 'Wazuh-App-Overview-Owlh-Alert-categories',
    _type: 'visualization',
    _source: {
      title: 'Alert categories',
      visState:
        '{"title":"Alert categories","type":"table","params":{"perPage":10,"showPartialRows":false,"showMetricsAtAllLevels":false,"sort":{"columnIndex":null,"direction":null},"showTotal":false,"totalFunc":"sum"},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"significant_terms","schema":"bucket","params":{"field":"data.alert.category","size":5,"customLabel":"Top Categories"}}]}',
      uiStateJSON:
        '{"vis":{"params":{"sort":{"columnIndex":1,"direction":"desc"}}}}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","query":{"query":"","language":"lucene"},"filter":[]}'
      }
    }
  },
  {
    _id: 'Wazuh-App-Overview-Owlh-Top-signature-ID',
    _type: 'visualization',
    _source: {
      title: 'Top signature ID',
      visState:
        '{"title":"Top signature ID","type":"horizontal_bar","params":{"type":"histogram","grid":{"categoryLines":false,"style":{"color":"#eee"}},"categoryAxes":[{"id":"CategoryAxis-1","type":"category","position":"left","show":true,"style":{},"scale":{"type":"linear"},"labels":{"show":true,"rotate":0,"filter":false,"truncate":200},"title":{}}],"valueAxes":[{"id":"ValueAxis-1","name":"LeftAxis-1","type":"value","position":"bottom","show":false,"style":{},"scale":{"type":"linear","mode":"normal"},"labels":{"show":true,"rotate":75,"filter":true,"truncate":100},"title":{"text":"Count"}}],"seriesParams":[{"show":true,"type":"histogram","mode":"normal","data":{"label":"Count","id":"1"},"valueAxis":"ValueAxis-1","drawLinesBetweenPoints":true,"showCircles":true}],"addTooltip":false,"addLegend":true,"legendPosition":"right","times":[],"addTimeMarker":false,"orderBucketsBySum":true},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"significant_terms","schema":"segment","params":{"field":"data.alert.signature_id","size":5,"customLabel":"Signature ID"}}]}',
      uiStateJSON: '{"vis":{"legendOpen":false}}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","query":{"query":"","language":"lucene"},"filter":[]}'
      }
    }
  },
  {
    _id: 'Wazuh-App-Overview-Owlh-Alerts-summary',
    _type: 'visualization',
    _source: {
      title: 'Alerts summary',
      visState:
        '{"title":"Alerts summary","type":"table","params":{"perPage":30,"showPartialRows":false,"showMetricsAtAllLevels":false,"sort":{"columnIndex":2,"direction":"desc"},"showTotal":false,"totalFunc":"sum"},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"significant_terms","schema":"bucket","params":{"field":"data.alert.signature","size":5,"customLabel":"Alert - Signature Name"}},{"id":"3","enabled":true,"type":"significant_terms","schema":"bucket","params":{"field":"data.alert.signature_id","size":1,"customLabel":"Signature ID"}},{"id":"4","enabled":true,"type":"significant_terms","schema":"bucket","params":{"field":"data.alert.severity","size":1,"customLabel":"Severity"}},{"id":"5","enabled":true,"type":"significant_terms","schema":"bucket","params":{"field":"data.alert.category","size":1,"customLabel":"Category"}}]}',
      uiStateJSON:
        '{"vis":{"params":{"sort":{"columnIndex":2,"direction":"desc"}}}}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","query":{"query":"","language":"lucene"},"filter":[]}'
      }
    }
  },
  {
    _id: 'Wazuh-App-Overview-Owlh-NIDS-node',
    _type: 'visualization',
    _source: {
      title: 'NIDS node',
      visState:
        '{"title":"NIDS node","type":"table","params":{"perPage":2,"showPartialRows":false,"showMetricsAtAllLevels":false,"sort":{"columnIndex":null,"direction":null},"showTotal":false,"totalFunc":"sum"},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"significant_terms","schema":"bucket","params":{"field":"agent.name","size":5,"customLabel":"OwlH NIDS Node"}}]}',
      uiStateJSON:
        '{"vis":{"params":{"sort":{"columnIndex":null,"direction":null}}}}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","query":{"query":"","language":"lucene"},"filter":[]}'
      }
    }
  },
  {
    _id: 'Wazuh-App-Overview-Owlh-Alert-destination-IP',
    _type: 'visualization',
    _source: {
      title: 'Top destination IP',
      visState:
        '{"title":"Top destination ip","type":"pie","params":{"type":"pie","addTooltip":true,"addLegend":true,"legendPosition":"right","isDonut":true,"labels":{"show":false,"values":true,"last_level":true,"truncate":100}},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"terms","schema":"segment","params":{"field":"data.dest_ip","size":5,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"}}]}',
      uiStateJSON:
        '{"vis":{"params":{"sort":{"columnIndex":1,"direction":"desc"}}}}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","query":{"query":"","language":"lucene"},"filter":[]}'
      }
    }
  },
  {
    _id: 'Wazuh-App-Overview-Owlh-Alert-source-IP',
    _type: 'visualization',
    _source: {
      title: 'Top source IP',
      visState:
        '{"title":"Top source ip","type":"pie","params":{"type":"pie","addTooltip":true,"addLegend":true,"legendPosition":"right","isDonut":true,"labels":{"show":false,"values":true,"last_level":true,"truncate":100}},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"terms","schema":"segment","params":{"field":"data.src_ip","size":5,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"}}]}',
      uiStateJSON:
        '{"vis":{"params":{"sort":{"columnIndex":1,"direction":"desc"}}}}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","query":{"query":"","language":"lucene"},"filter":[]}'
      }
    }
  },
  {
    _id: 'Wazuh-App-Overview-Owlh-Alerts-over-time',
    _type: 'visualization',
    _source: {
      title: 'Alerts over time',
      visState:
        '{"title":"Alerts over time","type":"histogram","params":{"type":"histogram","grid":{"categoryLines":false,"style":{"color":"#eee"}},"categoryAxes":[{"id":"CategoryAxis-1","type":"category","position":"bottom","show":true,"style":{},"scale":{"type":"linear"},"labels":{"show":true,"truncate":100},"title":{}}],"valueAxes":[{"id":"ValueAxis-1","name":"LeftAxis-1","type":"value","position":"left","show":true,"style":{},"scale":{"type":"linear","mode":"normal"},"labels":{"show":true,"rotate":0,"filter":false,"truncate":100},"title":{"text":"Count"}}],"seriesParams":[{"show":"true","type":"histogram","mode":"stacked","data":{"label":"Count","id":"1"},"valueAxis":"ValueAxis-1","drawLinesBetweenPoints":true,"showCircles":true}],"addTooltip":true,"addLegend":true,"legendPosition":"right","times":[],"addTimeMarker":false},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"date_histogram","schema":"segment","params":{"field":"@timestamp","useNormalizedEsInterval":true,"interval":"auto","time_zone":"UTC","drop_partials":false,"customInterval":"2h","min_doc_count":1,"extended_bounds":{},"customLabel":"Alerts"}}]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","query":{"query":"","language":"lucene"},"filter":[]}'
      }
    }
  }
];
