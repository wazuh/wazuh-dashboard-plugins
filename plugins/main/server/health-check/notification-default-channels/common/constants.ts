const OPENSEARCH_API_BASE_PATH = '/_plugins/_notifications';
export const OPENSEARCH_API = Object.freeze({
  CONFIGS: `${OPENSEARCH_API_BASE_PATH}/configs`,
});

export type ChannelType = 'slack' | 'webhook';

export interface ChannelDefinition {
  id: string;
  name: string;
  type: ChannelType;
}

const DEFAULT_CHANNELS_ID = {
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
