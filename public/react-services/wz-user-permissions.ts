/*
 * Wazuh app - React hook for get query of Kibana searchBar
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

 // Data extrated of /security/actions endpoint
const wazuhPermissions = {
  "active-response:command": {
    "description": "Allow to execute active response commands in the agents",
    "resources": [
      "agent:id"
    ],
    "example": {
      "actions": [
        "active-response:command"
      ],
      "resources": [
        "agent:id:001"
      ],
      "effect": "allow"
    },
    "related_endpoints": [
      "PUT /active-response"
    ]
  },
  "agent:delete": {
    "description": "Delete system's agents",
    "resources": [
      "agent:id"
    ],
    "example": {
      "actions": [
        "agent:delete"
      ],
      "resources": [
        "agent:id:010"
      ],
      "effect": "allow"
    },
    "related_endpoints": [
      "DELETE /agents"
    ]
  },
  "agent:read": {
    "description": "Access to one or more agents basic information (id, name, group, last keep alive, etc)",
    "resources": [
      "agent:id"
    ],
    "example": {
      "actions": [
        "agent:read"
      ],
      "resources": [
        "agent:id:*"
      ],
      "effect": "allow"
    },
    "related_endpoints": [
      "GET /agents",
      "GET /agents/{agent_id}/config/{component}/{configuration}",
      "GET /agents/{agent_id}/group/is_sync",
      "GET /agents/{agent_id}/key",
      "GET /groups/{group_id}/agents",
      "GET /agents/no_group",
      "GET /agents/outdated",
      "GET /agents/stats/distinct",
      "GET /agents/summary/os",
      "GET /agents/summary/status",
      "GET /overview/agents"
    ]
  },
  "agent:create": {
    "description": "Create new agents",
    "resources": [
      "*:*"
    ],
    "example": {
      "actions": [
        "agent:create"
      ],
      "resources": [
        "*:*:*"
      ],
      "effect": "allow"
    },
    "related_endpoints": [
      "POST /agents",
      "POST /agents/insert",
      "POST /agents/insert/quick"
    ]
  },
  "agent:modify_group": {
    "description": "Change the group of specified agent",
    "resources": [
      "agent:id"
    ],
    "example": {
      "actions": [
        "agent:modify_group"
      ],
      "resources": [
        "agent:id:*"
      ],
      "effect": "allow"
    },
    "related_endpoints": [
      "DELETE /agents/{agent_id}/group",
      "DELETE /agents/{agent_id}/group/{group_id}",
      "PUT /agents/{agent_id}/group/{group_id}",
      "DELETE /agents/group",
      "PUT /agents/group",
      "DELETE /groups"
    ]
  },
  "group:modify_assignments": {
    "description": "Allow to change the agents assigned to the group",
    "resources": [
      "group:id"
    ],
    "example": {
      "actions": [
        "group:modify_assignments"
      ],
      "resources": [
        "group:id:*"
      ],
      "effect": "allow"
    },
    "related_endpoints": [
      "DELETE /agents/{agent_id}/group",
      "DELETE /agents/{agent_id}/group/{group_id}",
      "PUT /agents/{agent_id}/group/{group_id}",
      "DELETE /agents/group",
      "PUT /agents/group",
      "DELETE /groups"
    ]
  },
  "agent:restart": {
    "description": "Restart Wazuh for allowed agents",
    "resources": [
      "agent:id"
    ],
    "example": {
      "actions": [
        "agent:restart"
      ],
      "resources": [
        "agent:id:050",
        "agent:id:049"
      ],
      "effect": "deny"
    },
    "related_endpoints": [
      "PUT /agents/{agent_id}/restart",
      "PUT /agents/group/{group_id}/restart",
      "PUT /agents/node/{node_id}/restart",
      "PUT /agents/restart"
    ]
  },
  "agent:upgrade": {
    "description": "Upgrade the version of an agent",
    "resources": [
      "agent:id"
    ],
    "example": {
      "actions": [
        "agent:upgrade"
      ],
      "resources": [
        "agent:id:*"
      ],
      "effect": "allow"
    },
    "related_endpoints": [
      "PUT /agents/{agent_id}/upgrade",
      "PUT /agents/{agent_id}/upgrade_custom",
      "GET /agents/{agent_id}/upgrade_result"
    ]
  },
  "group:delete": {
    "description": "Delete system's groups",
    "resources": [
      "group:id"
    ],
    "example": {
      "actions": [
        "group:delete"
      ],
      "resources": [
        "group:id:*"
      ],
      "effect": "allow"
    },
    "related_endpoints": [
      "DELETE /groups"
    ]
  },
  "group:read": {
    "description": "Access to one or more groups basic information (id, name, agents, etc)",
    "resources": [
      "*:*"
    ],
    "example": {
      "actions": [
        "group:create"
      ],
      "resources": [
        "*:*:*"
      ],
      "effect": "allow"
    },
    "related_endpoints": [
      "GET /groups",
      "GET /groups/{group_id}/agents",
      "GET /groups/{group_id}/configuration",
      "GET /groups/{group_id}/files",
      "GET /groups/{group_id}/files/{file_name}/json",
      "GET /groups/{group_id}/files/{file_name}/xml",
      "GET /overview/agents"
    ]
  },
  "group:create": {
    "description": "Create new groups",
    "resources": [
      "*:*"
    ],
    "example": {
      "actions": [
        "group:create"
      ],
      "resources": [
        "*:*:*"
      ],
      "effect": "allow"
    },
    "related_endpoints": [
      "POST /groups"
    ]
  },
  "group:update_config": {
    "description": "Change group's configuration",
    "resources": [
      "group:id"
    ],
    "example": {
      "actions": [
        "group:update_config"
      ],
      "resources": [
        "group:id:*"
      ],
      "effect": "deny"
    },
    "related_endpoints": [
      "PUT /groups/{group_id}/configuration"
    ]
  },
  "cluster:read": {
    "description": "Read Wazuh's cluster configuration",
    "resources": [
      "node:id",
    ],
    "example": {
      "actions": [
        "cluster:read"
      ],
      "resources": [
        "node:id:worker1",
        "node:id:worker3"
      ],
      "effect": "deny"
    },
    "related_endpoints": [
      "PUT /agents/node/{node_id}/restart",
      "GET /cluster/local/info",
      "GET /cluster/nodes",
      "GET /cluster/healthcheck",
      "GET /cluster/local/config",
      "GET /cluster/{node_id}/status",
      "GET /cluster/{node_id}/info",
      "GET /cluster/{node_id}/configuration",
      "GET /cluster/{node_id}/stats",
      "GET /cluster/{node_id}/stats/hourly",
      "GET /cluster/{node_id}/stats/weekly",
      "GET /cluster/{node_id}/stats/analysisd",
      "GET /cluster/{node_id}/stats/remoted",
      "GET /cluster/{node_id}/logs",
      "GET /cluster/{node_id}/logs/summary",
      "GET /cluster/{node_id}/files",
      "PUT /cluster/{node_id}/files",
      "DELETE /cluster/{node_id}/files",
      "PUT /cluster/restart",
      "GET /cluster/configuration/validation",
      "GET /cluster/{node_id}/configuration/{component}/{configuration}"
    ]
  },
  "ciscat:read": {
    "description": "Get CIS-CAT results for a list of agents",
    "resources": [
      "agent:id"
    ],
    "example": {
      "actions": [
        "ciscat:read"
      ],
      "resources": [
        "agent:id:001",
        "agent:id:003"
      ],
      "effect": "deny"
    },
    "related_endpoints": [
      "GET /ciscat/{agent_id}/results",
      "GET /experimental/ciscat/results"
    ]
  },
  "cluster:status": {
    "description": "Check Wazuh's cluster status",
    "resources": [
      "*:*"
    ],
    "example": {
      "actions": [
        "cluster:status"
      ],
      "resources": [
        "*:*:*"
      ],
      "effect": "allow"
    },
    "related_endpoints": [
      "GET /cluster/status"
    ]
  },
  "cluster:read_api_config": {
    "description": "Check Wazuh's cluster API configuration",
    "resources": [
      "*:*"
    ],
    "example": {
      "actions": [
        "cluster:read_api_config"
      ],
      "resources": [
        "node:id:worker1",
        "node:id:worker3"
      ],
      "effect": "allow"
    },
    "related_endpoints": [
      "GET /cluster/api/config"
    ]
  },
  "cluster:update_api_config": {
    "description": "Modify Wazuh's cluster API configuration",
    "resources": [
      "*:*"
    ],
    "example": {
      "actions": [
        "cluster:update_api_config"
      ],
      "resources": [
        "node:id:worker1",
        "node:id:worker3"
      ],
      "effect": "allow"
    },
    "related_endpoints": [
      "PUT /cluster/api/config",
      "DELETE /cluster/api/config"
    ]
  },
  "cluster:read_file": {
    "description": "Read Wazuh's cluster files",
    "resources": [
      "node:id",
      "file:path",
      "node:id:*&file:path:*",
    ],
    "example": {
      "actions": [
        "cluster:read_file"
      ],
      "resources": [
        "node:id:worker1",
        "file:path:etc/rules/new-rules.xml"
      ],
      "effect": "allow"
    },
    "related_endpoints": [
      "GET /cluster/{node_id}/files"
    ]
  },
  "cluster:delete_file": {
    "description": "Delete Wazuh's cluster files",
    "resources": [
      "node:id",
      "file:path",
      "node:id:*&file:path:*",
    ],
    "example": {
      "actions": [
        "cluster:delete_file"
      ],
      "resources": [
        "node:id:worker1",
        "file:path:etc/rules/new-rules.xml"
      ],
      "effect": "deny"
    },
    "related_endpoints": [
      "PUT /cluster/{node_id}/files",
      "DELETE /cluster/{node_id}/files"
    ]
  },
  "cluster:upload_file": {
    "description": "Upload new file to Wazuh's cluster node",
    "resources": [
      "node:id"
    ],
    "example": {
      "actions": [
        "cluster:upload_file"
      ],
      "resources": [
        "node:id:worker1"
      ],
      "effect": "allow"
    },
    "related_endpoints": [
      "PUT /cluster/{node_id}/files"
    ]
  },
  "cluster:restart": {
    "description": "Restart Wazuh's cluster nodes",
    "resources": [
      "node:id"
    ],
    "example": {
      "actions": [
        "cluster:restart"
      ],
      "resources": [
        "node:id:worker1"
      ],
      "effect": "allow"
    },
    "related_endpoints": [
      "PUT /cluster/restart"
    ]
  },
  "lists:read": {
    "description": "Read lists files",
    "resources": [
      "list:path"
    ],
    "example": {
      "actions": [
        "lists:read"
      ],
      "resources": [
        "list:path:etc/lists/audit-keys"
      ],
      "effect": "deny"
    },
    "related_endpoints": [
      "GET /lists",
      "GET /lists/files"
    ]
  },
  "manager:read": {
    "description": "Read Wazuh manager configuration",
    "resources": [
      "*:*"
    ],
    "example": {
      "actions": [
        "manager:read"
      ],
      "resources": [
        "*:*:*"
      ],
      "effect": "allow"
    },
    "related_endpoints": [
      "GET /manager/status",
      "GET /manager/info",
      "GET /manager/configuration",
      "GET /manager/stats",
      "GET /manager/stats/hourly",
      "GET /manager/stats/weekly",
      "GET /manager/stats/analysisd",
      "GET /manager/stats/remoted",
      "GET /manager/logs",
      "GET /manager/logs/summary",
      "GET /manager/files",
      "PUT /manager/files",
      "DELETE /manager/files",
      "PUT /manager/restart",
      "GET /manager/configuration/validation",
      "GET /manager/configuration/{component}/{configuration}"
    ]
  },
  "manager:read_file": {
    "description": "Read Wazuh manager files",
    "resources": [
      "file:path"
    ],
    "example": {
      "actions": [
        "manager:read_file"
      ],
      "resources": [
        "file:path:etc/rules/new-rules.xml"
      ],
      "effect": "allow"
    },
    "related_endpoints": [
      "GET /manager/files"
    ]
  },
  "manager:delete_file": {
    "description": "Delete Wazuh manager files",
    "resources": [
      "file:path"
    ],
    "example": {
      "actions": [
        "manager:delete_file"
      ],
      "resources": [
        "file:path:etc/rules/new-rules.xml"
      ],
      "effect": "allow"
    },
    "related_endpoints": [
      "PUT /manager/files",
      "DELETE /manager/files"
    ]
  },
  "manager:upload_file": {
    "description": "Upload new file to Wazuh manager node",
    "resources": [
      "*:*"
    ],
    "example": {
      "actions": [
        "manager:upload_file"
      ],
      "resources": [
        "*:*:*"
      ],
      "effect": "deny"
    },
    "related_endpoints": [
      "PUT /manager/files"
    ]
  },
  "manager:read_api_config": {
    "description": "Read Wazuh manager API configuration",
    "resources": [
      "*:*"
    ],
    "example": {
      "actions": [
        "manager:read_api_config"
      ],
      "resources": [
        "*:*:*"
      ],
      "effect": "allow"
    },
    "related_endpoints": [
      "GET /manager/api/config"
    ]
  },
  "manager:update_api_config": {
    "description": "Modify Wazuh manager API configuration",
    "resources": [
      "*:*"
    ],
    "example": {
      "actions": [
        "manager:update_api_config"
      ],
      "resources": [
        "*:*:*"
      ],
      "effect": "allow"
    },
    "related_endpoints": [
      "PUT /manager/api/config",
      "DELETE /manager/api/config"
    ]
  },
  "manager:restart": {
    "description": "Restart Wazuh manager nodes",
    "resources": [
      "*:*"
    ],
    "example": {
      "actions": [
        "manager:restart"
      ],
      "resources": [
        "*:*:*"
      ],
      "effect": "deny"
    },
    "related_endpoints": [
      "PUT /manager/restart"
    ]
  },
  "mitre:read": {
    "description": "Get attacks information from MITRE database.",
    "resources": [
      "*:*"
    ],
    "example": {
      "actions": [
        "mitre:read"
      ],
      "resources": [
        "*:*:*"
      ],
      "effect": "allow"
    },
    "related_endpoints": [
      "GET /mitre"
    ]
  },
  "rules:read": {
    "description": "Read rules files",
    "resources": [
      "rule:file"
    ],
    "example": {
      "actions": [
        "rules:read"
      ],
      "resources": [
        "rule:file:0610-win-ms_logs_rules.xml"
      ],
      "effect": "allow"
    },
    "related_endpoints": [
      "GET /rules",
      "GET /rules/groups",
      "GET /rules/requirement/{requirement}",
      "GET /rules/files",
      "GET /rules/files/{filename}/download"
    ]
  },
  "sca:read": {
    "description": "Get a list of policies analyzed in the configuration assessment for a given agent",
    "resources": [
      "agent:id"
    ],
    "example": {
      "actions": [
        "sca:read"
      ],
      "resources": [
        "agent:id:*"
      ],
      "effect": "allow"
    },
    "related_endpoints": [
      "GET /sca/{agent_id}",
      "GET /sca/{agent_id}/checks/{policy_id}"
    ]
  },
  "syscheck:run": {
    "description": "Run syscheck",
    "resources": [
      "agent:id"
    ],
    "example": {
      "actions": [
        "syscheck:run"
      ],
      "resources": [
        "agent:id:*"
      ],
      "effect": "allow"
    },
    "related_endpoints": [
      "PUT /syscheck"
    ]
  },
  "syscheck:read": {
    "description": "Read information from syscheck's database",
    "resources": [
      "agent:id"
    ],
    "example": {
      "actions": [
        "syscheck:read"
      ],
      "resources": [
        "agent:id:011"
      ],
      "effect": "allow"
    },
    "related_endpoints": [
      "GET /syscheck/{agent_id}",
      "GET /syscheck/{agent_id}/last_scan"
    ]
  },
  "syscheck:clear": {
    "description": "Clear the syscheck database for specified agents",
    "resources": [
      "agent:id"
    ],
    "example": {
      "actions": [
        "syscheck:clear"
      ],
      "resources": [
        "agent:id:*"
      ],
      "effect": "deny"
    },
    "related_endpoints": [
      "DELETE /syscheck/{agent_id}",
      "DELETE /experimental/syscheck"
    ]
  },
  "decoders:read": {
    "description": "Read decoders files",
    "resources": [
      "decoder:file"
    ],
    "example": {
      "actions": [
        "decoders:read"
      ],
      "resources": [
        "decoder:file:*"
      ],
      "effect": "allow"
    },
    "related_endpoints": [
      "GET /decoders",
      "GET /decoders/files",
      "GET /decoders/files/{filename}/download",
      "GET /decoders/parents"
    ]
  },
  "syscollector:read": {
    "description": "Get syscollector information about a specified agents",
    "resources": [
      "agent:id"
    ],
    "example": {
      "actions": [
        "syscollector:read"
      ],
      "resources": [
        "agent:id:*"
      ],
      "effect": "allow"
    },
    "related_endpoints": [
      "GET /experimental/syscollector/hardware",
      "GET /experimental/syscollector/netaddr",
      "GET /experimental/syscollector/netiface",
      "GET /experimental/syscollector/netproto",
      "GET /experimental/syscollector/os",
      "GET /experimental/syscollector/packages",
      "GET /experimental/syscollector/ports",
      "GET /experimental/syscollector/processes",
      "GET /experimental/syscollector/hotfixes",
      "GET /syscollector/{agent_id}/hardware",
      "GET /syscollector/{agent_id}/hotfixes",
      "GET /syscollector/{agent_id}/netaddr",
      "GET /syscollector/{agent_id}/netiface",
      "GET /syscollector/{agent_id}/netproto",
      "GET /syscollector/{agent_id}/os",
      "GET /syscollector/{agent_id}/packages",
      "GET /syscollector/{agent_id}/ports",
      "GET /syscollector/{agent_id}/processes"
    ]
  },
  "security:read": {
    "description": "Allow read information about system's security resources",
    "resources": [
      "policy:id",
      "role:id",
      "user:id"
    ],
    "example": {
      "actions": [
        "security:read"
      ],
      "resources": [
        "policy:id:*",
        "role:id:2",
        "user:id:5"
      ],
      "effect": "allow"
    },
    "related_endpoints": [
      "GET /security/roles",
      "GET /security/policies",
      "GET /security/users"
    ]
  },
  "security:create": {
    "description": "Create new system security resources",
    "resources": [
      "*:*"
    ],
    "example": {
      "actions": [
        "security:create"
      ],
      "resources": [
        "*:*:*"
      ],
      "effect": "deny"
    },
    "related_endpoints": [
      "POST /security/roles",
      "POST /security/policies"
    ]
  },
  "security:delete": {
    "description": "Delete system's security resources",
    "resources": [
      "policy:id",
      "role:id",
      "user:id"
    ],
    "example": {
      "actions": [
        "security:update"
      ],
      "resources": [
        "policy:id:*",
        "role:id:3",
        "user:id:4"
      ],
      "effect": "deny"
    },
    "related_endpoints": [
      "DELETE /security/roles",
      "DELETE /security/policies",
      "DELETE /security/roles/{role_id}/policies",
      "DELETE /security/users/{user_id}/roles",
      "DELETE /security/users"
    ]
  },
  "security:update": {
    "description": "Allow update the information of system's security resources",
    "resources": [
      "policy:id",
      "role:id",
      "user:id"
    ],
    "example": {
      "actions": [
        "security:update"
      ],
      "resources": [
        "policy:id:*",
        "role:id:4",
        "user:id:3"
      ],
      "effect": "deny"
    },
    "related_endpoints": [
      "PUT /security/roles/{role_id}",
      "PUT /security/policies/{policy_id}",
      "POST /security/roles/{role_id}/policies",
      "POST /security/users/{user_id}/roles",
      "PUT /security/users/{user_id}"
    ]
  },
  "security:create_user": {
    "description": "Create new system user",
    "resources": [
      "*:*"
    ],
    "example": {
      "actions": [
        "security:create_user"
      ],
      "resources": [
        "*:*:*"
      ],
      "effect": "allow"
    },
    "related_endpoints": [
      "POST /security/users"
    ]
  },
  "security:read_config": {
    "description": "Read current security configuration",
    "resources": [
      "*:*"
    ],
    "example": {
      "actions": [
        "security:read_config"
      ],
      "resources": [
        "*:*:*"
      ],
      "effect": "allow"
    },
    "related_endpoints": [
      "GET /security/config"
    ]
  },
  "security:update_config": {
    "description": "Update current security configuration",
    "resources": [
      "*:*"
    ],
    "example": {
      "actions": [
        "security:update_config"
      ],
      "resources": [
        "*:*:*"
      ],
      "effect": "allow"
    },
    "related_endpoints": [
      "PUT /security/config",
      "DELETE /security/config"
    ]
  }
}

export class WzUserPermissions{
  // Check the missing permissions of the required ones that the user does not have
  static checkMissingUserPermissions = (requiredPermissions, userPermissions) => {
    const filtered = requiredPermissions.filter(permission => {
      if(Array.isArray(permission)){
        const missingOrPermissions = WzUserPermissions.checkMissingUserPermissions(permission, userPermissions);
        return Array.isArray(missingOrPermissions) ? missingOrPermissions.length === permission.length : missingOrPermissions;
      }
      const actionName = typeof permission === 'string' ? permission : permission.action;
      let actionResource = (typeof permission === 'string' && wazuhPermissions[actionName].resources.length === 1) ? (wazuhPermissions[actionName].resources[0] + ':*') : permission.resource;
      const actionResourceAll = actionResource
        .split('&')
        .map(function (str) {
          return str
            .split(':')
            .map(function (str, index) {
              return index === 2 ? '*' : str;
            })
            .join(':');
        })
        .join('&');

      let userPartialResources: string[] | undefined = userPermissions[actionName]
        ? Object.keys(userPermissions[actionName]).filter((resource) =>
            resource.match('&')
              ? ![actionResource, actionResourceAll].includes(resource) &&
                (resource.match(`/${actionResource}/`) || resource.match(`/${actionResourceAll}/`))
              : ![actionResource, actionResourceAll].includes(resource) &&
                (resource.match(actionResource.replace('*', '\\*')) ||
                  resource.match(actionResourceAll.replace('*', '\\*')))
          )
        : undefined;

      if (!userPermissions[actionName]) {
        return userPermissions.rbac_mode === RBAC_MODE_WHITE;
      }

      return userPermissions[actionName][actionResource]
        ? !isAllow(userPermissions[actionName][actionResource])
        : Object.keys(userPermissions[actionName]).some((resource) => {
            return resource.match(actionResourceAll.replace('*', '\\*')) !== null;
          })
        ? Object.keys(userPermissions[actionName]).some((resource) => {
            if (resource.match(actionResourceAll.replace('*', '\\*'))) {
              return !isAllow(userPermissions[actionName][resource]);
            }
          })
        : userPartialResources?.length
        ? userPartialResources.some((resource) => !isAllow(userPermissions[actionName][resource]))
        : wazuhPermissions[actionName].resources.find(
            (resource) => resource === RESOURCE_ANY_SHORT
          ) && userPermissions[actionName][RESOURCE_ANY]
        ? !isAllow(userPermissions[actionName][RESOURCE_ANY])
        : userPermissions.rbac_mode === RBAC_MODE_WHITE;
    });

    return filtered.length ? filtered : false;
  }
  // Check the missing roles of the required ones that the user does not have
  static checkMissingUserRoles(requiredRoles, userRoles) {
    const rolesUserNotOwn = requiredRoles.filter(requiredRole => !userRoles.includes(requiredRole));
    return rolesUserNotOwn.length ? rolesUserNotOwn : false;
  }
}

// Constants
const RESOURCE_ANY = '*:*:*';
const RESOURCE_ANY_SHORT = '*:*';
const RBAC_MODE_BLACK = 'black';
const RBAC_MODE_WHITE = 'white';

// Utility functions
const isAllow = value => value === 'allow';
