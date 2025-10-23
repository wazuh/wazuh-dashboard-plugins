import { initializeDefaultNotificationChannel } from './index';
import { defaultChannels, defaultChannelConfigs } from '../common/constants';

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
      expect(task.name).toBe('notification-channel:verify-default-channels');
      expect(task).toHaveProperty('run');
      expect(typeof task.run).toBe('function');
    });
  });

  describe('Successful scenarios', () => {
    it('should handle case when all channels already exist', async () => {
      const ctx = mockContext();

      // Mock API response with all channels existing
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
      expect(mockClient.callAsInternalUser).toHaveBeenCalledTimes(1); // Only getConfigs, no creation
      expect(ctx.logger.info).toHaveBeenCalledWith(
        'Starting verification of default notification channels',
      );
      expect(ctx.logger.info).toHaveBeenCalledWith(
        'All default notification channels are now present and verified',
      );
    });

    it('should handle case when no channels exist and create all', async () => {
      const ctx = mockContext();

      // Mock empty config list and successful creations
      mockClient.callAsInternalUser
        .mockResolvedValueOnce({ config_list: [] }) // getConfigs call
        .mockResolvedValueOnce({ config_id: 'default_slack_channel' }) // createConfig calls
        .mockResolvedValueOnce({ config_id: 'default_jira_channel' })
        .mockResolvedValueOnce({ config_id: 'default_pagerduty_channel' })
        .mockResolvedValueOnce({ config_id: 'default_shuffle_channel' });

      const task = initializeDefaultNotificationChannel(mockClient as any);
      await task.run(ctx);

      expect(mockClient.callAsInternalUser).toHaveBeenCalledWith(
        'notifications.getConfigs',
      );

      // Should create 4 channels
      expect(mockClient.callAsInternalUser).toHaveBeenCalledTimes(5); // 1 get + 4 creates

      // Verify creation calls with correct payloads
      defaultChannels.forEach(channel => {
        expect(mockClient.callAsInternalUser).toHaveBeenCalledWith(
          'notifications.createConfig',
          {
            body: {
              config_id: channel.id,
              config: defaultChannelConfigs[channel.name],
            },
          },
        );
      });

      expect(ctx.logger.info).toHaveBeenCalledWith(
        'All default notification channels are now present and verified',
      );
    });
    it('should handle mixed scenario - some channels exist, create missing ones', async () => {
      const ctx = mockContext();

      // Mock partial existing configs (only Slack exists)
      const partialConfigs = [
        {
          config_id: 'default_slack_channel',
          name: 'Slack Channel',
          config_type: 'slack',
        },
      ];

      mockClient.callAsInternalUser
        .mockResolvedValueOnce({ config_list: partialConfigs })
        .mockResolvedValueOnce({ config_id: 'default_jira_channel' })
        .mockResolvedValueOnce({ config_id: 'default_pagerduty_channel' })
        .mockResolvedValueOnce({ config_id: 'default_shuffle_channel' });

      const task = initializeDefaultNotificationChannel(mockClient as any);
      await task.run(ctx);

      // Should create 3 missing channels
      expect(mockClient.callAsInternalUser).toHaveBeenCalledTimes(4); // 1 get + 3 creates

      expect(ctx.logger.debug).toHaveBeenCalledWith(
        'Existing channels: Slack Channel',
      );
      expect(ctx.logger.info).toHaveBeenCalledWith(
        'All default notification channels are now present and verified',
      );
    });
  });

  describe('Error scenarios', () => {
    it('should handle notifications plugin not available', async () => {
      const ctx = mockContext();

      mockClient.callAsInternalUser.mockResolvedValue({
        // No config_list or configs property
      });

      const task = initializeDefaultNotificationChannel(mockClient as any);

      await expect(task.run(ctx)).rejects.toThrow(
        'Error verifying or creating default notification channels: Notifications plugin is not available or no config endpoint found',
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
        'Error verifying or creating default notification channels: API connection failed',
      );

      expect(ctx.logger.error).toHaveBeenCalledWith(
        'Error verifying or creating default notification channels: API connection failed',
      );
    });

    it('should handle individual channel creation failures gracefully', async () => {
      const ctx = mockContext();

      mockClient.callAsInternalUser
        .mockResolvedValueOnce({ config_list: [] }) // getConfigs
        .mockRejectedValueOnce(new Error('Slack creation failed')) // Slack fails
        .mockResolvedValueOnce({ config_id: 'default_jira_channel' }) // Jira succeeds
        .mockResolvedValueOnce({ config_id: 'default_pagerduty_channel' }) // PagerDuty succeeds
        .mockResolvedValueOnce({ config_id: 'default_shuffle_channel' }); // Shuffle succeeds

      const task = initializeDefaultNotificationChannel(mockClient as any);
      await task.run(ctx);

      expect(ctx.logger.error).toHaveBeenCalledWith(
        'Failed to create notification channel Slack Channel: Slack creation failed',
      );

      // Should still report partial success
      expect(ctx.logger.warn).toHaveBeenCalledWith(
        '1 notification channels are still missing after creation attempts',
      );
    });

    it('should handle unexpected creation result format', async () => {
      const ctx = mockContext();

      mockClient.callAsInternalUser
        .mockResolvedValueOnce({ config_list: [] })
        .mockResolvedValueOnce({ unexpected_field: 'unexpected_value' }); // Unexpected response

      const task = initializeDefaultNotificationChannel(mockClient as any);
      await task.run(ctx);

      expect(ctx.logger.warn).toHaveBeenCalledWith(
        'Channel creation returned unexpected result for Slack Channel:',
        { unexpected_field: 'unexpected_value' },
      );
    });
  });

  describe('Edge cases', () => {
    it('should handle empty config_list array', async () => {
      const ctx = mockContext();

      mockClient.callAsInternalUser
        .mockResolvedValueOnce({ config_list: [] })
        .mockResolvedValueOnce({ config_id: 'default_slack_channel' })
        .mockResolvedValueOnce({ config_id: 'default_jira_channel' })
        .mockResolvedValueOnce({ config_id: 'default_pagerduty_channel' })
        .mockResolvedValueOnce({ config_id: 'default_shuffle_channel' });

      const task = initializeDefaultNotificationChannel(mockClient as any);
      await task.run(ctx);

      expect(ctx.logger.info).toHaveBeenCalledWith(
        'No existing Wazuh default notification channels found',
      );
      expect(ctx.logger.info).toHaveBeenCalledWith(
        'All default notification channels are now present and verified',
      );
    });

    it('should handle creation response with id instead of config_id', async () => {
      const ctx = mockContext();

      mockClient.callAsInternalUser
        .mockResolvedValueOnce({ config_list: [] })
        .mockResolvedValueOnce({ id: 'default_slack_channel' }); // Response with 'id' field

      const task = initializeDefaultNotificationChannel(mockClient as any);
      await task.run(ctx);

      // Should accept 'id' field as valid response
      expect(ctx.logger.info).toHaveBeenCalledWith(
        'Created 1 notification channels: Slack Channel',
      );
    });
  });
});
