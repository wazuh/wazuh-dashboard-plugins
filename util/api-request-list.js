/*
 * Wazuh app - Module for get the list of routes in API in JSON format
 * Copyright (C) 2015-2019 Wazuh, Inc.
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
        ]
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
        ]
      },
      {
        name: '/agents/:agent_id/restart',
        args: [
          {
            name: ':agent_id'
          }
        ]
      },
      {
        name: '/agents/:agent_id/upgrade',
        args: [
          {
            name: ':agent_id'
          }
        ]
      },
      {
        name: '/agents/:agent_id/upgrade_custom',
        args: [
          {
            name: ':agent_id'
          }
        ]
      },
      {
        name: '/agents/:agent_name',
        args: [
          {
            name: ':agent_name'
          }
        ]
      },
      {
        name: '/agents/groups/:group_id',
        args: [
          {
            name: ':group_id'
          }
        ]
      },
      {
        name: '/agents/restart',
        args: []
      },
      {
        name: '/cluster/:node_id/restart',
        args: [
          {
            name: ':node_id'
          }
        ]
      },
      {
        name: '/cluster/restart',
        args: []
      },
      {
        name: '/manager/restart',
        args: []
      },
      {
        name: '/rootcheck',
        args: []
      },
      {
        name: '/rootcheck/:agent_id',
        args: [
          {
            name: ':agent_id'
          }
        ]
      },
      {
        name: '/syscheck',
        args: []
      },
      {
        name: '/syscheck/:agent_id',
        args: [
          {
            name: ':agent_id'
          }
        ]
      }
    ]
  },
  {
    method: 'DELETE',
    endpoints: [
      {
        name: '/agents',
        args: []
      },
      {
        name: '/agents/:agent_id',
        args: [
          {
            name: ':agent_id'
          }
        ]
      },
      {
        name: '/agents/:agent_id/group',
        args: [
          {
            name: ':agent_id'
          }
        ]
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
        ]
      },
      {
        name: '/agents/group/:group_id',
        args: [
          {
            name: ':group_id'
          }
        ]
      },
      {
        name: '/agents/groups',
        args: []
      },
      {
        name: '/agents/groups/:group_id',
        args: [
          {
            name: ':group_id'
          }
        ]
      },
      {
        name: '/cache',
        args: []
      },
      {
        name: '/cache',
        args: []
      },
      {
        name: '/rootcheck',
        args: []
      },
      {
        name: '/rootcheck/:agent_id',
        args: [
          {
            name: ':agent_id'
          }
        ]
      },
      {
        name: '/syscheck/:agent_id',
        args: [
          {
            name: ':agent_id'
          }
        ]
      }
    ]
  },
  {
    method: 'GET',
    endpoints: [
      {
        name: '/agents',
        args: []
      },
      {
        name: '/agents/:agent_id',
        args: [
          {
            name: ':agent_id'
          }
        ]
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
        ]
      },
      {
        name: '/agents/:agent_id/group/is_sync',
        args: [
          {
            name: ':agent_id'
          }
        ]
      },
      {
        name: '/agents/:agent_id/key',
        args: [
          {
            name: ':agent_id'
          }
        ]
      },
      {
        name: '/agents/:agent_id/upgrade_result',
        args: [
          {
            name: ':agent_id'
          }
        ]
      },
      {
        name: '/agents/groups',
        args: []
      },
      {
        name: '/agents/groups/:group_id',
        args: [
          {
            name: ':group_id'
          }
        ]
      },
      {
        name: '/agents/groups/:group_id/configuration',
        args: [
          {
            name: ':group_id'
          }
        ]
      },
      {
        name: '/agents/groups/:group_id/files',
        args: [
          {
            name: ':group_id'
          }
        ]
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
        ]
      },
      {
        name: '/agents/name/:agent_name',
        args: [
          {
            name: ':agent_name'
          }
        ]
      },
      {
        name: '/agents/no_group',
        args: []
      },
      {
        name: '/agents/outdated',
        args: []
      },
      {
        name: '/agents/stats/distinct',
        args: []
      },
      {
        name: '/agents/summary',
        args: []
      },
      {
        name: '/agents/summary/os',
        args: []
      },
      {
        name: '/cache',
        args: []
      },
      {
        name: '/cache/config',
        args: []
      },
      {
        name: '/ciscat/:agent_id/results',
        args: [
          {
            name: ':agent_id'
          }
        ]
      },
      {
        name: '/cluster/:node_id/configuration',
        args: [
          {
            name: ':node_id'
          }
        ]
      },
      {
        name: '/cluster/:node_id/configuration/validation',
        args: [
          {
            name: ':node_id'
          }
        ]
      },
      {
        name: '/cluster/:node_id/files',
        args: [
          {
            name: ':node_id'
          }
        ]
      },
      {
        name: '/cluster/:node_id/info',
        args: [
          {
            name: ':node_id'
          }
        ]
      },
      {
        name: '/cluster/:node_id/logs',
        args: [
          {
            name: ':node_id'
          }
        ]
      },
      {
        name: '/cluster/:node_id/logs/summary',
        args: [
          {
            name: ':node_id'
          }
        ]
      },
      {
        name: '/cluster/:node_id/stats',
        args: [
          {
            name: ':node_id'
          }
        ]
      },
      {
        name: '/cluster/:node_id/stats/analysisd',
        args: [
          {
            name: ':node_id'
          }
        ]
      },
      {
        name: '/cluster/:node_id/stats/hourly',
        args: [
          {
            name: ':node_id'
          }
        ]
      },
      {
        name: '/cluster/:node_id/stats/remoted',
        args: [
          {
            name: ':node_id'
          }
        ]
      },
      {
        name: '/cluster/:node_id/stats/weekly',
        args: [
          {
            name: ':node_id'
          }
        ]
      },
      {
        name: '/cluster/:node_id/status',
        args: [
          {
            name: ':node_id'
          }
        ]
      },
      {
        name: '/cluster/config',
        args: []
      },
      {
        name: '/cluster/configuration/validation',
        args: []
      },
      {
        name: '/cluster/healthcheck',
        args: []
      },
      {
        name: '/cluster/node',
        args: []
      },
      {
        name: '/cluster/nodes',
        args: []
      },
      {
        name: '/cluster/nodes/:node_name',
        args: [
          {
            name: ':node_name'
          }
        ]
      },
      {
        name: '/cluster/status',
        args: []
      },
      {
        name: '/manager/stats/remoted',
        args: []
      },
      {
        name: '/sca/:agent_id',
        args: [
          {
            name: ':agent_id'
          }
        ]
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
        ]
      },
      {
        name: '/decoders',
        args: []
      },
      {
        name: '/decoders/:decoder_name',
        args: [
          {
            name: ':decoder_name'
          }
        ]
      },
      {
        name: '/decoders/files',
        args: []
      },
      {
        name: '/decoders/parents',
        args: []
      },
      {
        name: '/lists',
        args: []
      },
      {
        name: '/lists/files',
        args: []
      },
      {
        name: '/manager/configuration',
        args: []
      },
      {
        name: '/manager/configuration/validation',
        args: []
      },
      {
        name: '/manager/files',
        args: []
      },
      {
        name: '/manager/info',
        args: []
      },
      {
        name: '/manager/logs',
        args: []
      },
      {
        name: '/manager/logs/summary',
        args: []
      },
      {
        name: '/manager/stats',
        args: []
      },
      {
        name: '/manager/stats/analysisd',
        args: []
      },
      {
        name: '/manager/stats/hourly',
        args: []
      },
      {
        name: '/manager/stats/remoted',
        args: []
      },
      {
        name: '/manager/stats/weekly',
        args: []
      },
      {
        name: '/manager/status',
        args: []
      },
      {
        name: '/rootcheck/:agent_id',
        args: [
          {
            name: ':agent_id'
          }
        ]
      },
      {
        name: '/rootcheck/:agent_id/cis',
        args: [
          {
            name: ':agent_id'
          }
        ]
      },
      {
        name: '/rootcheck/:agent_id/last_scan',
        args: [
          {
            name: ':agent_id'
          }
        ]
      },
      {
        name: '/rootcheck/:agent_id/pci',
        args: [
          {
            name: ':agent_id'
          }
        ]
      },
      {
        name: '/rules',
        args: []
      },
      {
        name: '/rules/:rule_id',
        args: [
          {
            name: ':rule_id'
          }
        ]
      },
      {
        name: '/rules/files',
        args: []
      },
      {
        name: '/rules/gdpr',
        args: []
      },
      {
        name: '/rules/groups',
        args: []
      },
      {
        name: '/rules/pci',
        args: []
      },
      {
        name: '/rules/hipaa',
        args: []
      },
      {
        name: '/rules/nist-800-53',
        args: []
      },
      {
        name: '/syscheck/:agent_id',
        args: [
          {
            name: ':agent_id'
          }
        ]
      },
      {
        name: '/syscheck/:agent_id/last_scan',
        args: [
          {
            name: ':agent_id'
          }
        ]
      },
      {
        name: '/syscollector/:agent_id/hardware',
        args: [
          {
            name: ':agent_id'
          }
        ]
      },
      {
        name: '/syscollector/:agent_id/netaddr',
        args: [
          {
            name: ':agent_id'
          }
        ]
      },
      {
        name: '/syscollector/:agent_id/netiface',
        args: [
          {
            name: ':agent_id'
          }
        ]
      },
      {
        name: '/syscollector/:agent_id/netproto',
        args: [
          {
            name: ':agent_id'
          }
        ]
      },
      {
        name: '/syscollector/:agent_id/os',
        args: [
          {
            name: ':agent_id'
          }
        ]
      },
      {
        name: '/syscollector/:agent_id/packages',
        args: [
          {
            name: ':agent_id'
          }
        ]
      },
      {
        name: '/syscollector/:agent_id/ports',
        args: [
          {
            name: ':agent_id'
          }
        ]
      },
      {
        name: '/syscollector/:agent_id/processes',
        args: [
          {
            name: ':agent_id'
          }
        ]
      }
    ]
  },
  {
    method: 'POST',
    endpoints: [
      {
        name: '/agents',
        args: []
      },
      {
        name: '/agents/group/:group_id',
        args: [
          {
            name: ':group_id'
          }
        ]
      },
      {
        name: '/agents/groups/:group_id/configuration',
        args: [
          {
            name: ':group_id'
          }
        ]
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
        ]
      },
      {
        name: '/agents/insert',
        args: []
      },
      {
        name: '/agents/restart',
        args: []
      },
      {
        name: '/cluster/:node_id/files',
        args: [
          {
            name: ':node_id'
          }
        ]
      },
      {
        name: '/manager/files',
        args: []
      }
    ]
  }
];
