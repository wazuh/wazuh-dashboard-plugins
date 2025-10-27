/*
 * Copyright Wazuh
 * SPDX-License-Identifier: Apache-2.0
 */

// Health-check task that ensures sample Alerting monitors exist for quick
// integrations: Slack, PagerDuty, Jira, Shuffle. Actions will target
// Notifications channels created by the notifications health-check task. If a
// channel is not available, monitors are created without actions.

/**
 * @see https://docs.opensearch.org/3.2/observing-your-data/alerting/api/
 */

import { PluginTaskRunContext } from '../services';
import { defaultChannels } from './notification-default-channels/common/constants';

const JSON_INDENT_SPACES = 4;

interface SampleMonitorDef {
  key: 'slack' | 'pagerduty' | 'jira' | 'shuffle';
  monitorName: string;
  channelId: string; // Notifications channel config_id
  // Mustache template sent in actions.message_template.source
  message: string;
  // Severity string (1..5)
  severity: string;
}

const SAMPLES: SampleMonitorDef[] = [
  {
    key: 'slack',
    monitorName: 'Wazuh - Sample: Slack',
    channelId:
      defaultChannels.find(({ id }) => id.includes('slack'))?.id ||
      'default_slack_channel',
    message:
      'Wazuh sample Slack alert. Monitor: {{ctx.monitor.name}}. Trigger: {{ctx.trigger.name}}. Matches: {{ctx.results.0.hits.total.value}}.',
    severity: '2',
  },
  {
    key: 'pagerduty',
    monitorName: 'Wazuh - Sample: PagerDuty',
    channelId:
      defaultChannels.find(({ id }) => id.includes('pagerduty'))?.id ||
      'default_pagerduty_channel',
    // Minimal PagerDuty Events v2 payload; routing_key must be set by the user
    message: JSON.stringify(
      {
        event_action: 'trigger',
        payload: {
          summary: 'Testing PagerDuty',
          severity: 'critical',
          source: 'Wazuh Dashboard',
        },
      },
      null,
      JSON_INDENT_SPACES,
    ),
    severity: '1',
  },
  {
    key: 'jira',
    monitorName: 'Wazuh - Sample: Jira',
    channelId:
      defaultChannels.find(({ id }) => id.includes('jira'))?.id ||
      'default_jira_channel',
    message: JSON.stringify(
      {
        fields: {
          project: { key: 'CRM' },
          summary: 'Wazuh Alert: Test',
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  { type: 'text', text: 'This is a test from Wazuh Alerting.' },
                ],
              },
            ],
          },
          issuetype: { name: 'Task' },
        },
      },
      null,
      JSON_INDENT_SPACES,
    ),
    severity: '3',
  },
  {
    key: 'shuffle',
    monitorName: 'Wazuh - Sample: Shuffle',
    channelId:
      defaultChannels.find(({ id }) => id.includes('shuffle'))?.id ||
      'default_shuffle_channel',
    message: 'Wazuh sample Shuffle alert. Monitor: {{ctx.monitor.name}}. Trigger: {{ctx.trigger.name}}. Matches: {{ctx.results.0.hits.total.value}}.',
    severity: '4',
  },
];

async function request(ctx: PluginTaskRunContext, params: any) {
  return await ctx.context.services.core.opensearch.client.asInternalUser.transport.request(
    params,
  );
}

function buildMonitorBody(
  name: string,
  severity: string,
  destinationId?: string | null,
  message?: string,
) {
  const triggerBase: any = {
    name: 'Sample trigger',
    severity,
    // Minimal condition: fire when there is at least one match
    condition: {
      script: {
        lang: 'painless',
        source: 'return ctx.results[0].hits.total.value > 0',
      },
    },
    actions: [],
  };
  if (destinationId) {
    triggerBase.actions.push({
      name: 'Send notification',
      destination_id: destinationId,
      message_template: {
        lang: 'mustache',
        source: message || 'Wazuh sample notification',
      },
      subject_template: { lang: 'mustache', source: 'Wazuh Alert' },
    });
  }

  return {
    type: 'monitor',
    name,
    enabled: false,
    monitor_type: 'query_level_monitor',
    schedule: { period: { interval: 1, unit: 'MINUTES' } },
    // Minimal query-level input that works across installations
    inputs: [
      {
        search: {
          // Use Wazuh indices pattern to avoid requiring read on every index
          indices: ['wazuh-*'],
          query: {
            size: 0,
            query: {
              match_all: {},
            },
          },
        },
      },
    ],
    triggers: [triggerBase],
    ui_metadata: {
      // Minimal metadata to help users identify this as a sample
      description:
        'Sample monitor created by Wazuh health check to help you connect a channel. Edit the action to point to your real endpoint before enabling.',
    },
  };
}

