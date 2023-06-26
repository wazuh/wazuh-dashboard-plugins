/*
 * Wazuh app - Module for statistics template
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export const statisticsTemplate = {
  order: 0,
  settings: {
    'index.refresh_interval': '5s'
  },
  "mappings" : {
    "dynamic_templates" : [
      {
        "string_as_keyword" : {
          "match_mapping_type" : "string",
          "mapping" : {
            "type" : "keyword"
          }
        }
      }
    ],
    "properties" : {
      "analysisd" : {
        "properties" : {
          "alerts_queue_size" : {
            "type" : "long"
          },
          "alerts_queue_usage" : {
            "type" : "long"
          },
          "alerts_written" : {
            "type" : "long"
          },
          "archives_queue_size" : {
            "type" : "long"
          },
          "archives_queue_usage" : {
            "type" : "long"
          },
          "dbsync_mdps" : {
            "type" : "long"
          },
          "dbsync_messages_dispatched" : {
            "type" : "long"
          },
          "dbsync_queue_size" : {
            "type" : "long"
          },
          "dbsync_queue_usage" : {
            "type" : "long"
          },
          "event_queue_size" : {
            "type" : "long"
          },
          "event_queue_usage" : {
            "type" : "long"
          },
          "events_dropped" : {
            "type" : "long"
          },
          "events_edps" : {
            "type" : "long"
          },
          "events_processed" : {
            "type" : "long"
          },
          "events_received" : {
            "type" : "long"
          },
          "firewall_queue_size" : {
            "type" : "long"
          },
          "firewall_queue_usage" : {
            "type" : "long"
          },
          "firewall_written" : {
            "type" : "long"
          },
          "fts_written" : {
            "type" : "long"
          },
          "hostinfo_edps" : {
            "type" : "long"
          },
          "hostinfo_events_decoded" : {
            "type" : "long"
          },
          "hostinfo_queue_size" : {
            "type" : "long"
          },
          "hostinfo_queue_usage" : {
            "type" : "long"
          },
          "other_events_decoded" : {
            "type" : "long"
          },
          "other_events_edps" : {
            "type" : "long"
          },
          "rootcheck_edps" : {
            "type" : "long"
          },
          "rootcheck_events_decoded" : {
            "type" : "long"
          },
          "rootcheck_queue_size" : {
            "type" : "long"
          },
          "rootcheck_queue_usage" : {
            "type" : "long"
          },
          "rule_matching_queue_size" : {
            "type" : "long"
          },
          "rule_matching_queue_usage" : {
            "type" : "long"
          },
          "sca_edps" : {
            "type" : "long"
          },
          "sca_events_decoded" : {
            "type" : "long"
          },
          "sca_queue_size" : {
            "type" : "long"
          },
          "sca_queue_usage" : {
            "type" : "long"
          },
          "statistical_queue_size" : {
            "type" : "long"
          },
          "statistical_queue_usage" : {
            "type" : "long"
          },
          "syscheck_edps" : {
            "type" : "long"
          },
          "syscheck_events_decoded" : {
            "type" : "long"
          },
          "syscheck_queue_size" : {
            "type" : "long"
          },
          "syscheck_queue_usage" : {
            "type" : "long"
          },
          "syscollector_edps" : {
            "type" : "long"
          },
          "syscollector_events_decoded" : {
            "type" : "long"
          },
          "syscollector_queue_size" : {
            "type" : "long"
          },
          "syscollector_queue_usage" : {
            "type" : "long"
          },
          "total_events_decoded" : {
            "type" : "long"
          },
          "upgrade_queue_size" : {
            "type" : "long"
          },
          "upgrade_queue_usage" : {
            "type" : "long"
          },
          "winevt_edps" : {
            "type" : "long"
          },
          "winevt_events_decoded" : {
            "type" : "long"
          },
          "winevt_queue_size" : {
            "type" : "long"
          },
          "winevt_queue_usage" : {
            "type" : "long"
          }
        }
      },
      "apiName" : {
        "type" : "text",
        "fields" : {
          "keyword" : {
            "type" : "keyword",
            "ignore_above" : 256
          }
        }
      },
      "cluster" : {
        "type" : "text",
        "fields" : {
          "keyword" : {
            "type" : "keyword",
            "ignore_above" : 256
          }
        }
      },
      "nodeName" : {
        "type" : "text",
        "fields" : {
          "keyword" : {
            "type" : "keyword",
            "ignore_above" : 256
          }
        }
      },
      "name" : {
        "type" : "keyword"
      }, 
      "remoted" : {
        "properties" : {
          "ctrl_msg_count" : {
            "type" : "long"
          },
          "dequeued_after_close" : {
            "type" : "long"
          },
          "discarded_count" : {
            "type" : "long"
          },
          "evt_count" : {
            "type" : "long"
          },
          "msg_sent" : {
            "type" : "long"
          },
          "queue_size" : {
            "type" : "keyword"
          },
          "recv_bytes" : {
            "type" : "long"
          },
          "tcp_sessions" : {
            "type" : "long"
          },
          "total_queue_size" : {
            "type" : "long"
          }
        }
      },
      "status" : {
        "type" : "keyword"
      },
      "timestamp" : {
        "type" : "date",
        "format" : "dateOptionalTime"
      }
    }
  }
};
