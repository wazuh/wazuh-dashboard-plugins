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
    it('should register notifications namespace and the getConfigs method', () => {
      initializeClientNotificationConfigs(
        MockClient,
        mockConfig,
        mockComponents,
      );

      expect(mockComponents.clientAction.namespaceFactory).toHaveBeenCalled();
      expect(mockComponents.clientAction.factory).toHaveBeenCalledTimes(1);
      expect(MockClient.prototype.notifications).toBeDefined();
    });

    it('should configure getConfigs with the correct API path and method', () => {
      initializeClientNotificationConfigs(
        MockClient,
        mockConfig,
        mockComponents,
      );

      expect(mockComponents.clientAction.factory).toHaveBeenCalledWith({
        url: {
          fmt: '/_plugins/_notifications/configs',
        },
        method: 'GET',
      });
    });

    it('should expose getConfigs on the notifications prototype', () => {
      const mockGetConfigs = jest.fn();
      const mockFactory = jest.fn().mockReturnValueOnce(mockGetConfigs);

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

      const notificationsProto = MockClient.prototype.notifications.prototype;
      expect(notificationsProto.getConfigs).toBe(mockGetConfigs);
    });
  });
});
