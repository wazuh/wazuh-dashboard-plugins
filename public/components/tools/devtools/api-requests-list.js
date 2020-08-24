
/*
 * Wazuh app - DevTools Api Request List
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export const apiRequestList =
    {
        "PUT": [
            {
                "name": "active-response/:agent_id",
                "value": "active-response/:agent_id",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "agents/:agent_id/group/:group_id",
                "value": "agents/:agent_id/group/:group_id",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "agents/:agent_id/restart",
                "value": "agents/:agent_id/restart",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "agents/:agent_id/upgrade",
                "value": "agents/:agent_id/upgrade",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "agents/:agent_id/upgrade_custom",
                "value": "agents/:agent_id/upgrade_custom",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "agents/:agent_name",
                "value": "agents/:agent_name",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "agents/groups/:group_id",
                "value": "agents/groups/:group_id",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "agents/restart",
                "value": "agents/restart",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "cluster/:node_id/restart",
                "value": "cluster/:node_id/restart",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "cluster/restart",
                "value": "cluster/restart",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "manager/restart",
                "value": "manager/restart",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "rootcheck",
                "value": "rootcheck",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "rootcheck/:agent_id",
                "value": "rootcheck/:agent_id",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "syscheck",
                "value": "syscheck",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "syscheck/:agent_id",
                "value": "syscheck/:agent_id",
                "score": 1,
                "meta": "endpoint"
            }
        ],
        "DELETE": [
            {
                "name": "agents",
                "value": "agents",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "agents/:agent_id",
                "value": "agents/:agent_id",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "agents/:agent_id/group",
                "value": "agents/:agent_id/group",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "agents/:agent_id/group/:group_id",
                "value": "agents/:agent_id/group/:group_id",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "agents/group/:group_id",
                "value": "agents/group/:group_id",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "agents/groups",
                "value": "agents/groups",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "agents/groups/:group_id",
                "value": "agents/groups/:group_id",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "cache",
                "value": "cache",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "cache",
                "value": "cache",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "rootcheck",
                "value": "rootcheck",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "rootcheck/:agent_id",
                "value": "rootcheck/:agent_id",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "syscheck/:agent_id",
                "value": "syscheck/:agent_id",
                "score": 1,
                "meta": "endpoint"
            }
        ],
        "GET": [
            {
                "name": "agents",
                "value": "agents",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "agents/:agent_id",
                "value": "agents/:agent_id",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "agents/:agent_id/config/:component/:configuration",
                "value": "agents/:agent_id/config/:component/:configuration",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "agents/:agent_id/group/is_sync",
                "value": "agents/:agent_id/group/is_sync",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "agents/:agent_id/key",
                "value": "agents/:agent_id/key",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "agents/:agent_id/upgrade_result",
                "value": "agents/:agent_id/upgrade_result",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "agents/groups",
                "value": "agents/groups",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "agents/groups/:group_id",
                "value": "agents/groups/:group_id",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "agents/groups/:group_id/configuration",
                "value": "agents/groups/:group_id/configuration",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "agents/groups/:group_id/files",
                "value": "agents/groups/:group_id/files",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "agents/groups/:group_id/files/:filename",
                "value": "agents/groups/:group_id/files/:filename",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "agents/name/:agent_name",
                "value": "agents/name/:agent_name",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "agents/no_group",
                "value": "agents/no_group",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "agents/outdated",
                "value": "agents/outdated",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "agents/stats/distinct",
                "value": "agents/stats/distinct",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "agents/summary",
                "value": "agents/summary",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "agents/summary/os",
                "value": "agents/summary/os",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "cache",
                "value": "cache",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "cache/config",
                "value": "cache/config",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "ciscat/:agent_id/results",
                "value": "ciscat/:agent_id/results",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "cluster/:node_id/configuration",
                "value": "cluster/:node_id/configuration",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "cluster/:node_id/configuration/validation",
                "value": "cluster/:node_id/configuration/validation",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "cluster/:node_id/files",
                "value": "cluster/:node_id/files",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "cluster/:node_id/info",
                "value": "cluster/:node_id/info",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "cluster/:node_id/logs",
                "value": "cluster/:node_id/logs",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "cluster/:node_id/logs/summary",
                "value": "cluster/:node_id/logs/summary",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "cluster/:node_id/stats",
                "value": "cluster/:node_id/stats",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "cluster/:node_id/stats/analysisd",
                "value": "cluster/:node_id/stats/analysisd",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "cluster/:node_id/stats/hourly",
                "value": "cluster/:node_id/stats/hourly",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "cluster/:node_id/stats/remoted",
                "value": "cluster/:node_id/stats/remoted",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "cluster/:node_id/stats/weekly",
                "value": "cluster/:node_id/stats/weekly",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "cluster/:node_id/status",
                "value": "cluster/:node_id/status",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "cluster/config",
                "value": "cluster/config",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "cluster/configuration/validation",
                "value": "cluster/configuration/validation",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "cluster/healthcheck",
                "value": "cluster/healthcheck",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "cluster/node",
                "value": "cluster/node",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "cluster/nodes",
                "value": "cluster/nodes",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "cluster/nodes/:node_name",
                "value": "cluster/nodes/:node_name",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "cluster/status",
                "value": "cluster/status",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "manager/stats/remoted",
                "value": "manager/stats/remoted",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "sca/:agent_id",
                "value": "sca/:agent_id",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "sca/:agent_id/checks/:policy_id",
                "value": "sca/:agent_id/checks/:policy_id",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "decoders",
                "value": "decoders",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "decoders/:decoder_name",
                "value": "decoders/:decoder_name",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "decoders/files",
                "value": "decoders/files",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "decoders/parents",
                "value": "decoders/parents",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "lists",
                "value": "lists",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "lists/files",
                "value": "lists/files",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "manager/configuration",
                "value": "manager/configuration",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "manager/configuration/validation",
                "value": "manager/configuration/validation",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "manager/files",
                "value": "manager/files",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "manager/info",
                "value": "manager/info",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "manager/logs",
                "value": "manager/logs",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "manager/logs/summary",
                "value": "manager/logs/summary",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "manager/stats",
                "value": "manager/stats",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "manager/stats/analysisd",
                "value": "manager/stats/analysisd",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "manager/stats/hourly",
                "value": "manager/stats/hourly",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "manager/stats/remoted",
                "value": "manager/stats/remoted",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "manager/stats/weekly",
                "value": "manager/stats/weekly",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "manager/status",
                "value": "manager/status",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "rootcheck/:agent_id",
                "value": "rootcheck/:agent_id",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "rootcheck/:agent_id/cis",
                "value": "rootcheck/:agent_id/cis",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "rootcheck/:agent_id/last_scan",
                "value": "rootcheck/:agent_id/last_scan",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "rootcheck/:agent_id/pci",
                "value": "rootcheck/:agent_id/pci",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "rules",
                "value": "rules",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "rules/:rule_id",
                "value": "rules/:rule_id",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "rules/files",
                "value": "rules/files",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "rules/gdpr",
                "value": "rules/gdpr",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "rules/groups",
                "value": "rules/groups",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "rules/pci",
                "value": "rules/pci",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "rules/hipaa",
                "value": "rules/hipaa",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "rules/nist-800-53",
                "value": "rules/nist-800-53",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "rules/tsc",
                "value": "rules/tsc",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "syscheck/:agent_id",
                "value": "syscheck/:agent_id",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "syscheck/:agent_id/last_scan",
                "value": "syscheck/:agent_id/last_scan",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "syscollector/:agent_id/hardware",
                "value": "syscollector/:agent_id/hardware",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "syscollector/:agent_id/netaddr",
                "value": "syscollector/:agent_id/netaddr",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "syscollector/:agent_id/netiface",
                "value": "syscollector/:agent_id/netiface",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "syscollector/:agent_id/netproto",
                "value": "syscollector/:agent_id/netproto",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "syscollector/:agent_id/os",
                "value": "syscollector/:agent_id/os",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "syscollector/:agent_id/packages",
                "value": "syscollector/:agent_id/packages",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "syscollector/:agent_id/ports",
                "value": "syscollector/:agent_id/ports",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "syscollector/:agent_id/processes",
                "value": "syscollector/:agent_id/processes",
                "score": 1,
                "meta": "endpoint"
            }
        ],
        "POST": [
            {
                "name": "agents",
                "value": "agents",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "agents/group/:group_id",
                "value": "agents/group/:group_id",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "agents/groups/:group_id/configuration",
                "value": "agents/groups/:group_id/configuration",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "agents/groups/:group_id/files/:file_name",
                "value": "agents/groups/:group_id/files/:file_name",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "agents/insert",
                "value": "agents/insert",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "agents/restart",
                "value": "agents/restart",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "cluster/:node_id/files",
                "value": "cluster/:node_id/files",
                "score": 1,
                "meta": "endpoint"
            },
            {
                "name": "manager/files",
                "value": "manager/files",
                "score": 1,
                "meta": "endpoint"
            }
        ]
    }; 