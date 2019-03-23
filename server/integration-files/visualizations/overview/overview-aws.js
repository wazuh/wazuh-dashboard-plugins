/*
 * Wazuh app - Module for Overview/AWS visualizations
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
    _id: 'Wazuh-App-Overview-AWS-Top-5-rules',
    _type: 'visualization',
    _source: {
      title: 'Top 5 rules',
      visState:
        '{"title":"Top 5 rules","type":"table","params":{"perPage":10,"showPartialRows":false,"showMetricsAtAllLevels":false,"sort":{"columnIndex":null,"direction":null},"showTotal":false,"totalFunc":"sum"},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"terms","schema":"bucket","params":{"field":"rule.id","size":5,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing","customLabel":"Rule ID"}},{"id":"3","enabled":true,"type":"terms","schema":"bucket","params":{"field":"rule.description","size":1,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing","customLabel":"Description"}}]}',
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
  /*{
    _id: 'Wazuh-App-Overview-AWS-geo',
    _type: 'visualization',
    _source: {
      title: 'AWS geolocation',
      visState:
        '{"title":"AWS geolocation","type":"tile_map","params":{"colorSchema":"Green to Red","mapType":"Shaded Circle Markers","isDesaturated":true,"addTooltip":true,"heatClusterSize":1.5,"legendPosition":"topright","mapZoom":2,"mapCenter":[0,0],"wms":{"enabled":false,"options":{"format":"image/png","transparent":true},"baseLayersAreLoaded":{},"tmsLayers":[{"id":"road_map","url":"https://tiles.maps.elastic.co/v2/default/{z}/{x}/{y}.png?elastic_tile_service_tos=agree&my_app_name=kibana&my_app_version=6.4.0","minZoom":0,"maxZoom":10,"attribution":"<p>&#169; <a href=\\"http://www.openstreetmap.org/copyright\\">OpenStreetMap</a> contributors | <a href=\\"https://www.elastic.co/elastic-maps-service\\">Elastic Maps Service</a></p>&#10;","subdomains":[]}],"selectedTmsLayer":{"id":"road_map","url":"https://tiles.maps.elastic.co/v2/default/{z}/{x}/{y}.png?elastic_tile_service_tos=agree&my_app_name=kibana&my_app_version=6.4.0","minZoom":0,"maxZoom":10,"attribution":"<p>&#169; <a href=\\"http://www.openstreetmap.org/copyright\\">OpenStreetMap</a> contributors | <a href=\\"https://www.elastic.co/elastic-maps-service\\">Elastic Maps Service</a></p>&#10;","subdomains":[]}}},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{"customLabel":""}},{"id":"2","enabled":true,"type":"geohash_grid","schema":"segment","params":{"field":"data.aws.service.action.networkConnectionAction.remoteIpDetails.geoLocation","autoPrecision":true,"isFilteredByCollar":true,"useGeocentroid":true,"mapZoom":2,"mapCenter":[0,0],"precision":2,"customLabel":""}}]}',
      uiStateJSON:
        '{"mapZoom":3,"mapCenter":[25.085598897064777,-57.30468750000001]}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","query":{"query":"","language":"lucene"},"filter":[]}'
      }
    }
  },*/
  {
    _id: 'Wazuh-App-Overview-AWS-Top-5-buckets',
    _type: 'visualization',
    _source: {
      title: 'AWS-Top-5-Buckets-table',
      visState:
        '{"title":"AWS-Top-5-Buckets-table","type":"table","params":{"perPage":10,"showPartialRows":false,"showMetricsAtAllLevels":false,"sort":{"columnIndex":null,"direction":null},"showTotal":false,"totalFunc":"sum"},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{"customLabel":"Alerts"}},{"id":"2","enabled":true,"type":"terms","schema":"bucket","params":{"field":"data.aws.log_info.s3bucket","size":5,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing","customLabel":"Bucket"}}]}',
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
    _id: 'Wazuh-App-Overview-AWS-Events-by-source',
    _type: 'visualization',
    _source: {
      title: 'Events by source over time',
      visState:
        '{"title":"Events by source over time","type":"metrics","params":{"id":"61ca57f0-469d-11e7-af02-69e470af7417","type":"timeseries","series":[{"id":"61ca57f1-469d-11e7-af02-69e470af7417","color":"rgba(0,156,224,1)","split_mode":"terms","metrics":[{"id":"61ca57f2-469d-11e7-af02-69e470af7417","type":"count"}],"separate_axis":0,"axis_position":"right","split_color_mode":"rainbow","formatter":"number","chart_type":"bar","line_width":1,"point_size":1,"fill":0.9,"stacked":"stacked","terms_field":"data.aws.source","terms_size":"16"}],"time_field":"@timestamp","index_pattern":"wazuh-alerts","interval":"auto","axis_position":"left","axis_formatter":"number","axis_scale":"normal","show_legend":1,"show_grid":1,"background_color":null,"background_color_rules":[{"id":"2eaf6f30-367a-11e9-a875-698afd42ed2c"}],"bar_color_rules":[{"id":"2f685ef0-367a-11e9-a875-698afd42ed2c"}],"gauge_color_rules":[{"id":"339f78f0-367a-11e9-a875-698afd42ed2c"}],"gauge_width":10,"gauge_inner_width":10,"gauge_style":"half"},"aggs":[]}',
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
    _id: 'Wazuh-App-Overview-AWS-Top-accounts',
    _type: 'visualization',
    _source: {
      title: 'Accounts',
      visState:
        '{"title":"Accounts","type":"pie","params":{"type":"pie","addTooltip":true,"addLegend":true,"legendPosition":"right","isDonut":true,"labels":{"show":false,"values":true,"last_level":true,"truncate":100}},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"terms","schema":"segment","params":{"field":"data.aws.aws_account_id","size":5,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"}}]}',
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
    _id: 'Wazuh-App-Overview-AWS-Top-sources',
    _type: 'visualization',
    _source: {
      title: 'Sources',
      visState:
        '{"title":"Sources","type":"pie","params":{"type":"pie","addTooltip":true,"addLegend":true,"legendPosition":"right","isDonut":true,"labels":{"show":false,"values":true,"last_level":true,"truncate":100}},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"terms","schema":"segment","params":{"field":"data.aws.source","size":5,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"}}]}',
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
    _id: 'Wazuh-App-Overview-AWS-Top-buckets',
    _type: 'visualization',
    _source: {
      title: 'Buckets',
      visState:
        '{"title":"Buckets","type":"pie","params":{"type":"pie","addTooltip":true,"addLegend":true,"legendPosition":"right","isDonut":true,"labels":{"show":false,"values":true,"last_level":true,"truncate":100}},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"terms","schema":"segment","params":{"field":"data.aws.log_info.s3bucket","size":5,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"}}]}',
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
    _id: 'Wazuh-App-Overview-AWS-Top-regions',
    _type: 'visualization',
    _source: {
      title: 'Regions',
      visState:
        '{"title":"Regions","type":"pie","params":{"type":"pie","addTooltip":true,"addLegend":true,"legendPosition":"right","isDonut":true,"labels":{"show":false,"values":true,"last_level":true,"truncate":100}},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"terms","schema":"segment","params":{"field":"data.aws.awsRegion","size":5,"order":"desc","orderBy":"1","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing"}}]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","query":{"query":"","language":"lucene"},"filter":[]}'
      }
    }
  },
  /*{
    _id: 'Wazuh-App-Overview-AWS-Service-selector',
    _type: 'visualization',
    _source: {
      title: 'Service selector',
      visState:
        '{"title":"Service selector","type":"input_control_vis","params":{"controls":[{"id":"1543502225381","indexPattern":"wazuh-alerts","fieldName":"data.aws.service.serviceName","parent":"","label":"Service","type":"list","options":{"type":"terms","multiselect":true,"dynamicOptions":true,"size":5,"order":"desc"}}],"updateFiltersOnChange":true,"useTimeFilter":true,"pinFilters":false},"aggs":[]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","query":{"query":"","language":"lucene"},"filter":[]}'
      }
    }
  },*/
  {
    _id: 'Wazuh-App-Overview-AWS-Events-by-s3-bucket',
    _type: 'visualization',
    _source: {
      title: 'Events by S3 bucket over time',
      visState:
        '{"title":"Events by S3 bucket over time","type":"metrics","params":{"id":"61ca57f0-469d-11e7-af02-69e470af7417","type":"timeseries","series":[{"id":"61ca57f1-469d-11e7-af02-69e470af7417","color":"rgba(0,156,224,1)","split_mode":"terms","metrics":[{"id":"61ca57f2-469d-11e7-af02-69e470af7417","type":"count"}],"separate_axis":0,"axis_position":"right","split_color_mode":"rainbow","formatter":"number","chart_type":"bar","line_width":1,"point_size":1,"fill":0.9,"stacked":"stacked","terms_field":"data.aws.log_info.s3bucket","terms_size":"16"}],"time_field":"@timestamp","index_pattern":"wazuh-alerts","interval":"auto","axis_position":"left","axis_formatter":"number","axis_scale":"normal","show_legend":1,"show_grid":1,"background_color":null,"background_color_rules":[{"id":"2eaf6f30-367a-11e9-a875-698afd42ed2c"}],"bar_color_rules":[{"id":"2f685ef0-367a-11e9-a875-698afd42ed2c"}],"gauge_color_rules":[{"id":"339f78f0-367a-11e9-a875-698afd42ed2c"}],"gauge_width":10,"gauge_inner_width":10,"gauge_style":"half"},"aggs":[]}',
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
