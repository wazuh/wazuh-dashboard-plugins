import { initializeClientNotificationConfigs } from './notification-plugin';

// Mock Client constructor
const MockClient = jest.fn();
MockClient.prototype = {};

describe('InitializeClientNotificationConfigs', () => {
  let mockComponents: any;
  let mockConfig: any;

  beforeEach(() => {
    jest.clearAllMocks();
    MockClient.prototype = {}; // Reset prototype

    // Mock components with clientAction
    mockComponents = {
      clientAction: {
        factory: jest.fn(() => jest.fn()),
        namespaceFactory: jest.fn(() => {
          const namespace = jest.fn();
          namespace.prototype = {};
          return namespace;
        }),
      },
    };

    mockConfig = {};
  });

  describe('Plugin registration', () => {
    it('should register notifications namespace and methods', () => {
      // Call the plugin function to register methods
      initializeClientNotificationConfigs(
        MockClient,
        mockConfig,
        mockComponents,
      );

      // Verify that the plugin registered the namespace
      expect(mockComponents.clientAction.namespaceFactory).toHaveBeenCalled();

      // Verify that clientAction.factory was called for each method
      expect(mockComponents.clientAction.factory).toHaveBeenCalledTimes(2); // getConfigs and createConfig

      // Verify the methods are added to the prototype
      expect(MockClient.prototype.notifications).toBeDefined();
    });

    it('should configure getConfigs method correctly', () => {
      initializeClientNotificationConfigs(
        MockClient,
        mockConfig,
        mockComponents,
      );

      // Verify getConfigs was configured with correct parameters
      expect(mockComponents.clientAction.factory).toHaveBeenCalledWith({
        url: {
          fmt: '/_plugins/_notifications/configs',
        },
        method: 'GET',
      });
    });

    it('should configure createConfig method correctly', () => {
      initializeClientNotificationConfigs(
        MockClient,
        mockConfig,
        mockComponents,
      );

      // Verify createConfig was configured with correct parameters
      expect(mockComponents.clientAction.factory).toHaveBeenCalledWith({
        url: {
          fmt: '/_plugins/_notifications/configs',
        },
        method: 'POST',
        needBody: true,
      });
    });

    it('should register both methods on notifications prototype', () => {
      const mockGetConfigs = jest.fn();
      const mockCreateConfig = jest.fn();
      const mockFactory = jest
        .fn()
        .mockReturnValueOnce(mockGetConfigs)
        .mockReturnValueOnce(mockCreateConfig);

      const mockNamespace = jest.fn();
      mockNamespace.prototype = {};
      const mockNamespaceFactory = jest.fn(() => mockNamespace);

      const components = {
        clientAction: {
          factory: mockFactory,
          namespaceFactory: mockNamespaceFactory,
        },
      };

      initializeClientNotificationConfigs(MockClient, mockConfig, components);

      // Verify both methods are assigned
      const notificationsProto = MockClient.prototype.notifications.prototype;
      expect(notificationsProto.getConfigs).toBe(mockGetConfigs);
      expect(notificationsProto.createConfig).toBe(mockCreateConfig);
    });
  });

  describe('API endpoint configuration', () => {
    it('should use correct OpenSearch API path for both methods', () => {
      initializeClientNotificationConfigs(
        MockClient,
        mockConfig,
        mockComponents,
      );

      // Both methods should use the same API endpoint
      const expectedUrl = { fmt: '/_plugins/_notifications/configs' };

      expect(mockComponents.clientAction.factory).toHaveBeenCalledWith({
        url: expectedUrl,
        method: 'GET',
      });

      expect(mockComponents.clientAction.factory).toHaveBeenCalledWith({
        url: expectedUrl,
        method: 'POST',
        needBody: true,
      });
    });

    it('should set needBody for POST method only', () => {
      initializeClientNotificationConfigs(
        MockClient,
        mockConfig,
        mockComponents,
      );

      // Verify GET method doesn't have needBody
      expect(mockComponents.clientAction.factory).toHaveBeenCalledWith({
        url: { fmt: '/_plugins/_notifications/configs' },
        method: 'GET',
      });

      // Verify POST method has needBody
      expect(mockComponents.clientAction.factory).toHaveBeenCalledWith({
        url: { fmt: '/_plugins/_notifications/configs' },
        method: 'POST',
        needBody: true,
      });
    });
  });
});
