
/*
 * Wazuh app - DevTools Api Request List
 * Copyright (C) 2015-2022 Wazuh, Inc.
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
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#run-an-ar-command-in-the-agent"
            },
            {
                "name": "agents/:agent_id/group/:group_id",
                "value": "agents/:agent_id/group/:group_id",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#add-agent-group"
            },
            {
                "name": "agents/:agent_id/restart",
                "value": "agents/:agent_id/restart",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#restart-an-agent"
            },
            {
                "name": "agents/:agent_id/upgrade",
                "value": "agents/:agent_id/upgrade",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#upgrade-agent-using-online-repository"
            },
            {
                "name": "agents/:agent_id/upgrade_custom",
                "value": "agents/:agent_id/upgrade_custom",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#upgrade-agent-using-custom-file"
            },
            {
                "name": "agents/:agent_name",
                "value": "agents/:agent_name",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#add-agent-quick-method"
            },
            {
                "name": "agents/groups/:group_id",
                "value": "agents/groups/:group_id",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#create-a-group"
            },
            {
                "name": "agents/restart",
                "value": "agents/restart",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#restart-all-agents"
            },
            {
                "name": "cluster/:node_id/restart",
                "value": "cluster/:node_id/restart",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#restart-a-specific-node-in-cluster"
            },
            {
                "name": "cluster/restart",
                "value": "cluster/restart",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#restart-all-nodes-in-cluster"
            },
            {
                "name": "manager/restart",
                "value": "manager/restart",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#restart-wazuh-manager"
            },
            {
                "name": "rootcheck",
                "value": "rootcheck",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#run-rootcheck-scan-in-all-agents"
            },
            {
                "name": "rootcheck/:agent_id",
                "value": "rootcheck/:agent_id",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#run-rootcheck-scan-in-an-agent"
            },
            {
                "name": "syscheck",
                "value": "syscheck",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#run-syscheck-scan-in-all-agents"
            },
            {
                "name": "syscheck/:agent_id",
                "value": "syscheck/:agent_id",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#run-syscheck-scan-in-an-agent"
            }
        ],
        "DELETE": [
            {
                "name": "agents",
                "value": "agents",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#delete-agents"
            },
            {
                "name": "agents/:agent_id",
                "value": "agents/:agent_id",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#delete-an-agent"
            },
            {
                "name": "agents/:agent_id/group",
                "value": "agents/:agent_id/group",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#remove-a-single-group-of-an-agent"
            },
            {
                "name": "agents/:agent_id/group/:group_id",
                "value": "agents/:agent_id/group/:group_id",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#remove-a-single-group-of-an-agent"
            },
            {
                "name": "agents/group/:group_id",
                "value": "agents/group/:group_id",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#remove-a-single-group-of-multiple-agents"
            },
            {
                "name": "agents/groups",
                "value": "agents/groups",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#delete-a-list-of-groups"
            },
            {
                "name": "agents/groups/:group_id",
                "value": "agents/groups/:group_id",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#remove-group"
            },
            {
                "name": "cache",
                "value": "cache",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#delete-cache-index"
            },
            {
                "name": "rootcheck",
                "value": "rootcheck",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#clear-rootcheck-database"
            },
            {
                "name": "rootcheck/:agent_id",
                "value": "rootcheck/:agent_id",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#clear-rootcheck-database-of-an-agent"
            },
            {
                "name": "syscheck/:agent_id",
                "value": "syscheck/:agent_id",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#clear-syscheck-database-of-an-agent"
            }
        ],
        "GET": [
            {
                "name": "agents",
                "value": "agents",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-all-agents"
            },
            {
                "name": "agents/:agent_id",
                "value": "agents/:agent_id",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-an-agent"
            },
            {
                "name": "agents/:agent_id/config/:component/:configuration",
                "value": "agents/:agent_id/config/:component/:configuration",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-active-configuration"
            },
            {
                "name": "agents/:agent_id/key",
                "value": "agents/:agent_id/key",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-agent-key"
            },
            {
                "name": "agents/:agent_id/upgrade_result",
                "value": "agents/:agent_id/upgrade_result",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-upgrade-result-from-agent"
            },
            {
                "name": "agents/groups",
                "value": "agents/groups",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-groups"
            },
            {
                "name": "agents/groups/:group_id",
                "value": "agents/groups/:group_id",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-agents-in-a-group"
            },
            {
                "name": "agents/groups/:group_id/configuration",
                "value": "agents/groups/:group_id/configuration",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-group-configuration"
            },
            {
                "name": "agents/groups/:group_id/files",
                "value": "agents/groups/:group_id/files",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-group-files"
            },
            {
                "name": "agents/groups/:group_id/files/:filename",
                "value": "agents/groups/:group_id/files/:filename",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-a-file-in-group"
            },
            {
                "name": "agents/name/:agent_name",
                "value": "agents/name/:agent_name",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-an-agent-by-its-name"
            },
            {
                "name": "agents/no_group",
                "value": "agents/no_group",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-agents-without-group"
            },
            {
                "name": "agents/outdated",
                "value": "agents/outdated",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-outdated-agents"
            },
            {
                "name": "agents/stats/distinct",
                "value": "agents/stats/distinct",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-distinct-fields-in-agents"
            },
            {
                "name": "agents/summary",
                "value": "agents/summary",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-agents-summary"
            },
            {
                "name": "agents/summary/os",
                "value": "agents/summary/os",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-os-summary"
            },
            {
                "name": "cache",
                "value": "cache",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-cache-index"
            },
            {
                "name": "cache/config",
                "value": "cache/config",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#return-cache-configuration"
            },
            {
                "name": "ciscat/:agent_id/results",
                "value": "ciscat/:agent_id/results",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-cis-cat-results-from-an-agent"
            },
            {
                "name": "cluster/:node_id/configuration",
                "value": "cluster/:node_id/configuration",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-node-node-id-s-configuration"
            },
            {
                "name": "cluster/:node_id/configuration/validation",
                "value": "cluster/:node_id/configuration/validation",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#check-wazuh-configuration-in-a-cluster-node"
            },
            {
                "name": "cluster/:node_id/files",
                "value": "cluster/:node_id/files",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-local-file-from-any-cluster-node"
            },
            {
                "name": "cluster/:node_id/info",
                "value": "cluster/:node_id/info",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-node-id-s-information"
            },
            {
                "name": "cluster/:node_id/logs",
                "value": "cluster/:node_id/logs",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-ossec-log-from-a-specific-node-in-cluster"
            },
            {
                "name": "cluster/:node_id/logs/summary",
                "value": "cluster/:node_id/logs/summary",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-summary-of-ossec-log-from-a-specific-node-in-cluster"
            },
            {
                "name": "cluster/:node_id/stats",
                "value": "cluster/:node_id/stats",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-node-node-id-s-stats"
            },
            {
                "name": "cluster/:node_id/stats/analysisd",
                "value": "cluster/:node_id/stats/analysisd",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-node-node-id-s-analysisd-stats"
            },
            {
                "name": "cluster/:node_id/stats/hourly",
                "value": "cluster/:node_id/stats/hourly",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-node-node-id-s-stats-by-hour"
            },
            {
                "name": "cluster/:node_id/stats/remoted",
                "value": "cluster/:node_id/stats/remoted",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-node-node-id-s-remoted-stats"
            },
            {
                "name": "cluster/:node_id/stats/weekly",
                "value": "cluster/:node_id/stats/weekly",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-node-node-id-s-stats-by-week"
            },
            {
                "name": "cluster/:node_id/status",
                "value": "cluster/:node_id/status",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-node-node-id-s-status"
            },
            {
                "name": "cluster/config",
                "value": "cluster/config",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-the-cluster-configuration"
            },
            {
                "name": "cluster/configuration/validation",
                "value": "cluster/configuration/validation",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#check-wazuh-configuration-in-all-cluster-nodes"
            },
            {
                "name": "cluster/healthcheck",
                "value": "cluster/healthcheck",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#show-cluster-health"
            },
            {
                "name": "cluster/node",
                "value": "cluster/node",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-local-node-info"
            },
            {
                "name": "cluster/nodes",
                "value": "cluster/nodes",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-nodes-info"
            },
            {
                "name": "cluster/nodes/:node_name",
                "value": "cluster/nodes/:node_name",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-node-info"
            },
            {
                "name": "cluster/status",
                "value": "cluster/status",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-info-about-cluster-status"
            },
            {
                "name": "manager/stats/remoted",
                "value": "manager/stats/remoted",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-remoted-stats"
            },
            {
                "name": "sca/:agent_id",
                "value": "sca/:agent_id",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-security-configuration-assessment-sca-database"
            },
            {
                "name": "sca/:agent_id/checks/:policy_id",
                "value": "sca/:agent_id/checks/:policy_id",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-security-configuration-assessment-sca-checks-database"
            },
            {
                "name": "summary/agents",
                "value": "summary/agents",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-a-full-summary-of-agents"
            },
            {
                "name": "decoders",
                "value": "decoders",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-all-decoders"
            },
            {
                "name": "decoders/:decoder_name",
                "value": "decoders/:decoder_name",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-decoders-by-name"
            },
            {
                "name": "decoders/files",
                "value": "decoders/files",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-all-decoders-files"
            },
            {
                "name": "decoders/parents",
                "value": "decoders/parents",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-all-parent-decoders"
            },
            {
                "name": "lists",
                "value": "lists",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-all-lists"
            },
            {
                "name": "lists/files",
                "value": "lists/files",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-paths-from-all-lists"
            },
            {
                "name": "manager/configuration",
                "value": "manager/configuration",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-manager-configuration"
            },
            {
                "name": "manager/configuration/validation",
                "value": "manager/configuration/validation",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#check-wazuh-configuration"
            },
            {
                "name": "manager/files",
                "value": "manager/files",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-local-file"
            },
            {
                "name": "manager/info",
                "value": "manager/info",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-manager-information"
            },
            {
                "name": "manager/logs",
                "value": "manager/logs",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-ossec-log"
            },
            {
                "name": "manager/logs/summary",
                "value": "manager/logs/summary",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-summary-of-ossec-log"
            },
            {
                "name": "manager/stats",
                "value": "manager/stats",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-manager-stats"
            },
            {
                "name": "manager/stats/analysisd",
                "value": "manager/stats/analysisd",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-analysisd-stats"
            },
            {
                "name": "manager/stats/hourly",
                "value": "manager/stats/hourly",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-manager-stats-by-hour"
            },
            {
                "name": "manager/stats/remoted",
                "value": "manager/stats/remoted",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-remoted-stats"
            },
            {
                "name": "manager/stats/weekly",
                "value": "manager/stats/weekly",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-manager-stats-by-week"
            },
            {
                "name": "manager/status",
                "value": "manager/status",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-manager-status"
            },
            {
                "name": "rootcheck/:agent_id",
                "value": "rootcheck/:agent_id",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-rootcheck-database"
            },
            {
                "name": "rootcheck/:agent_id/cis",
                "value": "rootcheck/:agent_id/cis",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-rootcheck-cis-requirements"
            },
            {
                "name": "rootcheck/:agent_id/last_scan",
                "value": "rootcheck/:agent_id/last_scan",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-last-rootcheck-scan"
            },
            {
                "name": "rootcheck/:agent_id/pci",
                "value": "rootcheck/:agent_id/pci",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-rootcheck-pci-requirements"
            },
            {
                "name": "rules",
                "value": "rules",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-all-rules"
            },
            {
                "name": "rules/:rule_id",
                "value": "rules/:rule_id",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-rules-by-id"
            },
            {
                "name": "rules/files",
                "value": "rules/files",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-files-of-rules"
            },
            {
                "name": "rules/gdpr",
                "value": "rules/gdpr",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-rule-gdpr-requirements"
            },
            {
                "name": "rules/groups",
                "value": "rules/groups",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-rule-groups"
            },
            {
                "name": "rules/pci",
                "value": "rules/pci",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-rule-pci-requirements"
            },
            {
                "name": "rules/hipaa",
                "value": "rules/hipaa",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-rule-hipaa-requirements"
            },
            {
                "name": "rules/nist-800-53",
                "value": "rules/nist-800-53",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-rule-nist-800-53-requirements"
            },
            {
                "name": "rules/tsc",
                "value": "rules/tsc",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-rule-tsc-requirements"
            },
            {
                "name": "syscheck/:agent_id",
                "value": "syscheck/:agent_id",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-syscheck-files"
            },
            {
                "name": "syscheck/:agent_id/last_scan",
                "value": "syscheck/:agent_id/last_scan",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-last-syscheck-scan"
            },
            {
                "name": "syscollector/:agent_id/hardware",
                "value": "syscollector/:agent_id/hardware",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-hardware-info"
            },
            {
                "name": "syscollector/:agent_id/netaddr",
                "value": "syscollector/:agent_id/netaddr",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-network-address-info-of-an-agent"
            },
            {
                "name": "syscollector/:agent_id/netiface",
                "value": "syscollector/:agent_id/netiface",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-network-interface-info-of-an-agent"
            },
            {
                "name": "syscollector/:agent_id/netproto",
                "value": "syscollector/:agent_id/netproto",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-network-protocol-info-of-an-agent"
            },
            {
                "name": "syscollector/:agent_id/os",
                "value": "syscollector/:agent_id/os",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-os-info"
            },
            {
                "name": "syscollector/:agent_id/packages",
                "value": "syscollector/:agent_id/packages",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-packages-info"
            },
            {
                "name": "syscollector/:agent_id/ports",
                "value": "syscollector/:agent_id/ports",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-ports-info-of-an-agent"
            },
            {
                "name": "syscollector/:agent_id/processes",
                "value": "syscollector/:agent_id/processes",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-processes-info"
            }
        ],
        "POST": [
            {
                "name": "agents",
                "value": "agents",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#add-agent"
            },
            {
                "name": "agents/group/:group_id",
                "value": "agents/group/:group_id",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#add-a-list-of-agents-to-a-group"
            },
            {
                "name": "agents/groups/:group_id/configuration",
                "value": "agents/groups/:group_id/configuration",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#put-configuration-file-agent-conf-into-a-group"
            },
            {
                "name": "agents/groups/:group_id/files/:file_name",
                "value": "agents/groups/:group_id/files/:file_name",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#upload-file-into-a-group"
            },
            {
                "name": "agents/insert",
                "value": "agents/insert",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#insert-agent"
            },
            {
                "name": "agents/restart",
                "value": "agents/restart",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#restart-a-list-of-agents"
            },
            {
                "name": "cluster/:node_id/files",
                "value": "cluster/:node_id/files",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#update-local-file-at-any-cluster-node"
            },
            {
                "name": "manager/files",
                "value": "manager/files",
                "score": 1,
                "meta": "endpoint",
                "documentationLink": "https://documentation.wazuh.com/current/user-manual/api/reference.html#update-local-file"
            }
        ]
    }; 