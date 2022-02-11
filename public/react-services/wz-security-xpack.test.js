/*
 * Wazuh app
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { WzSecurityXpack } from './wz-security-xpack';

jest.mock('./generic-request', () => ({
  GenericRequest: {
    request: (method, path) => {
      return {
        data: {
          username: 'wazuh_system',
          roles: ['kibana_system', 'wazuh'],
          full_name: 'wazuh',
          email: '',
          metadata: {},
          enabled: true,
        },
      };
    },
  },
}));
jest.mock('./wz-request', () => ({
  WzRequest: {
    apiReq: (method, path, params) => {
      return {
        data: {
          id: 3,
          name: 'agents_all_groups',
          policy: {
            actions: [
              'group:read',
              'group:delete',
              'group:update_config',
              'group:modify_assignments',
            ],
            resources: ['group:id:*'],
            effect: 'allow',
          },
          roles: [1, 5],
        },
      };
    },
  },
}));
describe('Wazuh Internal Users with X-Pack', () => {
  it('Should create a X-Pack policy', async () => {
    const users = await WzSecurityXpack.createPolicy();
    const expected_result = {
      id: 3,
      name: 'agents_all_groups',
      policy: {
        actions: ['group:read', 'group:delete', 'group:update_config', 'group:modify_assignments'],
        resources: ['group:id:*'],
        effect: 'allow',
      },
      roles: [1, 5],
    };
    expect(users).toEqual(expected_result);
  });
  it('Should create,edit and delete a X-Pack user and also gets all the X-pack internal users', async () => {
    const createUser = await WzSecurityXpack.createUser();
    const users = await WzSecurityXpack.getUsers();
    const editUser = await WzSecurityXpack.editUser();
    const deleteUser = await WzSecurityXpack.deleteUser();
    const expected_result = {
      username: 'wazuh_system',
      roles: ['kibana_system', 'wazuh'],
      full_name: 'wazuh',
      email: '',
      metadata: {},
      enabled: true,
    };
    expect(createUser).toEqual(expected_result);
    expect(editUser).toEqual(expected_result);
    expect(deleteUser).toEqual(expected_result);
    expect(users).toEqual(expected_result);
  });
});
