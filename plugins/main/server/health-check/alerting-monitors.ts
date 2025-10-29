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

import type {
  Monitor,
  NotificationConfigsOpenSearchResponse,
  PluginTaskRunContext,
  TriggerAction,
} from './types';
import { WAZUH_ALERTS_PATTERN } from '../../common/constants';
import { DEFAULT_CHANNELS_ID } from './notification-default-channels/common/constants';

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
    monitorName: 'Sample: Slack',
    channelId: DEFAULT_CHANNELS_ID.SLACK,
    message:
      'Sample Slack alert. Monitor: {{ctx.monitor.name}}. Trigger: {{ctx.trigger.name}}. Matches: {{ctx.results.0.hits.total.value}}.',
    severity: '1',
  },
  {
    key: 'pagerduty',
    monitorName: 'Sample: PagerDuty',
    channelId: DEFAULT_CHANNELS_ID.PAGERDUTY,
    // Minimal PagerDuty Events v2 payload; routing_key must be set by the user
    message: JSON.stringify(
      {
        event_action: 'trigger',
        payload: {
          summary: 'Testing PagerDuty',
          severity: 'critical',
          source: 'Alerting',
        },
      },
      null,
      JSON_INDENT_SPACES,
    ),
    severity: '1',
  },
  {
    key: 'jira',
    monitorName: 'Sample: Jira',
    channelId: DEFAULT_CHANNELS_ID.JIRA,
    message: JSON.stringify(
      {
        fields: {
          project: { key: 'CRM' },
          summary: 'Alerting: Test',
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  { type: 'text', text: 'This is a test from Alerting.' },
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
    severity: '1',
  },
  {
    key: 'shuffle',
    monitorName: 'Sample: Shuffle',
    channelId: DEFAULT_CHANNELS_ID.SHUFFLE,
    message:
      'Sample Shuffle alert. Monitor: {{ctx.monitor.name}}. Trigger: {{ctx.trigger.name}}. Matches: {{ctx.results.0.hits.total.value}}.',
    severity: '1',
  },
];

function request<T = any>(ctx: PluginTaskRunContext, params: unknown) {
  return ctx.context.services.core.opensearch.client.asInternalUser.transport.request(
    params,
  ) as Promise<{ body: T }>;
}

function buildMonitorBody(
  name: string,
  severity: string,
  destinationId?: string | null,
  message?: string,
) {
  const triggerBase = {
    name: 'Sample trigger',
    severity,
    // Minimal condition: fire when there is at least one match
    condition: {
      script: {
        lang: 'painless',
        source: 'return ctx.results[0].hits.total.value > 0',
      },
    },
    actions: [] as TriggerAction[],
  };
  if (destinationId) {
    triggerBase.actions.push({
      name: 'Send notification',
      destination_id: destinationId,
      message_template: {
        lang: 'mustache',
        source: message || 'Sample notification',
      },
      subject_template: { lang: 'mustache', source: 'Alerting' },
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
          indices: [WAZUH_ALERTS_PATTERN],
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
        'Sample monitor created to help you connect a channel. Edit the action to point to your real endpoint before enabling.',
    },
  } as Monitor;
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
    ctx.logger.warn(
      `monitorExists error for [${name}]: ${_error?.message || _error}`,
    );
    return false;
  }
}

async function ensureMonitor(
  ctx: PluginTaskRunContext,
  sample: SampleMonitorDef,
  availableDefaultChannelIds?: Set<string>,
) {
  const { monitorName, channelId, message, severity } = sample;
  const exists = await monitorExists(ctx, monitorName);
  if (exists) {
    ctx.logger.info(`Monitor already exists [${monitorName}]`);
    return;
  }

  let destinationId: string | null | undefined = undefined;
  if (availableDefaultChannelIds) {
    destinationId = availableDefaultChannelIds.has(channelId)
      ? channelId
      : null;
  }

  try {
    await request(ctx, {
      method: 'POST',
      path: '/_plugins/_alerting/monitors',
      querystring: { refresh: 'wait_for' },
      body: buildMonitorBody(monitorName, severity, destinationId, message),
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

export const createSampleAlertingMonitors = async (
  ctx: PluginTaskRunContext,
  options?: { availableDefaultChannelIds?: Set<string> },
) => {
  try {
    ctx.logger.info('Starting Alerting sample monitors check');
    const availableDefaultChannelIds: Set<string> | undefined =
      options?.availableDefaultChannelIds
        ? new Set(options.availableDefaultChannelIds)
        : undefined;

    /**
     * Sample monitor creation attempts
     * `await Promise.all(SAMPLES.map(sample => ensureMonitor(ctx, sample)));`
     *
     * Throws unhandled promise rejection on logger calls:
     * [error][data][opensearch] [alerting_exception]: all shards failed
     * [warning][healthcheck][XXXXXX] Could not create sample monitor [Sample: Jira]: alerting_exception: [alerting_exception] Reason: all shards failed
     * [error][data][opensearch] [alerting_exception]: all shards failed
     * [warning][healthcheck][XXXXXX] Could not create sample monitor [Sample: Slack]: alerting_exception: [alerting_exception] Reason: all shards failed
     */
    for (const sample of SAMPLES) {
      await ensureMonitor(ctx, sample, availableDefaultChannelIds);
    }

    ctx.logger.info('Alerting sample monitors check finished');
  } catch (error) {
    const _error = error as Error;
    const message = `Error ensuring sample monitors: ${
      _error?.message || _error
    }`;
    ctx.logger.warn(message);
    // Non-critical task: throw to report error state in the check result
    throw new Error(message);
  }
};

// Test-only exports to validate request building and error handling
// without exposing internals in production code paths.
// eslint-disable-next-line import/no-default-export
export const __test__ = {
  monitorExists,
  buildMonitorBody,
};
