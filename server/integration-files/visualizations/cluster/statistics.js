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
    _id: 'Wazuh-App-Statistics-remoted-Recv-bytes',
    _type: 'visualization',
    _source: {
      title: 'Wazuh App Statistics remoted Recv bytes',
      visState:
        '{"title":"Wazuh App Statistics remoted Recv bytes","type":"timelion","params":{"expression":".es(index=wazuh-stati*,timefield=timestamp,metric=avg:remoted.recv_bytes).fit(mode=average).label(recv_bytes),.es(timefield=timestamp,metric=avg:remoted.recv_bytes).trend().label(Trend)","interval":"auto"},"aggs":[]}',
      uiStateJSON: '{}',
      description: '',
      version: 1,
      kibanaSavedObjectMeta: {
        searchSourceJSON:
          '{"index":"wazuh-statistic*","filter":[],"query":{"query":"","language":"lucene"}}'
      }
    }
  },
  {
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
  {
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
  {
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
];
