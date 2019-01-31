/*
 * Wazuh app - Module for Overview/FIM visualizations
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
    _id: 'Wazuh-App-Overview-FIM-Events-summary',
    _type: 'visualization',
    _source: {
      title: 'Events summary',
      visState:
        '{"title":"Events summary","type":"line","params":{"type":"line","grid":{"categoryLines":false,"style":{"color":"#eee"}},"categoryAxes":[{"id":"CategoryAxis-1","type":"category","position":"bottom","show":true,"style":{},"scale":{"type":"linear"},"labels":{"show":true,"truncate":100},"title":{}}],"valueAxes":[{"id":"ValueAxis-1","name":"LeftAxis-1","type":"value","position":"left","show":true,"style":{},"scale":{"type":"linear","mode":"normal"},"labels":{"show":true,"rotate":0,"filter":false,"truncate":100},"title":{"text":"Alerts"}}],"seriesParams":[{"show":"true","type":"line","mode":"normal","data":{"label":"Alerts","id":"1"},"valueAxis":"ValueAxis-1","drawLinesBetweenPoints":true,"showCircles":true}],"addTooltip":true,"addLegend":true,"legendPosition":"right","times":[],"addTimeMarker":false},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{"customLabel":"Alerts"}},{"id":"2","enabled":true,"type":"date_histogram","schema":"segment","params":{"field":"@timestamp"}}]}',
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
    _id: 'Wazuh-App-Overview-FIM-Top-5-rules',
    _type: 'visualization',
    _source: {
      title: 'Top 5 rules',
      visState:
        '{"title":"Top 5 rules","type":"table","params":{"perPage":10,"showPartialRows":false,"showMetricsAtAllLevels":false,"sort":{"columnIndex":null,"direction":null},"showTotal":false,"totalFunc":"sum"},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"terms","schema":"bucket","params":{"field":"rule.id","size":3,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing","customLabel":"Rule"}},{"id":"3","enabled":true,"type":"terms","schema":"bucket","params":{"field":"rule.description","size":5,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing","customLabel":"Description"}}]}',
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
    _id: 'Wazuh-App-Overview-FIM-Top-5-agents-pie',
    _type: 'visualization',
    _source: {
      title: 'Top 5 agents pie',
      visState:
        '{"title":"Top 5 agents pie","type":"pie","params":{"type":"pie","addTooltip":true,"addLegend":true,"legendPosition":"right","isDonut":true,"labels":{"show":false,"values":true,"last_level":true,"truncate":100}},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"terms","schema":"segment","params":{"field":"agent.name","size":5,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"}}]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","query":{"language":"lucene","query":""},"filter":[]}'
      }
    }
  },
  {
    _id: 'Wazuh-App-Overview-FIM-Whodata-usage',
    _type: 'visualization',
    _source: {
      title: 'Whodata usage',
      visState:
        '{"title":"Whodata usage","type":"area","params":{"addLegend":false,"addTimeMarker":false,"addTooltip":false,"categoryAxes":[{"id":"CategoryAxis-1","labels":{"show":true,"truncate":100,"rotate":0},"position":"bottom","scale":{"type":"linear"},"show":true,"style":{},"title":{},"type":"category"}],"grid":{"categoryLines":false,"style":{"color":"#eee"}},"legendPosition":"right","seriesParams":[{"data":{"id":"1","label":"Count"},"drawLinesBetweenPoints":true,"interpolate":"linear","mode":"normal","show":"true","showCircles":true,"type":"histogram","valueAxis":"ValueAxis-1"}],"times":[],"type":"area","valueAxes":[{"id":"ValueAxis-1","labels":{"filter":false,"rotate":0,"show":true,"truncate":100},"name":"LeftAxis-1","position":"left","scale":{"mode":"normal","type":"linear"},"show":true,"style":{},"title":{"text":"Count"},"type":"value"}]},"aggs":[{"id":"1","enabled":true,"type":"cardinality","schema":"metric","params":{"field":"agent.name","customLabel":"Count"}},{"id":"2","enabled":true,"type":"filters","schema":"segment","params":{"filters":[{"input":{"query":""},"label":"Agents"},{"input":{"query":"_exists_:syscheck.audit.effective_user.name"},"label":"Agents using whodata"}]}}]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","query":{"language":"lucene","query":""},"filter":[]}'
      }
    }
  },
  {
    _id: 'Wazuh-App-Overview-FIM-deleted',
    _type: 'visualization',
    _source: {
      title: 'Top deleted',
      visState:
        '{"title":"Top deleted","type":"pie","params":{"type":"pie","addTooltip":true,"addLegend":true,"legendPosition":"right","isDonut":true,"labels":{"show":false,"values":true,"last_level":true,"truncate":100}},"aggs":[{"id":"1","enabled":true,"type":"cardinality","schema":"metric","params":{"field":"syscheck.path"}},{"id":"2","enabled":true,"type":"terms","schema":"segment","params":{"field":"agent.name","size":5,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"}}]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","query":{"query":"","language":"lucene"},"filter":[{"meta":{"index":"wazuh-alerts","negate":false,"disabled":false,"alias":null,"type":"phrase","key":"syscheck.event","value":"deleted","params":{"query":"deleted","type":"phrase"}},"query":{"match":{"syscheck.event":{"query":"deleted","type":"phrase"}}},"$state":{"store":"appState"}}]}'
      }
    }
  },
  {
    _id: 'Wazuh-App-Overview-FIM-added',
    _type: 'visualization',
    _source: {
      title: 'Top added',
      visState:
        '{"title":"Top added","type":"pie","params":{"type":"pie","addTooltip":true,"addLegend":true,"legendPosition":"right","isDonut":true,"labels":{"show":false,"values":true,"last_level":true,"truncate":100}},"aggs":[{"id":"1","enabled":true,"type":"cardinality","schema":"metric","params":{"field":"syscheck.path"}},{"id":"2","enabled":true,"type":"terms","schema":"segment","params":{"field":"agent.name","size":5,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"}}]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","query":{"query":"","language":"lucene"},"filter":[{"meta":{"index":"wazuh-alerts","negate":false,"disabled":false,"alias":null,"type":"phrase","key":"rule.groups","value":"syscheck","params":{"query":"syscheck","type":"phrase"}},"query":{"match":{"rule.groups":{"query":"syscheck","type":"phrase"}}},"$state":{"store":"appState"}},{"meta":{"index":"wazuh-alerts","negate":false,"disabled":false,"alias":null,"type":"range","key":"rule.level","value":"7 to 16","params":{"gte":7,"lt":16}},"range":{"rule.level":{"gte":7,"lt":16}},"$state":{"store":"appState"}}]}'
      }
    }
  },
  {
    _id: 'Wazuh-App-Overview-FIM-modified',
    _type: 'visualization',
    _source: {
      title: 'Top modified',
      visState:
        '{"title":"Top modified","type":"pie","params":{"type":"pie","addTooltip":true,"addLegend":true,"legendPosition":"right","isDonut":true,"labels":{"show":false,"values":true,"last_level":true,"truncate":100}},"aggs":[{"id":"1","enabled":true,"type":"cardinality","schema":"metric","params":{"field":"syscheck.path"}},{"id":"2","enabled":true,"type":"terms","schema":"segment","params":{"field":"agent.name","size":5,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"}}]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","query":{"query":"","language":"lucene"},"filter":[{"meta":{"index":"wazuh-alerts","negate":false,"disabled":false,"alias":null,"type":"phrase","key":"syscheck.event","value":"modified","params":{"query":"modified","type":"phrase"}},"query":{"match":{"syscheck.event":{"query":"modified","type":"phrase"}}},"$state":{"store":"appState"}}]}'
      }
    }
  },
  {
    _id: 'Wazuh-App-Overview-FIM-top-agents-user',
    _type: 'visualization',
    _source: {
      title: 'Top users',
      visState:
        '{"title":"Top users","type":"table","params":{"perPage":10,"showPartialRows":false,"showMetricsAtAllLevels":false,"sort":{"columnIndex":null,"direction":null},"showTotal":false,"totalFunc":"sum"},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"terms","schema":"bucket","params":{"field":"agent.id","size":5,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing","customLabel":"Agent ID"}},{"id":"3","enabled":true,"type":"terms","schema":"bucket","params":{"field":"agent.name","size":5,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing","customLabel":"Agent name"}},{"id":"4","enabled":true,"type":"terms","schema":"bucket","params":{"field":"syscheck.audit.effective_user.name","size":1,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing","customLabel":"Top user"}}]}',
      uiStateJSON:
        '{"vis":{"params":{"sort":{"columnIndex":null,"direction":null}}}}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","query":{"query":"","language":"lucene"},"filter":[{"meta":{"index":"wazuh-alerts","negate":false,"disabled":false,"alias":null,"type":"phrase","key":"rule.groups","value":"syscheck","params":{"query":"syscheck","type":"phrase"}},"query":{"match":{"rule.groups":{"query":"syscheck","type":"phrase"}}},"$state":{"store":"appState"}}]}'
      }
    }
  }
];
