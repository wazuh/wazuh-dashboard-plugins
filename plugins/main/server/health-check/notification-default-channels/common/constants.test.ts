import { defaultChannels, defaultChannelConfigs, OPENSEARCH_API, ChannelDefinition } from './constants';

describe('Notification Default Channels Constants', () => {
  describe('OPENSEARCH_API', () => {
    it('should have correct API endpoints', () => {
      expect(OPENSEARCH_API.CONFIGS).toBe('/_plugins/_notifications/configs');
      expect(OPENSEARCH_API.EVENTS).toBe('/_plugins/_notifications/events');
      expect(OPENSEARCH_API.TEST_MESSAGE).toBe('/_plugins/_notifications/feature/test');
      expect(OPENSEARCH_API.FEATURES).toBe('/_plugins/_notifications/features');
    });
  });

  describe('defaultChannels', () => {
    it('should contain 4 default channels', () => {
      expect(defaultChannels).toHaveLength(4);
    });

    it('should have correct channel definitions', () => {
      const expectedChannels = [
        { id: 'default_slack_channel', name: 'Slack Channel', type: 'slack' },
        { id: 'default_jira_channel', name: 'Jira Channel', type: 'webhook' },
        { id: 'default_pagerduty_channel', name: 'PagerDuty Channel', type: 'webhook' },
        { id: 'default_shuffle_channel', name: 'Shuffle Channel', type: 'webhook' }
      ];

      expectedChannels.forEach((expected, index) => {
        expect(defaultChannels[index]).toEqual(expected);
      });
    });

    it('should have unique channel IDs', () => {
      const ids = defaultChannels.map(channel => channel.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have unique channel names', () => {
      const names = defaultChannels.map(channel => channel.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });
  });

  describe('defaultChannelConfigs', () => {
    it('should have configurations for all default channels', () => {
      defaultChannels.forEach(channel => {
        expect(defaultChannelConfigs[channel.name]).toBeDefined();
      });
    });

    it('should have correct Slack channel configuration', () => {
      const slackConfig = defaultChannelConfigs['Slack Channel'];

      expect(slackConfig.name).toBe('Slack Channel');
      expect(slackConfig.config_type).toBe('slack');
      expect(slackConfig.is_enabled).toBe(false);
      expect(slackConfig.description).toContain('Default Wazuh slack notification channel. To start receiving alerts, create a monitor, trigger and monitor action in the Alerting section, and edit this channel.');
      expect(slackConfig.slack).toBeDefined();
      expect(slackConfig.slack.url).toContain('hooks.slack.com');
    });

    it('should have correct PagerDuty channel configuration', () => {
      const pagerDutyConfig = defaultChannelConfigs['PagerDuty Channel'];

      expect(pagerDutyConfig.name).toBe('PagerDuty Channel');
      expect(pagerDutyConfig.config_type).toBe('webhook');
      expect(pagerDutyConfig.is_enabled).toBe(false);
      expect(pagerDutyConfig.description).toContain('PagerDuty');
      expect(pagerDutyConfig.webhook).toBeDefined();
      expect(pagerDutyConfig.webhook.url).toContain('events.pagerduty.com');
      expect(pagerDutyConfig.webhook.method).toBe('POST');
      expect(pagerDutyConfig.webhook.header_params).toHaveProperty('X-Routing-Key');
    });

    it('should have correct Jira channel configuration', () => {
      const jiraConfig = defaultChannelConfigs['Jira Channel'];

      expect(jiraConfig.name).toBe('Jira Channel');
      expect(jiraConfig.config_type).toBe('webhook');
      expect(jiraConfig.is_enabled).toBe(false);
      expect(jiraConfig.description).toContain('Jira');
      expect(jiraConfig.webhook).toBeDefined();
      expect(jiraConfig.webhook.url).toContain('atlassian.net');
      expect(jiraConfig.webhook.method).toBe('POST');
      expect(jiraConfig.webhook.header_params).toHaveProperty('Authorization');
    });

    it('should have correct Shuffle channel configuration', () => {
      const shuffleConfig = defaultChannelConfigs['Shuffle Channel'];

      expect(shuffleConfig.name).toBe('Shuffle Channel');
      expect(shuffleConfig.config_type).toBe('webhook');
      expect(shuffleConfig.is_enabled).toBe(false);
      expect(shuffleConfig.description).toContain('Shuffle');
      expect(shuffleConfig.webhook).toBeDefined();
      expect(shuffleConfig.webhook.url).toContain('shuffler.io');
      expect(shuffleConfig.webhook.method).toBe('POST');
    });

    it('should have all channels disabled by default for security', () => {
      Object.values(defaultChannelConfigs).forEach(config => {
        expect(config.is_enabled).toBe(false);
      });
    });

    it('should have proper content-type headers for webhook channels', () => {
      const webhookConfigs = ['PagerDuty Channel', 'Jira Channel', 'Shuffle Channel'];

      webhookConfigs.forEach(channelName => {
        const config = defaultChannelConfigs[channelName];
        expect(config.webhook.header_params['Content-Type']).toBe('application/json');
      });
    });
  });

  describe('Type definitions', () => {
    it('should properly type channel definitions', () => {
      defaultChannels.forEach((channel: ChannelDefinition) => {
        expect(typeof channel.id).toBe('string');
        expect(typeof channel.name).toBe('string');
        expect(['slack', 'webhook']).toContain(channel.type);
      });
    });
  });
});
