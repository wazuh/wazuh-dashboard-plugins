var userPoliciesMap = {
  PLUGIN_SECURITY_USERS_ALL: {
    'security:read': {
      'user:id:*': 'allow',
      'role:id:*': 'allow',
    },
    rbac_mode: 'black',
  },
  PLUGIN_SECURITY_USERS_DENY_USERS: {
    'security:read': {
      'user:id:*': 'deny',
      'role:id:*': 'allow',
    },
    rbac_mode: 'black',
  },
  PLUGIN_SECURITY_USERS_DENY_ROLES: {
    'security:read': {
      'user:id:*': 'allow',
      'role:id:*': 'deny',
    },
    rbac_mode: 'black',
  },
  PLUGIN_SECURITY_USERS_DENY_USERS_ROLES: {
    'security:read': {
      'user:id:*': 'deny',
      'role:id:*': 'deny',
    },
    rbac_mode: 'black',
  },
  PLUGIN_SECURITY_USERS_DENY_CREATE_USER: {
    'security:read': {
      'user:id:*': 'allow',
      'role:id:*': 'allow',
    },
    'security:create_user': {
      '*:*:*': 'deny',
    },
    rbac_mode: 'black',
  },
  PLUGIN_SECURITY_USERS_ALLOW_CREATE_USER_DENY_EDIT_RUN_AS: {
    'security:read': {
      'user:id:*': 'allow',
      'role:id:*': 'allow',
    },
    'security:create_user': {
      '*:*:*': 'allow',
    },
    'security:edit_run_as': {
      '*:*:*': 'deny',
    },
    rbac_mode: 'black',
  },
  PLUGIN_SECURITY_USERS_ALLOW_EDIT_USER: {
    'security:read': {
      'user:id:*': 'allow',
      'role:id:*': 'allow',
    },
    'security:create_user': {
      '*:*:*': 'allow',
    },
    'security:update': {
      'user:id:*': 'allow',
    },
    rbac_mode: 'black',
  },
  PLUGIN_SECURITY_USERS_ALLOW_EDIT_USER_ID_101: {
    'security:read': {
      'user:id:*': 'allow',
      'role:id:*': 'allow',
    },
    'security:create_user': {
      '*:*:*': 'allow',
    },
    'security:update': {
      'user:id:101': 'deny',
      'user:id:102': 'allow',
    },
    rbac_mode: 'black',
  },
  PLUGIN_SECURITY_USERS_ALLOW_CREATE_USER_DENY_UPDATE_USER: {
    'security:read': {
      'user:id:*': 'allow',
      'role:id:*': 'allow',
    },
    'security:create_user': {
      '*:*:*': 'allow',
    },
    'security:update': {
      'user:id:*': 'deny',
    },
    rbac_mode: 'black',
  },
  PLUGIN_SECURITY_USERS_ALLOW_CREATE_USER_ALLOW_UPDATE_USER_DENY_EDIT_RUN_AS: {
    'security:read': {
      'user:id:*': 'allow',
      'role:id:*': 'allow',
    },
    'security:create_user': {
      '*:*:*': 'allow',
    },
    'security:update': {
      'user:id:*': 'allow',
    },
    'security:edit_run_as': {
      'user:id:*': 'deny',
    },
    rbac_mode: 'black',
  },
  PLUGIN_SECURITY_USERS_DENY_EDIT_USER: {
    'security:read': {
      'user:id:*': 'allow',
      'role:id:*': 'allow',
    },
    'security:create_user': {
      '*:*:*': 'allow',
    },
    'security:update': {
      'user:id:*': 'deny',
    },
    rbac_mode: 'black',
  },
  PLUGIN_SECURITY_USERS_DENY_DELETE_USER_101: {
    'security:read': {
      'user:id:*': 'allow',
      'role:id:*': 'allow',
    },
    'security:create_user': {
      '*:*:*': 'allow',
    },
    'security:delete': {
      'user:id:100': 'allow',
      'user:id:101': 'deny',
    },
    rbac_mode: 'black',
  },
  PLUGIN_SECURITY_ROLES_ALLOW_READ_ROLES_POLICIES: {
    'security:read': {
      'role:id:*': 'allow',
      'policy:id:*': 'allow',
    },
    rbac_mode: 'black',
  },
  PLUGIN_SECURITY_ROLES_ALLOW_READ_POLICIES_DENY_READ_ROLE: {
    'security:read': {
      'role:id:*': 'deny',
      'policy:id:*': 'allow',
    },
    rbac_mode: 'black',
  },
  PLUGIN_SECURITY_ROLES_DENY_READ_POLICIES_ALLOW_READ_ROLE: {
    'security:read': {
      'role:id:*': 'allow',
      'policy:id:*': 'deny',
    },
    rbac_mode: 'black',
  },
  PLUGIN_SECURITY_ROLES_DENY_READ_POLICIES_DENY_READ_ROLE: {
    'security:read': {
      'role:id:*': 'deny',
      'policy:id:*': 'deny',
    },
    rbac_mode: 'black',
  },
  PLUGIN_SECURITY_ROLES_DENY_CREATE_POLICY: {
    'security:read': {
      'role:id:*': 'allow',
      'policy:id:*': 'allow',
    },
    'security:create': {
      '*:*:*': 'deny',
    },
    rbac_mode: 'black',
  },
  PLUGIN_SECURITY_ROLES_ALL_DENY_DELETE_ROLE_101_ALLOW_ROLE_102: {
    'security:read': {
      'role:id:*': 'allow',
      'policy:id:*': 'allow',
    },
    'security:delete': {
      'role:id:101': 'deny',
      'role:id:102': 'allow',
    },
    rbac_mode: 'black',
  },
  PLUGIN_SECURITY_ROLES_DENY_UPDATE_ROLE_101_ALLOW_UPDATE_ROLE_102: {
    'security:read': {
      'role:id:*': 'allow',
      'policy:id:*': 'allow',
    },
    'security:update': {
      'role:id:101': 'deny',
      'role:id:102': 'allow',
    },
    'security:delete': {
      'role:id:101': 'deny',
      'role:id:102': 'deny',
    },
    rbac_mode: 'black',
  },
  PLUGIN_SECURITY_POLICIES_ALLOW_READ_POLICIES: {
    'security:read': {
      'policy:id:*': 'allow',
    },
    rbac_mode: 'black',
  },
  PLUGIN_SECURITY_POLICIES_DENY_READ_POLICIES: {
    'security:read': {
      'policy:id:*': 'deny',
    },
    rbac_mode: 'black',
  },
  PLUGIN_SECURITY_POLICIES_ALLOW_READ_POLICIES_DENY_DELETE_101_ALLOW_DELETE_102:
    {
      'security:read': {
        'policy:id:*': 'allow',
      },
      'security:delete': {
        'policy:id:101': 'deny',
        'policy:id:102': 'allow',
      },
      rbac_mode: 'black',
    },
  PLUGIN_SECURITY_POLICIES_DENY_CREATE_POLICY: {
    'security:read': {
      'policy:id:*': 'allow',
    },
    'security:create': {
      '*:*:*': 'deny',
    },
    rbac_mode: 'black',
  },
  PLUGIN_SECURITY_POLICIES_ALLOW_CREATE_POLICY: {
    'security:read': {
      'policy:id:*': 'allow',
    },
    'security:create': {
      '*:*:*': 'allow',
    },
    rbac_mode: 'black',
  },
  PLUGIN_SECURITY_ROLES_MAPPING_ALLOW_READ_ROLES_MAPPING: {
    'security:read': {
      'rule:id:*': 'allow',
    },
    rbac_mode: 'black',
  },
  PLUGIN_SECURITY_ROLES_MAPPING_DENY_READ_ROLES_MAPPING: {
    'security:read': {
      'role:id:*': 'deny',
    },
    rbac_mode: 'black',
  },
  PLUGIN_SECURITY_ROLES_MAPPING_DENY_READ_RULES_MAPPING: {
    'security:read': {
      'rule:id:*': 'deny',
    },
    rbac_mode: 'black',
  },
  PLUGIN_SECURITY_ROLES_MAPPING_DENY_READ_ROLE_DENY_READ_RULES_MAPPING: {
    'security:read': {
      'role:id:*': 'deny',
      'rule:id:*': 'deny',
    },
    rbac_mode: 'black',
  },
  PLUGIN_SECURITY_ROLES_MAPPING_ALLOW_READ_ROLES_MAPPING_DENY_DELETE_ROLE_MAPPING_101:
    {
      'security:read': {
        'rule:id:*': 'allow',
      },
      'security:delete': {
        'rule:id:101': 'deny',
        'rule:id:102': 'allow',
      },
      rbac_mode: 'black',
    },
  PLUGIN_SECURITY_ROLES_MAPPING_ALLOW_READ_ROLES_MAPPING_DENY_CREATE_ROLE_MAPPING:
    {
      'security:read': {
        'rule:id:*': 'allow',
      },
      'security:create': {
        '*:*:*:': 'deny',
      },
      rbac_mode: 'black',
    },
  PLUGIN_SECURITY_ROLES_MAPPING_ALLOW_READ_ROLES_MAPPING_ALLOW_CREATE_ROLE_MAPPING:
    {
      'security:read': {
        'rule:id:*': 'allow',
      },
      'security:create': {
        '*:*:*': 'allow',
      },
      rbac_mode: 'black',
    },
  PLUGIN_SECURITY_ROLES_MAPPING_ALLOW_READ_ROLES_MAPPING_ALLOW_CREATE_ROLE_MAPPING_ALLOW_UPDATE_ROLE_MAPPING_DENY_DELETE_ROLE_MAPPING:
    {
      'security:read': {
        'rule:id:*': 'allow',
      },
      'security:create': {
        '*:*:*': 'allow',
      },
      'security:update': {
        'rule:id:*': 'allow',
      },
      'security:delete': {
        'rule:id:*': 'deny',
      },
      rbac_mode: 'black',
    },
  PLUGIN_SECURITY_ROLES_MAPPING_ALLOW_READ_ROLES_MAPPING_ALLOW_CREATE_ROLE_MAPPING_DENY_UPDATE_ROLE_MAPPING_ALLOW_DELETE_ROLE_MAPPING:
    {
      'security:read': {
        'rule:id:*': 'allow',
      },
      'security:create': {
        '*:*:*': 'allow',
      },
      'security:update': {
        'rule:id:*': 'deny',
      },
      'security:delete': {
        'rule:id:*': 'allow',
      },
      rbac_mode: 'black',
    },
};

var selectedUserPolicy = userPoliciesMap['PLUGIN_SECURITY_USERS_ALL'];

var response = {
  data: selectedUserPolicy,
  message: 'Current user processed policies information was returned',
  error: 0,
};

respond().withStatusCode(200).withData(JSON.stringify(response));