async function getNotificationChannels(ctx: PluginTaskRunContext) {
  try {
    // https://docs.opensearch.org/3.2/observing-your-data/notifications/api/#list-all-notification-configurations
    const { body } = await request(ctx, {
      method: 'GET',
      path: '/_plugins/_notifications/configs',
      querystring: {
        from_index: 0,
        max_items: 1000,
        sort_field: 'name',
        sort_order: 'asc',
      },
    });
    return body?.config_list || [];
  } catch (error) {
    const _error = error as Error;
    ctx.logger.debug(
      `Notifications get configs failed: ${_error?.message || _error}`,
    );
    return [];
  }
}

async function monitorExists(ctx: PluginTaskRunContext, name: string) {
  try {
    const payload = {
      size: 0,
      query: { term: { 'monitor.name.keyword': name } },
    };
    const { body } = await request(ctx, {
      method: 'GET',
      path: '/_plugins/_alerting/monitors/_search',
      body: payload,
    });
    const total = body?.hits?.total?.value || 0;
    return total > 0;
  } catch (error) {
    const _error = error as Error;
    // If search fails (e.g., missing permissions/index), assume not exists
    ctx.logger.debug(
      `monitorExists error for [${name}]: ${_error?.message || _error}`,
    );
    return false;
  }
}

async function ensureMonitor(
  ctx: PluginTaskRunContext,
  sample: SampleMonitorDef,
) {
  const { monitorName, channelId, message, severity } = sample;
  const exists = await monitorExists(ctx, monitorName);
  if (exists) {
    ctx.logger.info(`Monitor already exists [${monitorName}]`);
    return;
  }

  const configs = await getNotificationChannels(ctx);
  const match = configs.find((c: any) => c?.config_id === channelId);
  if (!match) {
    ctx.logger.debug(
      `Notification channel with id [${channelId}] not found among existing configs.`,
    );
  }

  try {
    await request(ctx, {
      method: 'POST',
      path: '/_plugins/_alerting/monitors',
      querystring: { refresh: 'wait_for' },
      body: buildMonitorBody(
        monitorName,
        severity,
        match?.config_id ?? null,
        message,
      ),
    });
    ctx.logger.info(`Created sample monitor [${monitorName}]`);
  } catch (error) {
    const _error = error as Error;
    // Don’t break health check; surface a clear warning
    ctx.logger.warn(
      `Could not create sample monitor [${monitorName}]: ${
        _error?.message || _error
      }`,
    );
  }
}

async function isAlertingAvailable(ctx: PluginTaskRunContext) {
  try {
    await request(ctx, {
      // https://docs.opensearch.org/3.2/observing-your-data/alerting/api/#search-monitors
      method: 'GET',
      path: '/_plugins/_alerting/monitors/_search',
      body: { query: { match_all: {} } },
    });
    return true;
  } catch (error) {
    const _error = error as Error;
    ctx.logger.warn(
      `Alerting API is not available or not reachable: ${
        _error?.message || _error
      }`,
    );
    return false;
  }
}

export const initializationTaskCreatorAlertingMonitors = () => ({
  name: 'alerting:sample-monitors',
  async run(ctx: PluginTaskRunContext) {
    try {
      ctx.logger.debug('Starting Alerting sample monitors check');

      const isAvailable = await isAlertingAvailable(ctx);
      if (!isAvailable) {
        // Skip without failing the overall health check
        return { skipped: true, reason: 'Alerting API unavailable' };
      }

      await Promise.all(SAMPLES.map(sample => ensureMonitor(ctx, sample)));

      ctx.logger.info('Alerting sample monitors check finished');
      return { created: true };
    } catch (error) {
      const _error = error as Error;
      const message = `Error ensuring sample monitors: ${
        _error?.message || _error
      }`;
      ctx.logger.error(message);
      // Non-critical task: throw to report error state in the check result
      throw new Error(message);
    }
  },
});

// Test-only exports to validate request building and error handling
// without exposing internals in production code paths.
// eslint-disable-next-line import/no-default-export
export const __test__ = {
  alertingAvailable: isAlertingAvailable,
  getNotificationChannels,
  monitorExists,
  buildMonitorBody,
};
