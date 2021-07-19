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
describe('Wazuh Internal Users', () => {
  it('Should return the X-Pack internal users', async () => {
    const users = await WzSecurityXpack.getUsers();
    const expected_result = {
      username: 'wazuh_system',
      roles: ['kibana_system', 'wazuh'],
      full_name: 'wazuh',
      email: '',
      metadata: {},
      enabled: true,
    };
    expect(users).toEqual(expected_result);
  });
});

describe('Wazuh Internal Users', () => {
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
});
describe('Wazuh Internal Users', () => {
  it('Should create,edit and delete a X-Pack user', async () => {
    const createUser = await WzSecurityXpack.createUser();
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
  });
});
