const {
  DateFormatter,
} = require('../../../generate-alerts/helpers/date-formatter');
const { Random } = require('../../../generate-alerts/helpers/random');
const random = require('../../lib/random');

function generateRandomUsage() {
  return random.float(0, 1);
}

function generateDocument(params) {
  // Based on 4.x data from server API

  const eventsReceived = random.int(0, 10000);
  const eventsProcessed = random.int(0, eventsReceived);
  const eventsDropped = random.choice([0, 0, 0, 0, 0, 0, 5]);
  const syscheckEventsDecoded = random.int(0, eventsProcessed);
  const syscollectorEventsDecoded = random.int(0, eventsProcessed);
  const rootcheckEventsDecoded = random.int(0, eventsProcessed);
  const scaEventsDecoded = random.int(0, eventsProcessed);
  const winEventsDecoded = random.int(0, eventsProcessed);
  const othersEventsDecoded = random.int(0, eventsProcessed);
  return {
    analysisd: {
      total_events_decoded: eventsReceived,
      syscheck_events_decoded: syscheckEventsDecoded,
      syscollector_events_decoded: syscollectorEventsDecoded,
      rootcheck_events_decoded: rootcheckEventsDecoded,
      sca_events_decoded: scaEventsDecoded,
      winevt_events_decoded: winEventsDecoded,
      dbsync_messages_dispatched: 6866,
      other_events_decoded: 1257,
      events_processed: eventsProcessed,
      events_received: eventsReceived,
      events_dropped: eventsDropped,
      alerts_written: eventsProcessed,
      firewall_written: 0,
      fts_written: 0,
      syscheck_queue_usage: generateRandomUsage(),
      syscheck_queue_size: 16384,
      syscollector_queue_usage: generateRandomUsage(),
      syscollector_queue_size: 16384,
      rootcheck_queue_usage: generateRandomUsage(),
      rootcheck_queue_size: 16384,
      sca_queue_usage: generateRandomUsage(),
      sca_queue_size: 16384,
      hostinfo_queue_usage: generateRandomUsage(),
      hostinfo_queue_size: 16384,
      winevt_queue_usage: generateRandomUsage(),
      winevt_queue_size: 16384,
      dbsync_queue_usage: generateRandomUsage(),
      dbsync_queue_size: 16384,
      upgrade_queue_usage: generateRandomUsage(),
      upgrade_queue_size: 16384,
      event_queue_usage: generateRandomUsage(),
      event_queue_size: 16384,
      rule_matching_queue_usage: generateRandomUsage(),
      rule_matching_queue_size: 16384,
      alerts_queue_usage: generateRandomUsage(),
      alerts_queue_size: 16384,
      firewall_queue_usage: generateRandomUsage(),
      firewall_queue_size: 16384,
      statistical_queue_usage: generateRandomUsage(),
      statistical_queue_size: 16384,
      archives_queue_usage: generateRandomUsage(),
      archives_queue_size: 16384,
    },
    remoted: {
      queue_size: 0,
      total_queue_size: 131072,
      tcp_sessions: random.int(0, 500),
      evt_count: random.int(1000, 5000),
      ctrl_msg_count: random.int(10, 30),
      discarded_count: random.int(0, 20),
      sent_bytes: random.int(1000, 10000),
      recv_bytes: random.int(100000, 300000),
      dequeued_after_close: random.int(0, 20),
    },
    apiName: params?.api_id, // Host ID
    cluster: params?.cluster?.name || 'false',
    timestamp: DateFormatter.format(
      Random.date(),
      DateFormatter.DATE_FORMAT.ISO_TIMESTAMP,
    ),
    ...(params?.cluster?.name ? { nodeName: `worker${random.int(1, 4)}` } : {}),
  };
}

module.exports = {
  generateDocument,
};
