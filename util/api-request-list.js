/*
 * Wazuh app - Module for get the list of routes in API in JSON format
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export const apiRequestList = [
  {
    method: 'PUT',
    endpoints: [
      {
        name: '/active-response/:agent_id',
        args: [
          {
            name: ':agent_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#run-an-ar-command-in-the-agent"
      },
      {
        name: '/agents/:agent_id/group/:group_id',
        args: [
          {
            name: ':agent_id'
          },
          {
            name: ':group_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#add-agent-group"
      },
      {
        name: '/agents/:agent_id/restart',
        args: [
          {
            name: ':agent_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#restart-an-agent"
      },
      {
        name: '/agents/:agent_id/upgrade',
        args: [
          {
            name: ':agent_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#upgrade-agent-using-online-repository"
      },
      {
        name: '/agents/:agent_id/upgrade_custom',
        args: [
          {
            name: ':agent_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#upgrade-agent-using-custom-file"
      },
      {
        name: '/agents/:agent_name',
        args: [
          {
            name: ':agent_name'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#add-agent-quick-method"
      },
      {
        name: '/agents/groups/:group_id',
        args: [
          {
            name: ':group_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#create-a-group"
      },
      {
        name: '/agents/restart',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#restart-all-agents"
      },
      {
        name: '/cluster/:node_id/restart',
        args: [
          {
            name: ':node_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#restart-a-specific-node-in-cluster"
      },
      {
        name: '/cluster/restart',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#restart-all-nodes-in-cluster"
      },
      {
        name: '/manager/restart',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#restart-wazuh-manager"
      },
      {
        name: '/rootcheck',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#run-rootcheck-scan-in-all-agents"
      },
      {
        name: '/rootcheck/:agent_id',
        args: [
          {
            name: ':agent_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#run-rootcheck-scan-in-an-agent"
      },
      {
        name: '/syscheck',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#run-syscheck-scan-in-all-agents"
      },
      {
        name: '/syscheck/:agent_id',
        args: [
          {
            name: ':agent_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#run-syscheck-scan-in-an-agent"
      }
    ]
  },
  {
    method: 'DELETE',
    endpoints: [
      {
        name: '/agents',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#delete-agents"
      },
      {
        name: '/agents/:agent_id',
        args: [
          {
            name: ':agent_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#delete-an-agent"
      },
      {
        name: '/agents/:agent_id/group',
        args: [
          {
            name: ':agent_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#remove-a-single-group-of-an-agent"
      },
      {
        name: '/agents/:agent_id/group/:group_id',
        args: [
          {
            name: ':agent_id'
          },
          {
            name: ':group_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#remove-a-single-group-of-an-agent"
      },
      {
        name: '/agents/group/:group_id',
        args: [
          {
            name: ':group_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#remove-a-single-group-of-multiple-agents"
      },
      {
        name: '/agents/groups',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#delete-a-list-of-groups"
      },
      {
        name: '/agents/groups/:group_id',
        args: [
          {
            name: ':group_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#remove-group"
      },
      {
        name: '/cache',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#delete-cache-index"
      },
      {
        name: '/rootcheck',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#clear-rootcheck-database"
      },
      {
        name: '/rootcheck/:agent_id',
        args: [
          {
            name: ':agent_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#clear-rootcheck-database-of-an-agent"
      },
      {
        name: '/syscheck/:agent_id',
        args: [
          {
            name: ':agent_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#clear-syscheck-database-of-an-agent"
      }
    ]
  },
  {
    method: 'GET',
    endpoints: [
      {
        name: '/agents',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-all-agents"
      },
      {
        name: '/agents/:agent_id',
        args: [
          {
            name: ':agent_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-an-agent"
      },
      {
        name: '/agents/:agent_id/config/:component/:configuration',
        args: [
          {
            name: ':agent_id'
          },
          {
            name: ':component'
          },
          {
            name: ':configuration'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-active-configuration"
      },
      {
        name: '/agents/:agent_id/group/is_sync',
        args: [
          {
            name: ':agent_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-sync-status-of-agent"
      },
      {
        name: '/agents/:agent_id/key',
        args: [
          {
            name: ':agent_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-agent-key"
      },
      {
        name: '/agents/:agent_id/upgrade_result',
        args: [
          {
            name: ':agent_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-upgrade-result-from-agent"
      },
      {
        name: '/agents/groups',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-groups"
      },
      {
        name: '/agents/groups/:group_id',
        args: [
          {
            name: ':group_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-agents-in-a-group"
      },
      {
        name: '/agents/groups/:group_id/configuration',
        args: [
          {
            name: ':group_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-group-configuration"
      },
      {
        name: '/agents/groups/:group_id/files',
        args: [
          {
            name: ':group_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-group-files"
      },
      {
        name: '/agents/groups/:group_id/files/:filename',
        args: [
          {
            name: ':group_id'
          },
          {
            name: ':filename'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-a-file-in-group"
      },
      {
        name: '/agents/name/:agent_name',
        args: [
          {
            name: ':agent_name'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-an-agent-by-its-name"
      },
      {
        name: '/agents/no_group',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-agents-without-group"
      },
      {
        name: '/agents/outdated',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-outdated-agents"
      },
      {
        name: '/agents/stats/distinct',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-distinct-fields-in-agents"
      },
      {
        name: '/agents/summary',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-agents-summary"
      },
      {
        name: '/agents/summary/os',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-os-summary"
      },
      {
        name: '/cache',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-cache-index"
      },
      {
        name: '/cache/config',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#return-cache-configuration"
      },
      {
        name: '/ciscat/:agent_id/results',
        args: [
          {
            name: ':agent_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-cis-cat-results-from-an-agent"
      },
      {
        name: '/cluster/:node_id/configuration',
        args: [
          {
            name: ':node_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-node-node-id-s-configuration"
      },
      {
        name: '/cluster/:node_id/configuration/validation',
        args: [
          {
            name: ':node_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#check-wazuh-configuration-in-a-cluster-node"
      },
      {
        name: '/cluster/:node_id/files',
        args: [
          {
            name: ':node_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-local-file-from-any-cluster-node"
      },
      {
        name: '/cluster/:node_id/info',
        args: [
          {
            name: ':node_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-node-id-s-information"
      },
      {
        name: '/cluster/:node_id/logs',
        args: [
          {
            name: ':node_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-ossec-log-from-a-specific-node-in-cluster"
      },
      {
        name: '/cluster/:node_id/logs/summary',
        args: [
          {
            name: ':node_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-summary-of-ossec-log-from-a-specific-node-in-cluster"
      },
      {
        name: '/cluster/:node_id/stats',
        args: [
          {
            name: ':node_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-node-node-id-s-stats"
      },
      {
        name: '/cluster/:node_id/stats/analysisd',
        args: [
          {
            name: ':node_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-node-node-id-s-analysisd-stats"
      },
      {
        name: '/cluster/:node_id/stats/hourly',
        args: [
          {
            name: ':node_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-node-node-id-s-stats-by-hour"
      },
      {
        name: '/cluster/:node_id/stats/remoted',
        args: [
          {
            name: ':node_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-node-node-id-s-remoted-stats"
      },
      {
        name: '/cluster/:node_id/stats/weekly',
        args: [
          {
            name: ':node_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-node-node-id-s-stats-by-week"
      },
      {
        name: '/cluster/:node_id/status',
        args: [
          {
            name: ':node_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-node-node-id-s-status"
      },
      {
        name: '/cluster/config',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-the-cluster-configuration"
      },
      {
        name: '/cluster/configuration/validation',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#check-wazuh-configuration-in-all-cluster-nodes"
      },
      {
        name: '/cluster/healthcheck',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#show-cluster-health"
      },
      {
        name: '/cluster/node',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-local-node-info"
      },
      {
        name: '/cluster/nodes',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-nodes-info"
      },
      {
        name: '/cluster/nodes/:node_name',
        args: [
          {
            name: ':node_name'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-node-info"
      },
      {
        name: '/cluster/status',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-info-about-cluster-status"
      },
      {
        name: '/manager/stats/remoted',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-remoted-stats"
      },
      {
        name: '/sca/:agent_id',
        args: [
          {
            name: ':agent_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-security-configuration-assessment-sca-database"
      },
      {
        name: '/sca/:agent_id/checks/:policy_id',
        args: [
          {
            name: ':agent_id'
          },
          {
            name: ':policy_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-security-configuration-assessment-sca-checks-database"
      },
      {
        name: '/summary/agents',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-a-full-summary-of-agents"
      },
      {
        name: '/decoders',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-all-decoders"
      },
      {
        name: '/decoders/:decoder_name',
        args: [
          {
            name: ':decoder_name'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-decoders-by-name"
      },
      {
        name: '/decoders/files',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-all-decoders-files"
      },
      {
        name: '/decoders/parents',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-all-parent-decoders"
      },
      {
        name: '/lists',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-all-lists"
      },
      {
        name: '/lists/files',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-paths-from-all-lists"
      },
      {
        name: '/manager/configuration',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-manager-configuration"
      },
      {
        name: '/manager/configuration/validation',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#check-wazuh-configuration"
      },
      {
        name: '/manager/files',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-local-file"
      },
      {
        name: '/manager/info',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-manager-information"
      },
      {
        name: '/manager/logs',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-ossec-log"
      },
      {
        name: '/manager/logs/summary',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-summary-of-ossec-log"
      },
      {
        name: '/manager/stats',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-manager-stats"
      },
      {
        name: '/manager/stats/analysisd',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-analysisd-stats"
      },
      {
        name: '/manager/stats/hourly',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-manager-stats-by-hour"
      },
      {
        name: '/manager/stats/remoted',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-remoted-stats"
      },
      {
        name: '/manager/stats/weekly',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-manager-stats-by-week"
      },
      {
        name: '/manager/status',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-manager-status"
      },
      {
        name: '/rootcheck/:agent_id',
        args: [
          {
            name: ':agent_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-rootcheck-database"
      },
      {
        name: '/rootcheck/:agent_id/cis',
        args: [
          {
            name: ':agent_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-rootcheck-cis-requirements"
      },
      {
        name: '/rootcheck/:agent_id/last_scan',
        args: [
          {
            name: ':agent_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-last-rootcheck-scan"
      },
      {
        name: '/rootcheck/:agent_id/pci',
        args: [
          {
            name: ':agent_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-rootcheck-pci-requirements"
      },
      {
        name: '/rules',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-all-rules"
      },
      {
        name: '/rules/:rule_id',
        args: [
          {
            name: ':rule_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-rules-by-id"
      },
      {
        name: '/rules/files',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-files-of-rules"
      },
      {
        name: '/rules/gdpr',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-rule-gdpr-requirements"
      },
      {
        name: '/rules/groups',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-rule-groups"
      },
      {
        name: '/rules/pci',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-rule-pci-requirements"
      },
      {
        name: '/rules/hipaa',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-rule-hipaa-requirements"
      },
      {
        name: '/rules/nist-800-53',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-rule-nist-800-53-requirements"
      },
      {
        name: '/rules/tsc',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-rule-tsc-requirements"
      },
      {
        name: '/syscheck/:agent_id',
        args: [
          {
            name: ':agent_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-syscheck-files"
      },
      {
        name: '/syscheck/:agent_id/last_scan',
        args: [
          {
            name: ':agent_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-last-syscheck-scan"
      },
      {
        name: '/syscollector/:agent_id/hardware',
        args: [
          {
            name: ':agent_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-hardware-info"
      },
      {
        name: '/syscollector/:agent_id/netaddr',
        args: [
          {
            name: ':agent_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-network-address-info-of-an-agent"
      },
      {
        name: '/syscollector/:agent_id/netiface',
        args: [
          {
            name: ':agent_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-network-interface-info-of-an-agent"
      },
      {
        name: '/syscollector/:agent_id/netproto',
        args: [
          {
            name: ':agent_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-network-protocol-info-of-an-agent"
      },
      {
        name: '/syscollector/:agent_id/os',
        args: [
          {
            name: ':agent_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-os-info"
      },
      {
        name: '/syscollector/:agent_id/packages',
        args: [
          {
            name: ':agent_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-packages-info"
      },
      {
        name: '/syscollector/:agent_id/ports',
        args: [
          {
            name: ':agent_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-ports-info-of-an-agent"
      },
      {
        name: '/syscollector/:agent_id/processes',
        args: [
          {
            name: ':agent_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#get-processes-info"
      }
    ]
  },
  {
    method: 'POST',
    endpoints: [
      {
        name: '/agents',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#add-agent"
      },
      {
        name: '/agents/group/:group_id',
        args: [
          {
            name: ':group_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#add-a-list-of-agents-to-a-group"
      },
      {
        name: '/agents/groups/:group_id/configuration',
        args: [
          {
            name: ':group_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#put-configuration-file-agent-conf-into-a-group"
      },
      {
        name: '/agents/groups/:group_id/files/:file_name',
        args: [
          {
            name: ':group_id'
          },
          {
            name: ':file_name'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#upload-file-into-a-group"
      },
      {
        name: '/agents/insert',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#insert-agent"
      },
      {
        name: '/agents/restart',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#restart-a-list-of-agents"
      },
      {
        name: '/cluster/:node_id/files',
        args: [
          {
            name: ':node_id'
          }
        ],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#update-local-file-at-any-cluster-node"
      },
      {
        name: '/manager/files',
        args: [],
        documentationLink: "https://documentation.wazuh.com/current/user-manual/api/reference.html#update-local-file"
      }
    ]
  }
];
