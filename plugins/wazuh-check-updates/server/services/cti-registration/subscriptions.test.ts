/**
 * @jest-environment node
 */

import { getStatusSubscriptionIndexer } from './subscriptions';
import {
  getWazuhCheckUpdatesServices,
  getWazuhCore,
} from '../../plugin-services';

// Mock the plugin services
jest.mock('../../plugin-services');

const mockGetWazuhCheckUpdatesServices =
  getWazuhCheckUpdatesServices as jest.MockedFunction<
    typeof getWazuhCheckUpdatesServices
  >;
const mockGetWazuhCore = getWazuhCore as jest.MockedFunction<
  typeof getWazuhCore
>;

describe('getStatusSubscriptionIndexer', () => {
  let mockLogger: any;
  let mockWazuhApiClient: any;
  let mockUtils: any;
  let mockRequest: any;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock logger
    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
    };

    // Mock utils
    mockUtils = {
      getAPIHostIDFromCookie: jest.fn(),
    };

    // Mock API client
    mockWazuhApiClient = {
      client: {
        asInternalUser: {
          request: jest.fn(),
        },
      },
    };

    // Mock request object
    mockRequest = {
      headers: {
        cookie: 'wz-api=test-cookie',
      },
    };

    // Setup service mocks
    mockGetWazuhCheckUpdatesServices.mockReturnValue({
      logger: mockLogger,
    });

    mockGetWazuhCore.mockReturnValue({
      utils: mockUtils,
      api: mockWazuhApiClient,
    });

    // Default mock for getAPIHostIDFromCookie
    mockUtils.getAPIHostIDFromCookie.mockReturnValue('test-api-host-id');
  });

  describe('successful scenarios', () => {
    it('should return API info when everything works correctly', async () => {
      // Mock cluster nodes response
      const mockClusterNodesData = {
        data: {
          affected_items: [
            { name: 'master-1', type: 'master' },
            { name: 'worker-1', type: 'worker' },
            { name: 'worker-2', type: 'worker' },
          ],
        },
      };

      // Mock API info response
      const mockApiInfoData = {
        data: {
          cluster_name: 'wazuh-cluster',
          version: '5.0.0',
          node_name: 'master-1',
        },
      };

      // Setup API client mocks
      mockWazuhApiClient.client.asInternalUser.request
        .mockResolvedValueOnce({ data: mockClusterNodesData })
        .mockResolvedValueOnce({ data: mockApiInfoData });

      const result = await getStatusSubscriptionIndexer(mockRequest);

      expect(result).toEqual(mockApiInfoData);
      expect(mockUtils.getAPIHostIDFromCookie).toHaveBeenCalledWith(
        'wz-api=test-cookie',
        'wz-api',
      );
      expect(
        mockWazuhApiClient.client.asInternalUser.request,
      ).toHaveBeenCalledTimes(2);
      expect(
        mockWazuhApiClient.client.asInternalUser.request,
      ).toHaveBeenNthCalledWith(
        1,
        'GET',
        '/cluster/nodes',
        {},
        { apiHostID: 'test-api-host-id' },
      );
      expect(
        mockWazuhApiClient.client.asInternalUser.request,
      ).toHaveBeenNthCalledWith(
        2,
        'GET',
        '/cluster/master-1/info',
        {},
        { apiHostID: 'test-api-host-id' },
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        '[INFO]: API info retrieved successfully',
        mockApiInfoData,
      );
    });
  });

  describe('cookie handling', () => {
    it('should extract API host ID from cookies correctly', async () => {
      const mockClusterNodesData = {
        data: {
          affected_items: [{ name: 'master-1', type: 'master' }],
        },
      };

      const mockApiInfoData = {
        data: {
          cluster_name: 'wazuh-cluster',
        },
      };

      mockWazuhApiClient.client.asInternalUser.request
        .mockResolvedValueOnce({ data: mockClusterNodesData })
        .mockResolvedValueOnce({ data: mockApiInfoData });

      await getStatusSubscriptionIndexer(mockRequest);

      expect(mockUtils.getAPIHostIDFromCookie).toHaveBeenCalledWith(
        'wz-api=test-cookie',
        'wz-api',
      );
    });

    it('should throw an error if API host ID is not found', async () => {
      mockUtils.getAPIHostIDFromCookie.mockReturnValueOnce(undefined);

      await expect(getStatusSubscriptionIndexer(mockRequest)).rejects.toThrow(
        'API host ID not found',
      );
    });
  });
});
