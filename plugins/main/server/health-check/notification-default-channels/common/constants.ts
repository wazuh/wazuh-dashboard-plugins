const OPENSEARCH_API_BASE_PATH = '/_plugins/_notifications';
export const OPENSEARCH_API = Object.freeze({
  CONFIGS: `${OPENSEARCH_API_BASE_PATH}/configs`,
  EVENTS: `${OPENSEARCH_API_BASE_PATH}/events`,
  TEST_MESSAGE: `${OPENSEARCH_API_BASE_PATH}/feature/test`,
  FEATURES: `${OPENSEARCH_API_BASE_PATH}/features`,
});

export type ChannelType = 'slack' | 'webhook';

export interface ChannelDefinition {
  id: string;
  name: string;
  type: ChannelType;
}

interface ChannelConfig {
  name: string;
  description: string;
  config_type: ChannelType;
  is_enabled: boolean;
  slack?: object;
  webhook?: object;
}

export const DEFAULT_CHANNELS_ID = {
  SLACK: 'default_slack_channel',
  JIRA: 'default_jira_channel',
  PAGERDUTY: 'default_pagerduty_channel',
  SHUFFLE: 'default_shuffle_channel',
};

export const defaultChannels: ChannelDefinition[] = [
  { id: DEFAULT_CHANNELS_ID.SLACK, name: 'Slack Channel', type: 'slack' },
  { id: DEFAULT_CHANNELS_ID.JIRA, name: 'Jira Channel', type: 'webhook' },
  {
    id: DEFAULT_CHANNELS_ID.PAGERDUTY,
    name: 'PagerDuty Channel',
    type: 'webhook',
  },
  { id: DEFAULT_CHANNELS_ID.SHUFFLE, name: 'Shuffle Channel', type: 'webhook' },
];

export const defaultChannelConfigs: Record<string, ChannelConfig> = {
  'Slack Channel': {
    name: 'Slack Channel',
    description:
      'Default Slack notification channel. A sample monitor is created automatically. Go to Alerting > Monitors to review it and configure this channel before enabling alerts.',
    config_type: 'slack',
    is_enabled: false,
    slack: {
      url: 'https://hooks.slack.com/services/YOUR_WORKSPACE_ID/YOUR_CHANNEL_ID/YOUR_WEBHOOK_TOKEN',
    },
  },
  'PagerDuty Channel': {
    name: 'PagerDuty Channel',
    description: `Default PagerDuty notification channel.

    Configure a PagerDuty integration and set its Integration Key in the 'X-Routing-Key' header below. A sample monitor is created automatically — go to Alerting > Monitors to review it and enable the action once this channel is configured.`,
    config_type: 'webhook',
    is_enabled: false,
    webhook: {
      url: 'https://events.pagerduty.com/v2/enqueue',
      method: 'POST',
      header_params: {
        'Content-Type': 'application/json',
        'X-Routing-Key': 'YOUR_PAGERDUTY_API_KEY',
      },
    },
  },
  'Jira Channel': {
    name: 'Jira Channel',
    description: `Default Jira notification channel.

    Configure your Jira domain and authentication (use a Base64-encoded 'email:api_token' in the Authorization header). A sample monitor is created automatically — go to Alerting > Monitors to review it and enable the action once this channel is configured.`,
    config_type: 'webhook',
    is_enabled: false,
    webhook: {
      url: 'https://your-domain.atlassian.net/rest/api/3/issue',
      method: 'POST',
      header_params: {
        'Content-Type': 'application/json',
        Authorization: 'Basic base64(email:api_token)',
      },
    },
  },
  'Shuffle Channel': {
    name: 'Shuffle Channel',
    description:
      'Default Shuffle notification channel. A sample monitor is created automatically. Go to Alerting > Monitors to review it and configure this channel before enabling workflows.',
    config_type: 'webhook',
    is_enabled: false,
    webhook: {
      url: 'https://shuffler.io/api/v1/hooks/WEBHOOK_ID',
      method: 'POST',
      header_params: {
        'Content-Type': 'application/json',
      },
    },
  },
};
