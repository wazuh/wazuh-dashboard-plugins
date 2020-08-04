/*
 * Wazuh app - App State Reducers
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

const initialState = {
  currentAPI: '',
  showMenu: false,
  wazuhNotReadyYet: '',
  currentTab: '',
  extensions: {},
  adminMode: false,
  currentPlatform: false,
  currentAgentData: {},
  showExploreAgentModal: false,
  showExploreAgentModalGlobal: false,
  userPermissions: {
    "agent:create": {
      "*:*:*": "allow"
    },
    "group:create": {
      "*:*:*": "allow"
    },
    "agent:read": {
      "agent:id:*": "allow",
      "agent:group:*": "allow"
    },
    "agent:delete": {
      "agent:id:*": "allow",
      "agent:group:*": "allow"
    },
    "agent:modify_group": {
      "agent:id:*": "allow",
      "agent:group:*": "allow"
    },
    "agent:restart": {
      "agent:id:*": "allow",
      "agent:group:*": "allow"
    },
    "agent:upgrade": {
      "agent:id:*": "allow",
      "agent:group:*": "allow"
    },
    "group:read": {
      "group:id:*": "allow"
    },
    "group:delete": {
      "group:id:*": "allow"
    },
    "group:update_config": {
      "group:id:*": "allow"
    },
    "group:modify_assignments": {
      "group:id:*": "allow"
    },
    "active-response:command": {
      "agent:id:*": "allow"
    },
    "security:create": {
      "*:*:*": "allow"
    },
    "security:create_user": {
      "*:*:*": "allow"
    },
    "security:read_config": {
      "*:*:*": "allow"
    },
    "security:update_config": {
      "*:*:*": "allow"
    },
    "security:revoke": {
      "*:*:*": "allow"
    },
    "security:read": {
      "role:id:*": "allow",
      "policy:id:*": "allow",
      "user:id:*": "allow"
    },
    "security:update": {
      "role:id:*": "allow",
      "policy:id:*": "allow",
      "user:id:*": "allow"
    },
    "security:delete": {
      "role:id:*": "allow",
      "policy:id:*": "allow",
      "user:id:*": "allow"
    },
    "cluster:status": {
      "*:*:*": "allow"
    },
    "manager:read": {
      "*:*:*": "allow"
    },
    "manager:read_api_config": {
      "*:*:*": "allow"
    },
    "manager:update_api_config": {
      "*:*:*": "allow"
    },
    "manager:upload_file": {
      "*:*:*": "allow",
      "file:path:etc/rules/local_rules.xml": "deny",
      "file:path:etc/lists/audit-keys": "deny",
      "file:path:etc/rules/0010-rules_config.xml": "deny"
    },
    "manager:restart": {
      "*:*:*": "allow"
    },
    "manager:delete_file": {
      "*:*:*": "allow",
      "file:path:*": "allow",
      "file:path:etc/lists/audit-keys": "deny",
      "file:path:etc/rules/local_rules.xml": "deny",
      "file:path:etc/decoders/local_decoder.xml": "deny"
    },
    "manager:read_file": {
      "file:path:*": "allow",
      "file:path:etc/rules/local_rules.xml": "deny",
      "file:path:etc/lists/audit-keys": "deny",
      "file:path:ruleset/rules/0010-rules_config.xml": "deny",
      "file:path:etc/decoders/local_decoder.xml": "deny",
      "file:path:ruleset/decoders/0005-wazuh_decoders.xml": "deny",
    },
    "cluster:delete_file": {
      "node:id:*": "allow",
      "node:id:*&file:path:*": "allow"
    },
    "cluster:read_api_config": {
      "node:id:*": "allow"
    },
    "cluster:read": {
      "node:id:*": "allow"
    },
    "cluster:update_api_config": {
      "node:id:*": "allow"
    },
    // "cluster:restart": {
    //   "node:id:*": "allow"
    // },
    // "cluster:upload_file": {
    //   "node:id:*": "allow"
    // },
    "cluster:read_file": {
      "node:id:*&file:path:*": "allow"
    },
    "ciscat:read": {
      "agent:id:*": "allow"
    },
    "decoders:read": {
      "decoder:file:*": "allow"
    },
    "lists:read": {
      "list:path:*": "allow"
    },
    "rules:read": {
      "rule:file:*": "allow"
    },
    "mitre:read": {
      "*:*:*": "allow"
    },
    "sca:read": {
      "agent:id:*": "allow"
    },
    "syscheck:clear": {
      "agent:id:*": "allow"
    },
    "syscheck:read": {
      "agent:id:*": "allow"
    },
    "syscheck:run": {
      "agent:id:*": "allow"
    },
    "syscollector:read": {
      "agent:id:*": "allow"
    },
    "rbac_mode": "black"
  },
  userRoles: {
    "id": 1,
    "name": "administrator",
    "rule": {
      "FIND": {
        "r'^auth[a-zA-Z]+$'": [
          "full_admin"
        ]
      }
    },
    "policies": [
      {
        "id": 1,
        "name": "agents_all_resourceless",
        "policy": {
          "actions": [
            "agent:create",
            "group:create"
          ],
          "resources": [
            "*:*:*"
          ],
          "effect": "allow"
        }
      },
      {
        "id": 2,
        "name": "agents_all_agents",
        "policy": {
          "actions": [
            "agent:read",
            "agent:delete",
            "agent:modify_group",
            "agent:restart",
            "agent:upgrade"
          ],
          "resources": [
            "agent:id:*",
            "agent:group:*"
          ],
          "effect": "allow"
        }
      },
      {
        "id": 3,
        "name": "agents_all_groups",
        "policy": {
          "actions": [
            "group:read",
            "group:delete",
            "group:update_config",
            "group:modify_assignments"
          ],
          "resources": [
            "group:id:*"
          ],
          "effect": "allow"
        }
      },
      {
        "id": 6,
        "name": "agents_commands_agents",
        "policy": {
          "actions": [
            "active-response:command"
          ],
          "resources": [
            "agent:id:*"
          ],
          "effect": "allow"
        }
      },
      {
        "id": 7,
        "name": "security_all_resourceless",
        "policy": {
          "actions": [
            "security:create",
            "security:create_user",
            "security:read_config",
            "security:update_config",
            "security:revoke"
          ],
          "resources": [
            "*:*:*"
          ],
          "effect": "allow"
        }
      },
      {
        "id": 8,
        "name": "security_all_security",
        "policy": {
          "actions": [
            "security:read",
            "security:update",
            "security:delete"
          ],
          "resources": [
            "role:id:*",
            "policy:id:*",
            "user:id:*"
          ],
          "effect": "allow"
        }
      },
      {
        "id": 20,
        "name": "cluster_all_resourceless",
        "policy": {
          "actions": [
            "cluster:status",
            "manager:read",
            "manager:read_api_config",
            "manager:update_api_config",
            "manager:upload_file",
            "manager:restart",
            "manager:delete_file"
          ],
          "resources": [
            "*:*:*"
          ],
          "effect": "allow"
        }
      },
      {
        "id": 21,
        "name": "cluster_all_files",
        "policy": {
          "actions": [
            "manager:delete_file",
            "manager:read_file"
          ],
          "resources": [
            "file:path:*"
          ],
          "effect": "allow"
        }
      },
      {
        "id": 22,
        "name": "cluster_all_nodes",
        "policy": {
          "actions": [
            "cluster:delete_file",
            "cluster:read_api_config",
            "cluster:read",
            "cluster:read_api_config",
            "cluster:update_api_config",
            "cluster:restart",
            "cluster:upload_file"
          ],
          "resources": [
            "node:id:*"
          ],
          "effect": "allow"
        }
      },
      {
        "id": 23,
        "name": "cluster_all_combination",
        "policy": {
          "actions": [
            "cluster:read_file",
            "cluster:delete_file"
          ],
          "resources": [
            "node:id:*&file:path:*"
          ],
          "effect": "allow"
        }
      },
      {
        "id": 11,
        "name": "ciscat_read_ciscat",
        "policy": {
          "actions": [
            "ciscat:read"
          ],
          "resources": [
            "agent:id:*"
          ],
          "effect": "allow"
        }
      },
      {
        "id": 12,
        "name": "decoders_read_decoders",
        "policy": {
          "actions": [
            "decoders:read"
          ],
          "resources": [
            "decoder:file:*"
          ],
          "effect": "allow"
        }
      },
      {
        "id": 14,
        "name": "lists_read_rules",
        "policy": {
          "actions": [
            "lists:read"
          ],
          "resources": [
            "list:path:*"
          ],
          "effect": "allow"
        }
      },
      {
        "id": 15,
        "name": "rules_read_rules",
        "policy": {
          "actions": [
            "rules:read"
          ],
          "resources": [
            "rule:file:*"
          ],
          "effect": "allow"
        }
      },
      {
        "id": 13,
        "name": "mitre_read_mitre",
        "policy": {
          "actions": [
            "mitre:read"
          ],
          "resources": [
            "*:*:*"
          ],
          "effect": "allow"
        }
      },
      {
        "id": 16,
        "name": "sca_read_sca",
        "policy": {
          "actions": [
            "sca:read"
          ],
          "resources": [
            "agent:id:*"
          ],
          "effect": "allow"
        }
      },
      {
        "id": 18,
        "name": "syscheck_all_syscheck",
        "policy": {
          "actions": [
            "syscheck:clear",
            "syscheck:read",
            "syscheck:run"
          ],
          "resources": [
            "agent:id:*"
          ],
          "effect": "allow"
        }
      },
      {
        "id": 19,
        "name": "syscollector_read_syscollector",
        "policy": {
          "actions": [
            "syscollector:read"
          ],
          "resources": [
            "agent:id:*"
          ],
          "effect": "allow"
        }
      }
    ]
  }
};

const appStateReducers = (state = initialState, action) => {
  if (action.type === 'UPDATE_CURRENT_API') {
    return {
      ...state,
      currentAPI: action.currentAPI
    };
  }
  
  if (action.type === 'SHOW_MENU') {
    return {
      ...state,
      showMenu: action.showMenu
    };
  }

  if (action.type === 'UPDATE_WAZUH_NOT_READY_YET') {
    return {
      ...state,
      wazuhNotReadyYet: action.wazuhNotReadyYet
    };
  }

  if (action.type === 'UPDATE_WAZUH_CURRENT_TAB') {
    return {
      ...state,
      currentTab: action.currentTab
    };
  }

  if (action.type === 'UPDATE_EXTENSIONS') {
    return {
      ...state,
      extensions: action.extensions
    };
  }

  if (action.type === 'UPDATE_ADMIN_MODE') {
    return {
      ...state,
      adminMode: action.adminMode
    };
  }

  if (action.type === 'UPDATE_CURRENT_PLATFORM') {
    return {
      ...state,
      currentPlatform: action.currentPlatform
    };
  }

  if (action.type === 'UPDATE_SELECTED_AGENT_DATA') {
    return {
      ...state,
      currentAgentData: action.currentAgentData
    };
  }


  if (action.type === 'SHOW_EXPLORE_AGENT_MODAL') {
    return {
      ...state,
      showExploreAgentModal: action.showExploreAgentModal
    };
  }


  if (action.type === 'SHOW_EXPLORE_AGENT_MODAL_GLOBAL') {
    return {
      ...state,
      showExploreAgentModalGlobal: action.showExploreAgentModalGlobal
    };
  }



  return state;
};

export default appStateReducers;
