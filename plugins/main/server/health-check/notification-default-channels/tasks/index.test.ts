import { initializeDefaultNotificationChannel } from './index';
import { defaultChannels } from '../common/constants';

// Mock the client
const mockClient = {
  callAsInternalUser: jest.fn(),
};

// Mock context with logger
const mockContext = () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
});

describe('initializeDefaultNotificationChannel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Task creation', () => {
    it('should return a task with correct name and structure', () => {
      const task = initializeDefaultNotificationChannel(mockClient as any);

      expect(task).toHaveProperty('name');
      expect(task.name).toBe(
        'integrations:default-notifications-channels-and-alerting-monitors',
      );
      expect(task).toHaveProperty('run');
      expect(typeof task.run).toBe('function');
    });
  });

  describe('Successful scenarios', () => {
    it('should report success when all default channels already exist', async () => {
      const ctx = mockContext();

      const existingConfigs = defaultChannels.map(channel => ({
        config_id: channel.id,
        name: channel.name,
        config_type: channel.type,
      }));

      mockClient.callAsInternalUser.mockResolvedValue({
        config_list: existingConfigs,
      });

      const task = initializeDefaultNotificationChannel(mockClient as any);
      await task.run(ctx);

      expect(mockClient.callAsInternalUser).toHaveBeenCalledWith(
        'notifications.getConfigs',
      );
      // Only the verification call — no channel creation happens here anymore
      expect(mockClient.callAsInternalUser).toHaveBeenCalledTimes(1);
      expect(ctx.logger.info).toHaveBeenCalledWith(
        'Starting verification of default notification channels',
      );
      expect(ctx.logger.info).toHaveBeenCalledWith(
        'All default notification channels are present and verified',
      );
    });

    it('should warn when some default channels are missing', async () => {
      const ctx = mockContext();

      // Only Slack exists
      const partialConfigs = [
        {
          config_id: 'default_slack_channel',
          name: 'Slack Channel',
          config_type: 'slack',
        },
      ];

      mockClient.callAsInternalUser.mockResolvedValue({
        config_list: partialConfigs,
      });

      const task = initializeDefaultNotificationChannel(mockClient as any);
      await task.run(ctx);

      expect(mockClient.callAsInternalUser).toHaveBeenCalledTimes(1);
      expect(ctx.logger.debug).toHaveBeenCalledWith(
        'Existing channels: Slack Channel',
      );
      expect(ctx.logger.warn).toHaveBeenCalledWith(
        '3 default notification channels are missing',
      );
    });

    it('should log a message when no default channels exist', async () => {
      const ctx = mockContext();

      mockClient.callAsInternalUser.mockResolvedValue({ config_list: [] });

      const task = initializeDefaultNotificationChannel(mockClient as any);
      await task.run(ctx);

      expect(ctx.logger.info).toHaveBeenCalledWith(
        'No existing Wazuh default notification channels found',
      );
      expect(ctx.logger.warn).toHaveBeenCalledWith(
        '4 default notification channels are missing',
      );
    });
  });

  describe('Error scenarios', () => {
    it('should handle notifications plugin not available', async () => {
      const ctx = mockContext();

      mockClient.callAsInternalUser.mockResolvedValue({
        // No config_list property
      });

      const task = initializeDefaultNotificationChannel(mockClient as any);

      await expect(task.run(ctx)).rejects.toThrow(
        'Error verifying default notification channels: Notifications plugin is not available or no config endpoint found',
      );

      expect(ctx.logger.error).toHaveBeenCalledWith(
        'Notifications plugin is not available or no config endpoint found',
      );
    });

    it('should handle API error when getting configs', async () => {
      const ctx = mockContext();
      const apiError = new Error('API connection failed');
      mockClient.callAsInternalUser.mockRejectedValue(apiError);

      const task = initializeDefaultNotificationChannel(mockClient as any);

      await expect(task.run(ctx)).rejects.toThrow(
        'Error verifying default notification channels: API connection failed',
      );

      expect(ctx.logger.error).toHaveBeenCalledWith(
        'Error verifying default notification channels: API connection failed',
      );
    });
  });
});
