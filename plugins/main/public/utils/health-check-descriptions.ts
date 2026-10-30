import { i18n } from '@osd/i18n';
import type { CoreSetup } from 'opensearch-dashboards/public';
import {
  HEALTH_CHECK_TASK_CERTIFICATE_VALIDITY,
  HEALTH_CHECK_TASK_DASHBOARDS,
  HEALTH_CHECK_TASK_INDEX_PATTERNS,
  HEALTH_CHECK_TASK_NOTIFICATION_CHANNELS,
  HEALTH_CHECK_TASK_SERVER_API_CONNECTION,
  HEALTH_CHECK_TASK_SERVER_API_RUN_AS,
} from '../../common/constants';

type HealthCheckDescription = Parameters<
  CoreSetup['healthCheck']['describe']
>[1];

export const getHealthCheckDescriptions = (): Record<
  string,
  HealthCheckDescription
> => ({
  [HEALTH_CHECK_TASK_NOTIFICATION_CHANNELS]: {
    title: i18n.translate('wazuh.healthCheck.notificationChannels.title', {
      defaultMessage: 'Default notification channels',
    }),
    description: i18n.translate(
      'wazuh.healthCheck.notificationChannels.description',
      {
        defaultMessage:
          'Checks that the indexer has the default Slack, Jira, PagerDuty and Shuffle channels. Runs only when Notifications is installed.',
      },
    ),
    remediation: i18n.translate(
      'wazuh.healthCheck.notificationChannels.remediation',
      {
        defaultMessage:
          'The indexer creates these channels when it starts. Check that its notifications plugin is installed, then restart the indexer to create the missing ones.',
      },
    ),
  },
  [HEALTH_CHECK_TASK_DASHBOARDS]: {
    title: i18n.translate('wazuh.healthCheck.dashboards.title', {
      defaultMessage: 'Built-in dashboards',
    }),
    description: i18n.translate('wazuh.healthCheck.dashboards.description', {
      defaultMessage:
        'Creates the bundled dashboards and visualizations. At each dashboard start, it restores them to their shipped version.',
    }),
    remediation: i18n.translate('wazuh.healthCheck.dashboards.remediation', {
      defaultMessage:
        'Check that the indexer is reachable, and read the dashboard logs for the failing file. The next scheduled run creates the missing ones.',
    }),
  },
  [HEALTH_CHECK_TASK_INDEX_PATTERNS]: {
    title: i18n.translate('wazuh.healthCheck.indexPatterns.title', {
      defaultMessage: 'Index patterns',
    }),
    description: i18n.translate('wazuh.healthCheck.indexPatterns.description', {
      defaultMessage:
        'Creates the index patterns the modules use when they are missing, and checks their time field and required fields.',
    }),
    remediation: i18n.translate('wazuh.healthCheck.indexPatterns.remediation', {
      defaultMessage:
        'Check that the indexer is running and has the index templates, then restart the dashboard.',
    }),
  },
  [HEALTH_CHECK_TASK_SERVER_API_CONNECTION]: {
    title: i18n.translate('wazuh.healthCheck.serverApiConnection.title', {
      defaultMessage: 'Server API connection',
    }),
    description: i18n.translate(
      'wazuh.healthCheck.serverApiConnection.description',
      {
        defaultMessage:
          'Checks that the dashboard reaches the server API, and that the manager runs the same major and minor version as the dashboard.',
      },
    ),
    remediation: i18n.translate(
      'wazuh.healthCheck.serverApiConnection.remediation',
      {
        defaultMessage:
          'Check that the manager is running and reachable at the configured host, and that its version matches the dashboard. See Dashboard management > Server API.',
      },
    ),
  },
  [HEALTH_CHECK_TASK_SERVER_API_RUN_AS]: {
    title: i18n.translate('wazuh.healthCheck.serverApiRunAs.title', {
      defaultMessage: 'Server API run as',
    }),
    description: i18n.translate(
      'wazuh.healthCheck.serverApiRunAs.description',
      {
        defaultMessage:
          "Checks that the server API applies each dashboard user's own permissions (run_as).",
      },
    ),
    remediation: i18n.translate(
      'wazuh.healthCheck.serverApiRunAs.remediation',
      {
        defaultMessage:
          'Set run_as: true for the host in the dashboard configuration, and allow run_as for the API user on the manager.',
      },
    ),
  },
  [HEALTH_CHECK_TASK_CERTIFICATE_VALIDITY]: {
    title: i18n.translate('wazuh.healthCheck.certificateValidity.title', {
      defaultMessage: 'Manager certificates',
    }),
    description: i18n.translate(
      'wazuh.healthCheck.certificateValidity.description',
      {
        defaultMessage:
          'Checks the expiry and chain of the agent listener certificate and of the CA bundle on each manager node.',
      },
    ),
    remediation: i18n.translate(
      'wazuh.healthCheck.certificateValidity.remediation',
      {
        defaultMessage:
          'Renew the certificate the details name. After replacing the listener certificate, restart the manager so it serves the new one.',
      },
    ),
  },
});

export const registerHealthCheckDescriptions = (
  healthCheck: CoreSetup['healthCheck'],
) => {
  Object.entries(getHealthCheckDescriptions()).forEach(([name, description]) =>
    healthCheck.describe(name, description),
  );
};
