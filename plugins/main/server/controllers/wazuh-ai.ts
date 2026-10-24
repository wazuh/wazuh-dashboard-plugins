/*
 * Wazuh app - Controller for SOC AI analysis
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 */
import {
  OpenSearchDashboardsRequest,
  RequestHandlerContext,
  OpenSearchDashboardsResponseFactory,
} from 'src/core/server';
import { WAZUH_ALERTS_PREFIX } from '../../common/constants';

type NeedleOptions = {
  json: boolean;
  headers: Record<string, string>;
  open_timeout: number;
  response_timeout: number;
  read_timeout: number;
};

type NeedleResponse = {
  statusCode?: number;
  body?: {
    ok?: unknown;
    analysis?: unknown;
  };
};

type NeedlePost = (
  method: string,
  url: string,
  data: unknown,
  options: NeedleOptions,
) => Promise<NeedleResponse>;

// Needle 3.2.0 does not ship TypeScript declarations.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const needle = require('needle') as NeedlePost;

const AI_SERVICE_URL = 'http://127.0.0.1:5000/api/ai/analyze-alert';
const MAX_AI_ALERT_BYTES = 256 * 1024;
const AI_SERVICE_TIMEOUT_MS = 5000;
const ALLOWED_ALERT_FIELDS = [
  '@timestamp',
  'timestamp',
  'rule.id',
  'rule.level',
  'rule.description',
  'rule.groups',
  'rule.mitre.id',
  'rule.mitre.tactic',
  'rule.mitre.technique',
  'decoder.name',
  'agent.id',
  'data.srcip',
  'data.dstip',
  'data.srcport',
  'data.dstport',
  'data.protocol',
  'data.action',
  'data.authentication_result',
  'data.win.system.eventID',
];

function matchesAlertIndexPattern(index: string, pattern: unknown): boolean {
  if (
    !index.startsWith(WAZUH_ALERTS_PREFIX) ||
    !/^[a-z0-9][a-z0-9._-]*$/.test(index) ||
    typeof pattern !== 'string' ||
    !pattern.startsWith(WAZUH_ALERTS_PREFIX)
  ) {
    return false;
  }

  const escapedPattern = pattern
    .split('*')
    .map(part => part.replace(/[|\\{}()[\]^$+?.]/g, '\\$&'))
    .join('.*');

  return new RegExp(`^${escapedPattern}$`).test(index);
}

function getAllowedValue(source: Record<string, unknown>, field: string) {
  let value: unknown = source;

  for (const part of field.split('.')) {
    if (
      !value ||
      typeof value !== 'object' ||
      Array.isArray(value) ||
      !Object.prototype.hasOwnProperty.call(value, part)
    ) {
      return undefined;
    }
    value = (value as Record<string, unknown>)[part];
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    const scalarValues = value
      .filter(
        item =>
          typeof item === 'string' ||
          typeof item === 'number' ||
          typeof item === 'boolean',
      )
      .slice(0, 50);
    return scalarValues.length ? scalarValues : undefined;
  }

  return undefined;
}

function setAllowedValue(
  target: Record<string, unknown>,
  field: string,
  value: unknown,
) {
  const parts = field.split('.');
  let current = target;

  parts.slice(0, -1).forEach(part => {
    if (!current[part] || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  });

  current[parts[parts.length - 1]] = value;
}

function minimizeAlert(source: unknown): Record<string, unknown> {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return {};
  }

  const minimized: Record<string, unknown> = {};
  for (const field of ALLOWED_ALERT_FIELDS) {
    const value = getAllowedValue(source as Record<string, unknown>, field);
    if (value !== undefined) {
      setAllowedValue(minimized, field, value);
    }
  }
  return minimized;
}

function getErrorStatusCode(error: unknown): unknown {
  if (!error || typeof error !== 'object') {
    return undefined;
  }

  const typedError = error as {
    meta?: { statusCode?: unknown };
    statusCode?: unknown;
  };
  return typedError.meta?.statusCode ?? typedError.statusCode;
}

