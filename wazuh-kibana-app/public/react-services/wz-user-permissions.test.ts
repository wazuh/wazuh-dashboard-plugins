/*
 * Wazuh app - React test for wz-user-permissions
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { WzUserPermissions } from './wz-user-permissions';

const requiredPermissionsCluster = [
  {
    action: 'list:delete',
    resource: 'file:path:etc/lists/security-eventchannel',
  },
  {
    action: `list:read`,
    resource: `node:id:*&file:path:*`,
  },
];

const requiredPermissionsManager = [
  {
    action: 'cluster:status',
    resource: '*:*:*',
  },
  {
    action: 'manager:read_file',
    resource: 'file:path:/etc/lists',
  },
  {
    action: 'manager:read',
    resource: '*:*:*',
  },
  {
    action: 'manager:upload_file',
    resource: 'file:path:/etc/lists',
  },
];

const userClusterTest = {
  'lists:read': {
    '*:*:*': 'allow',
    'list:path:*': 'allow',
    'node:id:*': 'allow',
  },
  'cluster:status': {
    '*:*:*': 'allow',
    'list:path:*': 'allow',
    'node:id:*': 'allow',
  },
  'cluster:read': {
    '*:*:*': 'allow',
    'list:path:*': 'allow',
    'node:id:*': 'allow',
  },
  'cluster:read_file': {
    '*:*:*': 'allow',
    'list:path:*': 'allow',
    'node:id:*': 'allow',
  },
  'cluster:delete_file': {
    '*:*:*': 'allow',
    'list:path:*': 'allow',
    'node:id:*': 'allow',
  },
  'cluster:upload_file': {
    '*:*:*': 'allow',
    'list:path:*': 'allow',
    'node:id:*': 'allow',
  },
  'group:read': {
    'group:id:*': 'allow',
  },
  rbac_mode: 'white',
};

const userManagerTest = [
  {
    'manager:read': {
      '*:*:*': 'allow',
      'file:path:*': 'allow',
    },
    'manager:upload_file': {
      '*:*:*': 'allow',
      'file:path:*': 'allow',
    },
    'manager:read_file': {
      '*:*:*': 'allow',
      'file:path:*': 'allow',
    },
    rbac_mode: 'white',
  },
];

const missingPermissionsForClusterUser = [
  {
    action: 'list:delete',
    resource: 'file:path:etc/lists/security-eventchannel',
  },
  {
    action: 'list:read',
    resource: 'node:id:*&file:path:*',
  },
];

const missingPermissionsForManagerUser = [
  {
    action: 'manager:read_file',
    resource: 'file:path:/etc/lists',
  },
  {
    action: 'manager:read',
    resource: '*:*:*',
  },
  {
    action: 'manager:upload_file',
    resource: 'file:path:/etc/lists',
  },
];

describe('Wazuh User Permissions', () => {
  describe('Given a Json with permissions that the user does not have', () => {
    describe('Should return a simple required permissions to show on view', () => {
      it('Should return a simple missing permissions for manager user', () => {
        const simplePermission = [
          {
            action: 'manager:status',
            resource: '*:*:*',
          },
        ];
        const result = WzUserPermissions.checkMissingUserPermissions(simplePermission, {
          'lists:read': {
            'list:path:*': 'allow',
          },
          rbac_mode: 'white',
        });
        expect(result).toEqual(simplePermission);
      });

      it('Should return a simple missing permissions for cluster user', () => {
        const simplePermission = [
          {
            action: 'cluster:status',
            resource: '*:*:*',
          },
        ];
        const result = WzUserPermissions.checkMissingUserPermissions(simplePermission, {
          'lists:read': {
            'list:path:*': 'allow',
          },
          rbac_mode: 'white',
        });
        expect(result).toEqual(simplePermission);
      });
    });

    describe('Should return all permissions ok', () => {
      it('Should return all permissions ok for manager user', () => {
        const simplePermission = [
          {
            action: 'manager:read_file',
            resource: 'file:path:/etc/lists',
          },
        ];
        const result = WzUserPermissions.checkMissingUserPermissions(
          simplePermission,
          userManagerTest
        );
        expect(result).toEqual(false); // false === all permissions OK
      });

      it('Should return a simple missing permissions for cluster user', () => {
        const simplePermission = [
          {
            action: 'cluster:status',
            resource: '*:*:*',
          },
        ];
        const result = WzUserPermissions.checkMissingUserPermissions(
          simplePermission,
          userClusterTest
        );
        expect(result).toEqual(false);
      });
    });

    describe('Should return OK for group view', () => {
      it('Should return all permissions OK for cluster user', () => {
        const simplePermission = [
          {
            action: 'group:read',
            resource: 'group:id:*',
          },
        ];

        const result = WzUserPermissions.checkMissingUserPermissions(
          simplePermission,
          userClusterTest
        );
        expect(result).toEqual(false); // false === all permissions OK
      });
    });

    describe('Should return all the required permissions to show on view', () => {
      it('Should return missing permissions for manager user', () => {
        const result = WzUserPermissions.checkMissingUserPermissions(
          requiredPermissionsManager,
          userClusterTest
        );
        expect(result).toEqual(missingPermissionsForManagerUser);
      });

      it('Should return missing permissions for cluster user', () => {
        const result = WzUserPermissions.checkMissingUserPermissions(
          requiredPermissionsCluster,
          userClusterTest
        );
        expect(result).toEqual(missingPermissionsForClusterUser);
      });
    });

    describe('Should return all the required permissions to show Agent and Groups view', () => {
      const requiredAgentView = [
        {
          action: 'agent:read',
          resource: 'agent:id:*',
        },
        {
          action: 'group:read',
          resource: 'group:id:*',
        },
      ];
      const userAgent1 = {
        'agent:read': {
          'agent:id:001': 'allow',
        },
        'group:read': {
          'group:id:001': 'allow',
        },
        rbac_mode: 'white',
      };
      it('Should return OK for particular agent and group id', () => {
        const result = WzUserPermissions.checkMissingUserPermissions(
          requiredAgentView,
          userAgent1
        );
        expect(result).toEqual(false);
      });
    });

    describe('Should return all the required permissions to show Agent and Groups view', () => {
      const requiredAgentView = [
        {
          action: 'agent:read',
          resource: 'agent:id:*',
        },
        {
          action: 'group:read',
          resource: 'group:id:*',
        },
      ];
      const userAgent1 = {
        'agent:read': {
          'agent:id:*': 'allow',
        },
        'group:read': {
          'group:id:*': 'allow',
        },
        rbac_mode: 'white',
      };
      it('Should return OK for all agents and groups', () => {
        const result = WzUserPermissions.checkMissingUserPermissions(
          requiredAgentView,
          userAgent1
        );
        expect(result).toEqual(false);
      });
    });

    describe('Should return all OK to show inventory on MITRE view', () => {
      const requiredMitreView = [
        {
          action: 'mitre:read',
          resource: '*:*:*',
        },
        {
          action: 'agent:read',
          resource: 'agent:id:001',
        },
        {
          action: 'syscheck:read',
          resource: 'agent:id:001',
        },
      ];
      const userMitre1 = {
        'agent:read': {
          'agent:id:*': 'allow',
        },
        'syscheck:read': {
          'agent:id:*': 'allow',
        },
        'mitre:read': {
          '*:*:*': 'allow',
        },
        rbac_mode: 'white',
      };

      it('Should return OK for the agent 001', () => {
        const result = WzUserPermissions.checkMissingUserPermissions(
          requiredMitreView,
          userMitre1
        );
        expect(result).toEqual(false);
      });

      describe('Should return all the required permissions to update decoder file', () => {
        const requiredAgentView = [
          {
            action: 'decoders:update',
            resource: 'decoder:file:*',
          },
          {
            action: 'decoders:read',
            resource: 'decoder:file:*',
          },
        ];
        const userAgent1 = {
          'decoders:update': {
            '*:*:*': 'allow',
          },
          'decoders:read': {
            'decoder:file:*': 'allow',
          },
          rbac_mode: 'white',
        };
        it('Should return OK for all agents and groups', () => {
          const result = WzUserPermissions.checkMissingUserPermissions(
            requiredAgentView,
            userAgent1
          );
          expect(result).toEqual(false);
        });
      });
    });
  });
});
