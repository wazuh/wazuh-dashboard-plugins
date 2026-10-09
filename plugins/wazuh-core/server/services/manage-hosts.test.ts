/*
 * Wazuh app - ManageHosts service tests
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { ManageHosts } from './manage-hosts';
import { IConfiguration } from '../../common/services/configuration';
import { API_USER_STATUS_RUN_AS } from '../../common/api-user-status-run-as';
import { ServerAPIClient } from './server-api-client';

const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  get: jest.fn(() => mockLogger),
};

const mockConfiguration: jest.Mocked<IConfiguration> = {
  get: jest.fn(),
  set: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  setStore: jest.fn(),
  setup: jest.fn(),
  register: jest.fn(),
  clear: jest.fn(),
};

const mockServerAPIClient = {
  asInternalUser: {
    request: jest.fn(),
  },
  asScoped: jest.fn(),
};

describe('ManageHosts Service', () => {
  let manageHosts: ManageHosts;

  beforeEach(() => {
    jest.clearAllMocks();
    manageHosts = new ManageHosts(mockLogger as any, mockConfiguration);
  });

  describe('getEntries - Regression Tests', () => {
    it('should handle missing cluster_info gracefully when host ID is not in registry cache', async () => {
      const mockHosts = {
        'new-host-id': {
          url: 'https://localhost',
          port: 55000,
          username: 'wazuh-internal-client',
          password: 'wazuh-internal-client',
          run_as: false,
        },
      };

      mockConfiguration.get.mockResolvedValue(mockHosts);

      manageHosts.setServerAPIClient(mockServerAPIClient as any);
      mockServerAPIClient.asInternalUser.request
        .mockResolvedValueOnce({
          status: 200,
          data: { data: { affected_items: [{ manager: 'test' }] } },
        })
        .mockResolvedValueOnce({
          status: 200,
          data: { data: { affected_items: [{ allow_run_as: false }] } },
        })
        .mockResolvedValueOnce({
          status: 200,
          data: { data: { enabled: 'no' } },
        });

      const result = await manageHosts.getEntries({ excludePassword: true });

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('cluster_info');
      expect(result[0].cluster_info).toBeDefined();
      expect(typeof result[0].cluster_info).toBe('object');
      expect(result[0].cluster_info).not.toBeNull();
      expect(result[0].id).toBe('new-host-id');

      expect(result[0].cluster_info).not.toBeUndefined();
    });

    it('should return existing cluster_info when host ID exists in registry cache', async () => {
      const mockHosts = {
        'existing-host': {
          url: 'https://localhost',
          port: 55000,
          username: 'wazuh-internal-client',
          password: 'wazuh-internal-client',
          run_as: false,
        },
      };

      const mockRegistryData = {
        manager: 'test-manager',
        node: 'test-node',
        cluster: 'test-cluster',
        allow_run_as: 1,
        verify_ca: null,
      };

      mockConfiguration.get.mockResolvedValue(mockHosts);

      (manageHosts as any).cacheRegistry.set('existing-host', mockRegistryData);

      const result = await manageHosts.getEntries({ excludePassword: true });

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('cluster_info');
      expect(result[0].cluster_info).toEqual({
        manager: 'test-manager',
        node: 'test-node',
        cluster: 'test-cluster',
      });

      expect(result[0].allow_run_as).toBe(1);
      expect(result[0].verify_ca).toBe(null);
      expect(result[0].id).toBe('existing-host');
    });

    it('should not throw TypeError when host ID changes and cache is stale (Issue #7611)', async () => {
      const mockRegistryData = {
        manager: 'test-manager',
        node: 'test-node',
        cluster: 'test-cluster',
        allow_run_as: 1,
        verify_ca: null,
      };

      (manageHosts as any).cacheRegistry.set('default', mockRegistryData);

      const mockHosts = {
        default2: {
          url: 'https://localhost',
          port: 55000,
          username: 'wazuh-internal-client',
          password: 'wazuh-internal-client',
          run_as: false,
        },
      };

      mockConfiguration.get.mockResolvedValue(mockHosts);

      manageHosts.setServerAPIClient(mockServerAPIClient as any);
      mockServerAPIClient.asInternalUser.request
        .mockResolvedValueOnce({
          status: 200,
          data: { data: { affected_items: [{ manager: 'test' }] } },
        })
        .mockResolvedValueOnce({
          status: 200,
          data: { data: { affected_items: [{ allow_run_as: false }] } },
        })
        .mockResolvedValueOnce({
          status: 200,
          data: { data: { enabled: 'no' } },
        });

      const result = await manageHosts.getEntries({ excludePassword: true });

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('cluster_info');
      expect(result[0].cluster_info).toBeDefined();
      expect(result[0].cluster_info).not.toBeUndefined();
      expect(result[0].id).toBe('default2');
    });
  });

  /* eslint-disable camelcase -- Wazuh Server API field names */
  describe('rate limited registry data (Issue #9333)', () => {
    const HOST_ID = 'default';
    const USERS_ME = {
      status: 200,
      data: { data: { affected_items: [{ allow_run_as: true }] } },
    };
    const CLUSTER_LOCAL_INFO = {
      status: 200,
      data: {
        data: { affected_items: [{ node: 'node01', cluster: 'wazuh' }] },
      },
    };
    const rateLimitError = () =>
      Object.assign(
        new Error(
          `The server API [${HOST_ID}] is rate limiting the requests of the dashboard (status code 429)`,
        ),
        { response: { status: 429 } },
      );
    const answerRequests = (usersMe: () => Promise<unknown>) =>
      mockServerAPIClient.asInternalUser.request.mockImplementation(
        (_method: string, path: string) =>
          path === '/security/users/me'
            ? usersMe()
            : Promise.resolve(CLUSTER_LOCAL_INFO),
      );
    const usersMeCalls = () =>
      mockServerAPIClient.asInternalUser.request.mock.calls.filter(
        ([, path]) => path === '/security/users/me',
      ).length;

    beforeEach(() => {
      mockServerAPIClient.asInternalUser.request.mockReset();
      mockConfiguration.get.mockResolvedValue({
        [HOST_ID]: {
          url: 'https://localhost',
          port: 55000,
          username: 'wazuh-internal-client',
          password: 'secret-password',
          run_as: true,
        },
      });
      manageHosts.setServerAPIClient(
        mockServerAPIClient as unknown as ServerAPIClient,
      );
    });

    it('refreshes the entry that could not check run_as on the next call', async () => {
      answerRequests(() => Promise.reject(rateLimitError()));

      const [rateLimitedEntry] = await manageHosts.getEntries();

      expect(rateLimitedEntry.allow_run_as).toBe(
        API_USER_STATUS_RUN_AS.UNABLE_TO_CHECK,
      );
      expect(manageHosts.isRateLimited(HOST_ID)).toBe(true);

      answerRequests(() => Promise.resolve(USERS_ME));

      const [recoveredEntry] = await manageHosts.getEntries();

      expect(recoveredEntry.allow_run_as).toBe(API_USER_STATUS_RUN_AS.ENABLED);
      expect(manageHosts.isRateLimited(HOST_ID)).toBe(false);
      expect(manageHosts.isEnabledAuthWithRunAs(HOST_ID)).toBe(true);
    });

    it('does not request again the entry that checked run_as', async () => {
      answerRequests(() => Promise.resolve(USERS_ME));

      await manageHosts.getEntries();
      await manageHosts.getEntries();

      expect(usersMeCalls()).toBe(1);
    });

    it('does not request again the entry that failed for a reason other than the rate limit', async () => {
      answerRequests(() => Promise.reject(new Error('connect ECONNREFUSED')));

      await manageHosts.getEntries();

      expect(manageHosts.isRateLimited(HOST_ID)).toBe(false);

      await manageHosts.getEntries();

      expect(usersMeCalls()).toBe(1);
    });

    it('logs the cause of the failure without the credentials', async () => {
      answerRequests(() => Promise.reject(rateLimitError()));

      await manageHosts.getEntries();

      const warned = mockLogger.warn.mock.calls.flat().join('\n');

      expect(warned).toContain(
        `Could not get the registry data of the host [${HOST_ID}]`,
      );
      expect(warned).toContain('rate limiting the requests of the dashboard');
      expect(warned).not.toContain('secret-password');
    });

    it('does not expose the rate limit flag in the entries', async () => {
      answerRequests(() => Promise.reject(rateLimitError()));

      const [entry] = await manageHosts.getEntries({ excludePassword: true });

      expect(entry.cluster_info).toEqual({ node: null, cluster: null });
      expect(Object.keys(entry).sort()).toEqual([
        'allow_run_as',
        'cluster_info',
        'id',
        'port',
        'run_as',
        'url',
        'username',
        'verify_ca',
      ]);
    });

    it('reports a host without registry data as not rate limited', () => {
      expect(manageHosts.isRateLimited('unknown')).toBe(false);
    });
  });

  describe('getRegistryDataByHost', () => {
    const USERS_ME = {
      status: 200,
      data: { data: { affected_items: [{ allow_run_as: true }] } },
    };
    const CLUSTER_LOCAL_INFO = {
      status: 200,
      data: {
        data: { affected_items: [{ node: 'node01', cluster: 'wazuh' }] },
      },
    };

    const getRegistryDataByHost = (options: { throwError: boolean }) => {
      manageHosts.setServerAPIClient(
        mockServerAPIClient as unknown as ServerAPIClient,
      );

      return (
        manageHosts as unknown as {
          getRegistryDataByHost: (
            host: unknown,
            options: unknown,
          ) => Promise<unknown>;
        }
      ).getRegistryDataByHost({ id: 'default', run_as: true }, options);
    };

    beforeEach(() => mockServerAPIClient.asInternalUser.request.mockReset());

    it('requests the API user and the cluster info in parallel', async () => {
      const resolvers: Record<string, (value: unknown) => void> = {};
      mockServerAPIClient.asInternalUser.request.mockImplementation(
        (_method: string, path: string) =>
          new Promise(resolve => {
            resolvers[path] = resolve;
          }),
      );

      const registryData = getRegistryDataByHost({ throwError: true });

      expect(Object.keys(resolvers).sort()).toEqual([
        '/cluster/local/info',
        '/security/users/me',
      ]);

      resolvers['/security/users/me'](USERS_ME);
      resolvers['/cluster/local/info'](CLUSTER_LOCAL_INFO);

      await expect(registryData).resolves.toMatchObject({
        node: 'node01',
        cluster: 'wazuh',
        allow_run_as: API_USER_STATUS_RUN_AS.ENABLED,
      });
    });

    it('keeps allow_run_as when the cluster info request fails', async () => {
      mockServerAPIClient.asInternalUser.request.mockImplementation(
        (_method: string, path: string) =>
          path === '/security/users/me'
            ? Promise.resolve(USERS_ME)
            : Promise.reject(new Error('cluster not ready')),
      );

      await expect(
        getRegistryDataByHost({ throwError: false }),
      ).resolves.toMatchObject({
        node: null,
        cluster: null,
        allow_run_as: API_USER_STATUS_RUN_AS.ENABLED,
      });
    });

    it('throws the API user error when both requests fail', async () => {
      mockServerAPIClient.asInternalUser.request.mockImplementation(
        (_method: string, path: string) =>
          Promise.reject(new Error(`${path} failed`)),
      );

      await expect(getRegistryDataByHost({ throwError: true })).rejects.toThrow(
        '/security/users/me failed',
      );
    });
  });
  /* eslint-enable camelcase */

  describe('get', () => {
    it('does not log the host credentials', async () => {
      mockConfiguration.get.mockResolvedValue({
        default: {
          url: 'https://localhost',
          port: 55000,
          username: 'wazuh-internal-client',
          password: 'secret-password',
        },
      });

      await manageHosts.get('default', { excludePassword: true });

      const logged = mockLogger.debug.mock.calls.flat().join('\n');

      expect(logged).toContain(
        'API connections: [{"default":{"url":"https://localhost","port":55000,"username":"wazuh-internal-client"}}]',
      );
      expect(logged).not.toContain('secret-password');
    });
  });
});
