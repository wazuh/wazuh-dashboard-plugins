/*
 * Wazuh app - Cluster monitoring visualizations
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
    _id: 'Wazuh-App-Cluster-monitoring-Overview',
    _type: 'visualization',
    _source: {
      title: 'Wazuh App Cluster Overview',
      visState:
        '{"title":"Wazuh App Cluster Overview","type":"timelion","params":{"expression":".es(*)","interval":"auto"},"aggs":[]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","filter":[],"query":{"query":"","language":"lucene"}}'
      }
    }
  },
  {
    _id: 'Wazuh-App-Cluster-monitoring-Overview-Manager',
    _type: 'visualization',
    _source: {
      title: 'Wazuh App Cluster Overview Manager',
      visState:
        '{"title":"Wazuh App Cluster Overview Manager","type":"timelion","params":{"expression":".es(q=agent.id:000)","interval":"auto"},"aggs":[]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","filter":[],"query":{"query":"","language":"lucene"}}'
      }
    }
  },
  {
    _id: 'Wazuh-App-Cluster-monitoring-Overview-Node',
    _source: {
      title: 'Wazuh App Cluster Overview Node',
      visState:
        '{"title":"Wazuh App Cluster Overview Node","type":"histogram","params":{"type":"histogram","grid":{"categoryLines":false,"style":{"color":"#eee"}},"categoryAxes":[{"id":"CategoryAxis-1","type":"category","position":"bottom","show":true,"style":{},"scale":{"type":"linear"},"labels":{"show":true,"truncate":100},"title":{}}],"valueAxes":[{"id":"ValueAxis-1","name":"LeftAxis-1","type":"value","position":"left","show":true,"style":{},"scale":{"type":"linear","mode":"normal"},"labels":{"show":true,"rotate":0,"filter":false,"truncate":100},"title":{"text":"Count"}}],"seriesParams":[{"show":"true","type":"histogram","mode":"stacked","data":{"label":"Count","id":"1"},"valueAxis":"ValueAxis-1","drawLinesBetweenPoints":true,"showCircles":true}],"addTooltip":true,"addLegend":false,"legendPosition":"right","times":[],"addTimeMarker":false},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"date_histogram","schema":"segment","params":{"field":"timestamp","interval":"auto","customInterval":"2h","min_doc_count":1,"extended_bounds":{}}}]}',
      uiStateJSON:
        '{"spy":{"mode":{"name":null,"fill":false}},"vis":{"legendOpen":false}}',
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
    _id: 'Wazuh-App-Cluster-monitoring-Overview-Node-Pie',
    _type: 'visualization',
    _source: {
      title: 'Wazuh App Cluster Overview Node Pie',
      visState:
        '{"title":"Wazuh App Cluster Overview Node Pie","type":"pie","params":{"type":"pie","addTooltip":true,"addLegend":true,"legendPosition":"right","isDonut":true,"labels":{"show":false,"values":true,"last_level":true,"truncate":100}},"aggs":[{"id":"1","enabled":true,"type":"count","schema":"metric","params":{}},{"id":"2","enabled":true,"type":"terms","schema":"segment","params":{"field":"cluster.node","otherBucket":false,"otherBucketLabel":"Other","missingBucket":false,"missingBucketLabel":"Missing","size":5,"order":"desc","orderBy":"1"}}]}',
      uiStateJSON: '{"spy":{"mode":{"name":"table"}}}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-alerts","filter":[],"query":{"query":"","language":"lucene"}}'
      }
    }
  },
  { // Wazuh-App-Statistics-remoted-Recv-bytes
    _id: 'Wazuh-App-Statistics-remoted-Recv-bytes',
    _type: 'visualization',
    _source: {
      title: 'Wazuh App Statistics remoted Recv bytes',
      visState:
        '{"title":"Wazuh App Statistics remoted Recv bytes","type":"timelion","params":{"expression":".es(timefield=timestamp,metric=avg:remoted.recv_bytes).fit(mode=average).label(recv_bytes),.es(timefield=timestamp,metric=avg:remoted.recv_bytes).trend().label(Trend)","interval":"auto"},"aggs":[]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-statistic*","filter":[],"query":{"query":"","language":"lucene"}}'
      }
    }
  },
  { // Wazuh-App-Statistics-remoted-queue-size
    _id: 'Wazuh-App-Statistics-remoted-queue-size',
    _type: 'visualization',
    _source: {
      title: 'Wazuh App Statistics remoted queue size',
      visState:
        '{"title":"Wazuh App Statistics remoted queue size","type":"timelion","params":{"expression":".es(timefield=timestamp,metric=avg:remoted.total_queue_size).fit(mode=average).label(total_queue_size),.es(timefield=timestamp,metric=avg:remoted.queue_size).fit(mode=average).label(queue_size)","interval":"auto"},"aggs":[]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-statistic*","filter":[],"query":{"query":"","language":"lucene"}}'
      }
    }
  },
  { // Wazuh-App-Statistics-remoted-event-count
    _id: 'Wazuh-App-Statistics-remoted-event-count',
    _type: 'visualization',
    _source: {
      title: 'Wazuh App Statistics remoted event count',
      visState:
        '{"title":"Wazuh App Statistics remoted Recv bytes","type":"timelion","params":{"expression":".es(timefield=timestamp,metric=avg:remoted.evt_count).fit(mode=average).label(evt_count),.es(timefield=timestamp,metric=avg:remoted.evt_count).trend().label(Trend)","interval":"auto"},"aggs":[]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-statistic*","filter":[],"query":{"query":"","language":"lucene"}}'
      }
    }
  },
  { // Wazuh-App-Statistics-remoted-messages
    _id: 'Wazuh-App-Statistics-remoted-messages',
    _type: 'visualization',
    _source: {
      title: 'Wazuh App Statistics remoted messages',
      visState:
        '{"title":"Wazuh App Statistics remoted messages","type":"timelion","params":{"expression":".es(timefield=timestamp,metric=avg:remoted.msg_sent).fit(mode=average).label(msg_sent),.es(timefield=timestamp,metric=avg:remoted.ctrl_msg_count).fit(mode=average).label(ctrl_msg_count),.es(timefield=timestamp,metric=avg:remoted.discarded_count).fit(mode=average).label(discarded_count),","interval":"auto"},"aggs":[]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-statistic*","filter":[],"query":{"query":"","language":"lucene"}}'
      }
    }
  },
  { // Wazuh-App-Statistics-remoted-tcp-sessions
    _id: 'Wazuh-App-Statistics-remoted-tcp-sessions',
    _type: 'visualization',
    _source: {
      title: 'Wazuh App Statistics remoted tcp sessions',
      visState:
        '{"title":"Wazuh App Statistics remoted tcp sessions","type":"timelion","params":{"expression":".es(timefield=timestamp,metric=avg:remoted.tcp_sessions).fit(mode=average).label(tcp_sessions)","interval":"auto"},"aggs":[]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-statistic*","filter":[],"query":{"query":"","language":"lucene"}}'
      }
    }
  },
  { // Wazuh-App-Statistics-analysisd-alerts-queue
    _id: 'Wazuh-App-Statistics-analysisd-alerts-queue',
    _type: 'visualization',
    _source: {
      title: 'Wazuh App Statistics analysisd alerts queue',
      visState:
        '{"title":"Wazuh App Statistics analysisd alerts queue","type":"timelion","params":{"expression":".es(timefield=timestamp,metric=avg:analysisd.alerts_queue_size).fit(mode=average).label(alerts_queue_size),.es(timefield=timestamp,metric=avg:analysisd.alerts_queue_usage).fit(mode=average).label(alerts_queue_usage)","interval":"auto"},"aggs":[]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-statistic*","filter":[],"query":{"query":"","language":"lucene"}}'
      }
    }
  },
  { // Wazuh-App-Statistics-analysisd-alerts-written
    _id: 'Wazuh-App-Statistics-analysisd-alerts-written',
    _type: 'visualization',
    _source: {
      title: 'Wazuh App Statistics analysisd alerts written',
      visState:
        '{"title":"Wazuh App Statistics analysisd alerts written","type":"timelion","params":{"expression":".es(timefield=timestamp,metric=avg:analysisd.alerts_written).fit(mode=average).label(alerts_written)","interval":"auto"},"aggs":[]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-statistic*","filter":[],"query":{"query":"","language":"lucene"}}'
      }
    }
  },
  { // Wazuh-App-Statistics-analysisd-events-queue
    _id: 'Wazuh-App-Statistics-analysisd-events-queue',
    _type: 'visualization',
    _source: {
      title: 'Wazuh App Statistics analysisd events queue',
      visState:
        '{"title":"Wazuh App Statistics analysisd events queue","type":"timelion","params":{"expression":".es(timefield=timestamp,metric=avg:analysisd.event_queue_size).fit(mode=average).label(event_queue_size),.es(timefield=timestamp,metric=avg:analysisd.event_queue_usage).fit(mode=average).label(event_queue_usage),","interval":"auto"},"aggs":[]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-statistic*","filter":[],"query":{"query":"","language":"lucene"}}'
      }
    }
  },
  { // Wazuh-App-Statistics-analysisd-events-received
    _id: 'Wazuh-App-Statistics-analysisd-events-received',
    _type: 'visualization',
    _source: {
      title: 'Wazuh App Statistics analysisd events received',
      visState:
        '{"title":"Wazuh App Statistics analysisd events received","type":"timelion","params":{"expression":".es(timefield=timestamp,metric=avg:analysisd.events_received).fit(mode=average).label(events_received),.es(timefield=timestamp,metric=avg:analysisd.events_processed).fit(mode=average).label(events_processed),.es(timefield=timestamp,metric=avg:analysisd.events_dropped).fit(mode=average).label(events_dropped),.es(timefield=timestamp,metric=avg:analysisd.events_edps).fit(mode=average).label(events_edps),","interval":"auto"},"aggs":[]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-statistic*","filter":[],"query":{"query":"","language":"lucene"}}'
      }
    }
  },
  { // Wazuh-App-Statistics-analysisd-firewall-queue
    _id: 'Wazuh-App-Statistics-analysisd-firewall-queue',
    _type: 'visualization',
    _source: {
      title: 'Wazuh App Statistics analysisd firewall queue',
      visState:
        '{"title":"Wazuh App Statistics analysisd firewall queue","type":"timelion","params":{"expression":".es(timefield=timestamp,metric=avg:analysisd.firewall_queue_size).fit(mode=average).label(firewall_queue_size),.es(timefield=timestamp,metric=avg:analysisd.firewall_queue_usage).fit(mode=average).label(firewall_queue_usage),","interval":"auto"},"aggs":[]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-statistic*","filter":[],"query":{"query":"","language":"lucene"}}'
      }
    }
  },
  { // Wazuh-App-Statistics-analysisd-firewall-written
    _id: 'Wazuh-App-Statistics-analysisd-firewall-written',
    _type: 'visualization',
    _source: {
      title: 'Wazuh App Statistics analysisd firewall written',
      visState:
        '{"title":"Wazuh App Statistics analysisd firewall written","type":"timelion","params":{"expression":".es(timefield=timestamp,metric=avg:analysisd.firewall_written).fit(mode=average).label(firewall_written)","interval":"auto"},"aggs":[]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-statistic*","filter":[],"query":{"query":"","language":"lucene"}}'
      }
    }
  },
  { // Wazuh-App-Statistics-analysisd-hostinfo-queue
    _id: 'Wazuh-App-Statistics-analysisd-hostinfo-queue',
    _type: 'visualization',
    _source: {
      title: 'Wazuh App Statistics analysisd hostinfo queue',
      visState:
        '{"title":"Wazuh App Statistics analysisd hostinfo queue","type":"timelion","params":{"expression":".es(timefield=timestamp,metric=avg:analysisd.hostinfo_queue_size).fit(mode=average).label(hostinfo_queue_size),.es(timefield=timestamp,metric=avg:analysisd.hostinfo_queue_usage).fit(mode=average).label(hostinfo_queue_usage),","interval":"auto"},"aggs":[]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-statistic*","filter":[],"query":{"query":"","language":"lucene"}}'
      }
    }
  },
  { // Wazuh-App-Statistics-analysisd-hostinfo-event-decoded
    _id: 'Wazuh-App-Statistics-analysisd-hostinfo-event-decoded',
    _type: 'visualization',
    _source: {
      title: 'Wazuh App Statistics analysisd hostinfo event decoded',
      visState:
        '{"title":"Wazuh App Statistics analysisd hostinfo event decoded","type":"timelion","params":{"expression":".es(timefield=timestamp,metric=avg:analysisd.hostinfo_events_decoded).fit(mode=average).label(hostinfo_events_decoded),.es(timefield=timestamp,metric=avg:analysisd.hostinfo_edps).fit(mode=average).label(hostinfo_edps),","interval":"auto"},"aggs":[]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-statistic*","filter":[],"query":{"query":"","language":"lucene"}}'
      }
    }
  },
  { // Wazuh-App-Statistics-analysisd-rootcheck-queue
    _id: 'Wazuh-App-Statistics-analysisd-rootcheck-queue',
    _type: 'visualization',
    _source: {
      title: 'Wazuh App Statistics analysisd rootcheck queue',
      visState:
        '{"title":"Wazuh App Statistics analysisd rootcheck queue","type":"timelion","params":{"expression":".es(timefield=timestamp,metric=avg:analysisd.rootcheck_queue_size).fit(mode=average).label(rootcheck_queue_size),.es(timefield=timestamp,metric=avg:analysisd.rootcheck_queue_usage).fit(mode=average).label(rootcheck_queue_usage),","interval":"auto"},"aggs":[]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-statistic*","filter":[],"query":{"query":"","language":"lucene"}}'
      }
    }
  },
  { // Wazuh-App-Statistics-analysisd-rootcheck-event-decoded
    _id: 'Wazuh-App-Statistics-analysisd-rootcheck-event-decoded',
    _type: 'visualization',
    _source: {
      title: 'Wazuh App Statistics analysisd rootcheck event decoded',
      visState:
        '{"title":"Wazuh App Statistics analysisd rootcheck event decoded","type":"timelion","params":{"expression":".es(timefield=timestamp,metric=avg:analysisd.rootcheck_events_decoded).fit(mode=average).label(rootcheck_events_decoded),.es(timefield=timestamp,metric=avg:analysisd.rootcheck_edps).fit(mode=average).label(rootcheck_edps),","interval":"auto"},"aggs":[]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-statistic*","filter":[],"query":{"query":"","language":"lucene"}}'
      }
    }
  },
  { // Wazuh-App-Statistics-analysisd-sca-queue
    _id: 'Wazuh-App-Statistics-analysisd-sca-queue',
    _type: 'visualization',
    _source: {
      title: 'Wazuh App Statistics analysisd sca queue',
      visState:
        '{"title":"Wazuh App Statistics analysisd sca queue","type":"timelion","params":{"expression":".es(timefield=timestamp,metric=avg:analysisd.sca_queue_size).fit(mode=average).label(sca_queue_size),.es(timefield=timestamp,metric=avg:analysisd.sca_queue_usage).fit(mode=average).label(sca_queue_usage),","interval":"auto"},"aggs":[]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-statistic*","filter":[],"query":{"query":"","language":"lucene"}}'
      }
    }
  },
  { // Wazuh-App-Statistics-analysisd-sca-event-decoded
    _id: 'Wazuh-App-Statistics-analysisd-sca-event-decoded',
    _type: 'visualization',
    _source: {
      title: 'Wazuh App Statistics analysisd sca event decoded',
      visState:
        '{"title":"Wazuh App Statistics analysisd sca event decoded","type":"timelion","params":{"expression":".es(timefield=timestamp,metric=avg:analysisd.sca_events_decoded).fit(mode=average).label(sca_events_decoded),.es(timefield=timestamp,metric=avg:analysisd.sca_edps).fit(mode=average).label(sca_edps),","interval":"auto"},"aggs":[]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-statistic*","filter":[],"query":{"query":"","language":"lucene"}}'
      }
    }
  },
  { // Wazuh-App-Statistics-analysisd-syscheck-queue
    _id: 'Wazuh-App-Statistics-analysisd-syscheck-queue',
    _type: 'visualization',
    _source: {
      title: 'Wazuh App Statistics analysisd syscheck queue',
      visState:
        '{"title":"Wazuh App Statistics analysisd syscheck queue","type":"timelion","params":{"expression":".es(timefield=timestamp,metric=avg:analysisd.syscheck_queue_size).fit(mode=average).label(syscheck_queue_size),.es(timefield=timestamp,metric=avg:analysisd.syscheck_queue_usage).fit(mode=average).label(syscheck_queue_usage),","interval":"auto"},"aggs":[]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-statistic*","filter":[],"query":{"query":"","language":"lucene"}}'
      }
    }
  },
  { // Wazuh-App-Statistics-analysisd-syscheck-event-decoded
    _id: 'Wazuh-App-Statistics-analysisd-syscheck-event-decoded',
    _type: 'visualization',
    _source: {
      title: 'Wazuh App Statistics analysisd syscheck event decoded',
      visState:
        '{"title":"Wazuh App Statistics analysisd syscheck event decoded","type":"timelion","params":{"expression":".es(timefield=timestamp,metric=avg:analysisd.syscheck_events_decoded).fit(mode=average).label(syscheck_events_decoded),.es(timefield=timestamp,metric=avg:analysisd.syscheck_edps).fit(mode=average).label(sca_edps),","interval":"auto"},"aggs":[]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-statistic*","filter":[],"query":{"query":"","language":"lucene"}}'
      }
    }
  },
  { // Wazuh-App-Statistics-analysisd-syscollector-queue
    _id: 'Wazuh-App-Statistics-analysisd-syscollector-queue',
    _type: 'visualization',
    _source: {
      title: 'Wazuh App Statistics analysisd syscollector queue',
      visState:
        '{"title":"Wazuh App Statistics analysisd syscollector queue","type":"timelion","params":{"expression":".es(timefield=timestamp,metric=avg:analysisd.syscollector_queue_size).fit(mode=average).label(syscollector_queue_size),.es(timefield=timestamp,metric=avg:analysisd.syscollector_queue_usage).fit(mode=average).label(syscollector_queue_usage),","interval":"auto"},"aggs":[]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-statistic*","filter":[],"query":{"query":"","language":"lucene"}}'
      }
    }
  },
  { // Wazuh-App-Statistics-analysisd-syscollector-event-decoded
    _id: 'Wazuh-App-Statistics-analysisd-syscollector-event-decoded',
    _type: 'visualization',
    _source: {
      title: 'Wazuh App Statistics analysisd syscollector event decoded',
      visState:
        '{"title":"Wazuh App Statistics analysisd syscollector event decoded","type":"timelion","params":{"expression":".es(timefield=timestamp,metric=avg:analysisd.syscollector_events_decoded).fit(mode=average).label(syscollector_events_decoded),.es(timefield=timestamp,metric=avg:analysisd.syscollector_edps).fit(mode=average).label(sca_edps),","interval":"auto"},"aggs":[]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-statistic*","filter":[],"query":{"query":"","language":"lucene"}}'
      }
    }
  },
  { // Wazuh-App-Statistics-analysisd-winevt-queue
    _id: 'Wazuh-App-Statistics-analysisd-winevt-queue',
    _type: 'visualization',
    _source: {
      title: 'Wazuh App Statistics analysisd winevt queue',
      visState:
        '{"title":"Wazuh App Statistics analysisd winevt queue","type":"timelion","params":{"expression":".es(timefield=timestamp,metric=avg:analysisd.winevt_queue_size).fit(mode=average).label(winevt_queue_size),.es(timefield=timestamp,metric=avg:analysisd.winevt_queue_usage).fit(mode=average).label(winevt_queue_usage),","interval":"auto"},"aggs":[]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-statistic*","filter":[],"query":{"query":"","language":"lucene"}}'
      }
    }
  },
  { // Wazuh-App-Statistics-analysisd-winevt-event-decoded
    _id: 'Wazuh-App-Statistics-analysisd-winevt-event-decoded',
    _type: 'visualization',
    _source: {
      title: 'Wazuh App Statistics analysisd winevt event decoded',
      visState:
        '{"title":"Wazuh App Statistics analysisd winevt event decoded","type":"timelion","params":{"expression":".es(timefield=timestamp,metric=avg:analysisd.winevt_events_decoded).fit(mode=average).label(winevt_events_decoded),.es(timefield=timestamp,metric=avg:analysisd.winevt_edps).fit(mode=average).label(sca_edps),","interval":"auto"},"aggs":[]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-statistic*","filter":[],"query":{"query":"","language":"lucene"}}'
      }
    }
  },
];
