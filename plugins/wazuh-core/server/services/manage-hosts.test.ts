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

// Mock logger
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  get: jest.fn(() => mockLogger),
};

// Mock configuration service
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

// Mock ServerAPIClient
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
      // Arrange: Mock hosts with a new ID that won't be in the cache
      const mockHosts = [
        {
          id: 'new-host-id',
          url: 'https://localhost',
          port: 55000,
          username: 'wazuh-wui',
          password: 'wazuh-wui',
          run_as: false,
        },
      ];

      mockConfiguration.get.mockResolvedValue(mockHosts);

      // Mock serverAPIClient to prevent actual API calls
      manageHosts.setServerAPIClient(mockServerAPIClient as any);
      mockServerAPIClient.asInternalUser.request
        .mockResolvedValueOnce({
          status: 200,
          data: { data: { affected_items: [{ manager: 'test' }] } },
        }) // agents call
        .mockResolvedValueOnce({
          status: 200,
          data: { data: { affected_items: [{ allow_run_as: false }] } },
        }) // security/users/me
        .mockResolvedValueOnce({
          status: 200,
          data: { data: { enabled: 'no' } },
        }); // cluster/status

      // Act: Call getEntries
      const result = await manageHosts.getEntries({ excludePassword: true });

      // Assert: Should return hosts with cluster_info object (not undefined)
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('cluster_info');
      expect(result[0].cluster_info).toBeDefined();
      expect(typeof result[0].cluster_info).toBe('object');
      expect(result[0].cluster_info).not.toBeNull();
      expect(result[0].id).toBe('new-host-id');

      // Most importantly: should not be undefined (this was the original bug)
      expect(result[0].cluster_info).not.toBeUndefined();
    });

    it('should return existing cluster_info when host ID exists in registry cache', async () => {
      // Arrange: Mock hosts and simulate cached registry data
      const mockHosts = [
        {
          id: 'existing-host',
          url: 'https://localhost',
          port: 55000,
          username: 'wazuh-wui',
          password: 'wazuh-wui',
          run_as: false,
        },
      ];

      const mockRegistryData = {
        manager: 'test-manager',
        node: 'test-node',
        status: 'enabled',
        cluster: 'test-cluster',
        allow_run_as: 1,
      };

      mockConfiguration.get.mockResolvedValue(mockHosts);

      // Simulate cached registry data
      (manageHosts as any).cacheRegistry.set('existing-host', mockRegistryData);

      // Act: Call getEntries
      const result = await manageHosts.getEntries({ excludePassword: true });

      // Assert: Should return hosts with correct cluster_info
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('cluster_info');
      expect(result[0].cluster_info).toEqual(mockRegistryData);
      expect(result[0].id).toBe('existing-host');
    });

    it('should not throw TypeError when host ID changes and cache is stale (Issue #7611)', async () => {
      // Arrange: Simulate the exact scenario from issue #7611
      // 1. Cache has data for 'default' but not for 'default2'
      const mockRegistryData = {
        manager: 'test-manager',
        node: 'test-node',
        status: 'enabled',
        cluster: 'test-cluster',
        allow_run_as: 1,
      };

      (manageHosts as any).cacheRegistry.set('default', mockRegistryData);

      // 2. Configuration now returns host with changed ID 'default2'
      const changedHost = {
        id: 'default2',
        url: 'https://localhost',
        port: 55000,
        username: 'wazuh-wui',
        password: 'wazuh-wui',
        run_as: false,
      };

      mockConfiguration.get.mockResolvedValue([changedHost]);

      // Mock serverAPIClient for dynamic cache update
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

      // Act: This should NOT throw TypeError
      const result = await manageHosts.getEntries({ excludePassword: true });

      // Assert: Should handle missing cache gracefully
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('cluster_info');
      expect(result[0].cluster_info).toBeDefined();
      expect(result[0].cluster_info).not.toBeUndefined(); // Key fix!
      expect(result[0].id).toBe('default2');

      // Verify frontend wouldn't crash: cluster_info.uuid access should be safe
      expect(() => {
        const uuid = result[0].cluster_info.uuid; // This would throw before fix
      }).not.toThrow();
    });
  });
});
