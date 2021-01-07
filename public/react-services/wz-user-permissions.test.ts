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

import { WzUserPermissions } from './wz-user-permissions';

const requiredPermissionsCluster = [
  {
    action: 'cluster:delete_file',
    resource: 'file:path:etc/lists/security-eventchannel',
  },
  {
    action: `cluster:read_file`,
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
    action: 'cluster:delete_file',
    resource: 'file:path:etc/lists/security-eventchannel',
  },
  {
    action: 'cluster:read_file',
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
  });
});
