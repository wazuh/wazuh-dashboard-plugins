/*
 * Wazuh app - Module for Overview/PCI visualizations
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
    _id: 'Wazuh-App-Overview-MITRE',
    _source: {
      title: 'Mitre attack',
      visState:
      '{"aggs":[{"enabled":true,"id":"1","params":{},"schema":"metric","type":"count"},{"enabled":true,"id":"2","params":{"field":"rule.mitre.id","missingBucket":false,"missingBucketLabel":"Missing","order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","size":5},"schema":"bucket","type":"terms"}],"params":{"dimensions":{"buckets":[],"metrics":[{"accessor":0,"aggType":"count","format":{"id":"number"},"params":{}}]},"perPage":10,"percentageCol":"","showMetricsAtAllLevels":false,"showPartialRows":false,"showTotal":false,"sort":{"columnIndex":null,"direction":null},"totalFunc":"sum"},"title":"mitre","type":"table"}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","filter":[],"query":{"language":"lucene","query":""}}'
      }
    },
    _type: 'visualization'
  },
  
];