export class WazuhAiCtrl {
  async analyzeAlert(
    context: RequestHandlerContext,
    request: OpenSearchDashboardsRequest,
    response: OpenSearchDashboardsResponseFactory,
  ) {
    try {
      const currentUser = await context.wazuh.security.getCurrentUser(
        request,
        context,
      );
      if (!currentUser || typeof currentUser.username !== 'string') {
        return response.custom({
          statusCode: 401,
          body: { ok: false, error: 'Authentication required' },
        });
      }
    } catch {
      return response.custom({
        statusCode: 401,
        body: { ok: false, error: 'Authentication required' },
      });
    }

    const body = request.body || {};
    const index = body.index;
    const id = body.id;
    if (
      typeof index !== 'string' ||
      typeof id !== 'string' ||
      id.length === 0 ||
      Buffer.byteLength(id, 'utf8') > 512
    ) {
      return response.custom({
        statusCode: 400,
        body: { ok: false, error: 'A valid alert reference is required' },
      });
    }

    let configuredPattern: unknown;
    try {
      configuredPattern = await context.wazuh_core.configuration.getSettingValue(
        'pattern',
      );
    } catch {
      return response.custom({
        statusCode: 503,
        body: { ok: false, error: 'AI analysis is temporarily unavailable' },
      });
    }

    if (!matchesAlertIndexPattern(index, configuredPattern)) {
      return response.custom({
        statusCode: 400,
        body: { ok: false, error: 'A valid alert reference is required' },
      });
    }

    const internalToken = process.env.SOC_AI_INTERNAL_TOKEN;
    if (!internalToken) {
      return response.custom({
        statusCode: 503,
        body: { ok: false, error: 'AI analysis is temporarily unavailable' },
      });
    }

    let alert: Record<string, unknown>;
    try {
      // A search made as the signed-in user enforces their index, DLS, and FLS permissions.
      const searchResult = await context.core.opensearch.client.asCurrentUser.search(
        {
          index,
          body: {
            size: 1,
            // OpenSearch uses this API field name.
            // eslint-disable-next-line camelcase
            track_total_hits: false,
            query: { ids: { values: [id] } },
            _source: ALLOWED_ALERT_FIELDS,
          },
        },
      );
      const source = searchResult?.body?.hits?.hits?.[0]?._source;
      if (!source) {
        return response.custom({
          statusCode: 404,
          body: { ok: false, error: 'Alert is unavailable' },
        });
      }

      alert = minimizeAlert(source);
      if (!Object.keys(alert).length) {
        return response.custom({
          statusCode: 422,
          body: { ok: false, error: 'Alert has no analyzable fields' },
        });
      }
    } catch (error) {
      if (getErrorStatusCode(error) === 403) {
        return response.custom({
          statusCode: 403,
          body: { ok: false, error: 'Access to this alert is denied' },
        });
      }

      return response.custom({
        statusCode: 503,
        body: { ok: false, error: 'AI analysis is temporarily unavailable' },
      });
    }

    if (Buffer.byteLength(JSON.stringify(alert), 'utf8') > MAX_AI_ALERT_BYTES) {
      return response.custom({
        statusCode: 413,
        body: { ok: false, error: 'Alert payload is too large' },
      });
    }

    // The Python API applies sanitize_alert before invoking the AI provider.
    try {
      const upstream = await needle(
        'post',
        AI_SERVICE_URL,
        { alert },
        {
          json: true,
          headers: {
            Authorization: `Bearer ${internalToken}`,
          },
          // Needle names these timeout options with underscores.
          // eslint-disable-next-line camelcase
          open_timeout: AI_SERVICE_TIMEOUT_MS,
          // eslint-disable-next-line camelcase
          response_timeout: AI_SERVICE_TIMEOUT_MS,
          // eslint-disable-next-line camelcase
          read_timeout: AI_SERVICE_TIMEOUT_MS,
        },
      );

      if (
        typeof upstream.statusCode !== 'number' ||
        upstream.statusCode < 200 ||
        upstream.statusCode >= 300 ||
        !upstream.body ||
        upstream.body.ok !== true ||
        typeof upstream.body.analysis !== 'string' ||
        !upstream.body.analysis.trim()
      ) {
        return response.custom({
          statusCode: 503,
          body: {
            ok: false,
            error: 'AI analysis is temporarily unavailable',
          },
        });
      }

      return response.ok({
        body: {
          ok: true,
          analysis: upstream.body.analysis,
        },
      });
    } catch {
      return response.custom({
        statusCode: 503,
        body: { ok: false, error: 'AI analysis is temporarily unavailable' },
      });
    }
  }
}
