/*
 * Wazuh app - Unified fetch wrapper backing the Configuration search box.
 * Copyright (C) 2015-2026 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { get } from 'lodash';
import { WzRequest } from '../../../../../../react-services/wz-request';
import { getFullEndpointConfig, handleError } from './wz-fetch';
import { getAgentReportedConfiguration } from './agent-config-service';
import {
  SearchableSettingEntry,
  SearchableSettingField,
} from './searchable-settings-registry';

export interface SettingsSearchSource {
  status: 'ok' | 'error';
  error?: string;
}

export interface SettingsSearchData {
  /** Registry field id -> resolved value. */
  values: Record<string, unknown>;
  /** Per manager request key (or `agent-report`), whether that source
   * succeeded -- lets the UI say "N categories unavailable" without any
   * per-field error handling. */
  sources: Record<string, SettingsSearchSource>;
}

type ManagerSettingField = SearchableSettingField & {
  manager: NonNullable<SearchableSettingField['manager']>;
};

const regularRequestKey = (component: string, configuration: string) =>
  `${component}-${configuration}`;

const isErrorResult = (value: unknown): value is string =>
  typeof value === 'string';

/**
 * Fetches every manager section the registry needs, deduped across the
 * WHOLE registry (not per-section, unlike `withWzConfig`/`getCurrentConfig`,
 * which only ever see one section at a time) -- e.g. vulnerabilities and
 * commands both wanting `wmodules/wmodules` becomes one request here, and
 * every `useFullEndpoint` key across every section becomes one
 * `GET /cluster/{node}/configuration` call via the reused
 * `getFullEndpointConfig`.
 */
const fetchManagerData = async (
  node: string,
  registry: SearchableSettingEntry[],
  updateWazuhNotReadyYet: (msg: string) => void,
): Promise<SettingsSearchData> => {
  const managerFields = registry.filter(
    (field): field is ManagerSettingField =>
      field.kind !== 'list' &&
      field.appliesTo === 'manager' &&
      Boolean(field.manager),
  );

  const regularRequests = new Map<
    string,
    { component: string; configuration: string }
  >();
  const fullEndpointKeys = new Set<string>();

  for (const field of managerFields) {
    const { request } = field.manager;
    if (request.kind === 'regular') {
      regularRequests.set(
        regularRequestKey(request.component, request.configuration),
        request,
      );
    } else {
      fullEndpointKeys.add(request.key);
    }
  }

  const merged: Record<string, unknown> = {};
  const sources: Record<string, SettingsSearchSource> = {};

  const regularResults = await Promise.allSettled(
    Array.from(regularRequests.values()).map(
      async ({ component, configuration }) => {
        const key = regularRequestKey(component, configuration);
        try {
          const response = await WzRequest.apiReq(
            'GET',
            `/cluster/${node}/configuration/${component}/${configuration}`,
            {},
          );
          const value =
            response?.data?.data?.total_affected_items !== 0
              ? response.data.data.affected_items[0]
              : {};
          return { key, value };
        } catch (error) {
          const errorMsg = await handleError(
            error,
            'Fetch configuration',
            updateWazuhNotReadyYet,
            node,
          );
          return { key, value: errorMsg };
        }
      },
    ),
  );

  for (const result of regularResults) {
    // A rejection here would mean the mapped function itself threw, which it
    // doesn't (its own try/catch always resolves to a value) -- kept for
    // safety rather than assuming `allSettled` never rejects a branch.
    if (result.status === 'fulfilled') {
      const { key, value } = result.value;
      merged[key] = value;
      sources[key] = isErrorResult(value)
        ? { status: 'error', error: value }
        : { status: 'ok' };
    }
  }

  if (fullEndpointKeys.size > 0) {
    const fullEndpointResult = await getFullEndpointConfig(
      node,
      Array.from(fullEndpointKeys, key => ({ key })),
      updateWazuhNotReadyYet,
    );
    for (const key of fullEndpointKeys) {
      const value = fullEndpointResult[key];
      merged[key] = value;
      sources[key] = isErrorResult(value)
        ? { status: 'error', error: value }
        : { status: 'ok' };
    }
  }

  /* Normalize `request-remote`'s `remote` (array-or-object, per
  global-configuration-remote.js:105-107) to a plain object here, once, so
  every registry `path` referencing it can stay a simple dot-path. */
  const remoteKey = regularRequestKey('request', 'remote');
  const remoteResult = merged[remoteKey];
  if (
    remoteResult &&
    typeof remoteResult === 'object' &&
    !isErrorResult(remoteResult)
  ) {
    const remote = (remoteResult as { remote?: unknown }).remote;
    if (Array.isArray(remote)) {
      merged[remoteKey] = { ...remoteResult, remote: remote[0] };
    }
  }

  const values: Record<string, unknown> = {};
  for (const field of managerFields) {
    const { request, path, unwrap } = field.manager;
    const key =
      request.kind === 'regular'
        ? regularRequestKey(request.component, request.configuration)
        : request.key;
    const raw = merged[key];
    if (isErrorResult(raw)) {
      continue;
    }
    const base = unwrap ? unwrap(raw) : raw;
    values[field.id] = get(base, path);
  }

  return { values, sources };
};

