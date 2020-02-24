export default [
    {
      _id: 'Wazuh-App-Cluster-remoted-msg-count',
      _type: 'visualization',
      _source: {
        title: 'Wazuh App Cluster Overview Manager',
        visState:
          '{"title":"msg_count","type":"timelion","params":{"expression":".es(index=wazuh-cluster-stats-remoted*,timefield=timestamp,metric=avg:msg_sent).fit(mode=average).label(msg_sent),\n.es(index=wazuh-cluster-stats-remoted*,timefield=timestamp,metric=avg:ctrl_msg_count).fit(mode=average).label(ctrl_msg_count),\n.es(index=wazuh-cluster-stats-remoted*,timefield=timestamp,metric=avg:discarded_count).fit(mode=average).label(discarded_count),","interval":"auto"},"aggs":[]}',
        uiStateJSON: '{}',
        description: '',
        version: 1,
        kibanaSavedObjectMeta: {
          searchSourceJSON:
            '{"index":"wazuh-cluster-stats-remoted","filter":[],"query":{"query":"","language":"lucene"}}'
        }
      }
    },
]