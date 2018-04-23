/*
 * Wazuh app - Module for monitoring template
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export default {
    "order": 0,
    "template": "wazuh-monitoring-3.x-*",
    "settings": {
        "index.refresh_interval": "5s"
    },
    "mappings": {
        "wazuh-agent": {
            "properties": {
                "@timestamp": {
                    "type": "date",
                    "format": "dateOptionalTime"
                },
                "status": {
                    "type": "keyword"
                },
                "ip": {
                    "type": "keyword"
                },
                "host": {
                    "type": "keyword"
                },
                "name": {
                    "type": "keyword"
                },
                "id": {
                    "type": "keyword"
                },
                "cluster": {
                    "properties": {
                        "name": {
                            "type": "keyword"
                        }
                    }
                }
            }
        }
    }
};