/**
 * Agent branch: a thin pass-through/reshape over the existing
 * `getAgentReportedConfiguration` -- no new agent request logic.
 */
const fetchAgentData = async (
  agentId: string,
  registry: SearchableSettingEntry[],
): Promise<SettingsSearchData> => {
  const report = await getAgentReportedConfiguration(agentId);
  const content = report?.content ?? {};
  const values: Record<string, unknown> = {};
  for (const entry of registry) {
    if (entry.appliesTo !== 'agent') {
      continue;
    }
    // A field resolves to a scalar, a list resolves to its raw array --
    // both share the same agentPath/agentExtract shape, so this is generic.
    if (entry.agentExtract) {
      values[entry.id] = entry.agentExtract(content);
    } else if (entry.agentPath) {
      values[entry.id] = get(content, entry.agentPath);
    }
  }
  return { values, sources: { 'agent-report': { status: 'ok' } } };
};

/**
 * The report/aggregate read is shared by every keystroke of one visit, the
 * same way `agent-config-service.ts`'s `cachedRead` shares the agent report:
 * the promise is cached rather than its value, so callers arriving while the
 * read is in flight join it instead of starting another.
 */
interface CachedRead {
  key: string;
  data: Promise<SettingsSearchData>;
}

let cachedRead: CachedRead | null = null;

/** Discard the cached aggregate. Called from the same places the agent
 * report cache is cleared (visit end, explicit Refresh). */
export const clearSettingsSearchDataCache = (): void => {
  cachedRead = null;
};

/**
 * Fetch everything the searchable-settings registry needs, in as few
 * requests as possible, for either an agent or a manager node. Same call
 * shape, same return shape, regardless of branch.
 *
 * @param agentId Agent ID, or (manager context) the same value as `node`,
 *   mirroring `withWzConfig`'s `props.agent?.id || props.clusterNodeSelected`
 *   convention -- only used here to validate a target was actually chosen.
 * @param node `false` for an agent, the selected cluster node for a manager.
 */
export const getSearchableSettingsData = (
  agentId: string,
  node: false | string,
  registry: SearchableSettingEntry[],
  updateWazuhNotReadyYet: (msg: string) => void,
): Promise<SettingsSearchData> => {
  if (!agentId || typeof agentId !== 'string') {
    return Promise.reject(new Error('Invalid parameters'));
  }

  const key = node ? `manager:${node}` : `agent:${agentId}`;
  if (cachedRead?.key === key) {
    return cachedRead.data;
  }

  const data = node
    ? fetchManagerData(node, registry, updateWazuhNotReadyYet)
    : fetchAgentData(agentId, registry);

  const read = { key, data };
  cachedRead = read;

  /* A failed read is not an answer, so it is not kept: the next attempt
  retries instead of inheriting the error for the rest of the visit. */
  data.catch(() => {
    if (cachedRead === read) {
      cachedRead = null;
    }
  });

  return data;
};
