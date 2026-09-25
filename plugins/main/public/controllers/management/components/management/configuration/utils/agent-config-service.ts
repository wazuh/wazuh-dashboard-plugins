/*
 * Wazuh app - Read an agent's reported configuration from the wazuh-agent-config index.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { getDataPlugin } from '../../../../../../kibana-services';
import { AppState } from '../../../../../../react-services/app-state';
import { WAZUH_AGENT_CONFIG_PATTERN } from '../../../../../../../common/constants';

/**
 * The agent's effective configuration, as it last reported it to the manager's
 * `/config` endpoint.
 *
 * The manager stores one document per agent (document id = agent id) and every
 * report replaces the previous one, so there is no history to page through.
 */
export interface AgentReportedConfiguration {
  /**
   * The reported configuration keyed by module name, e.g.
   * `{ agent: {...}, fim: {...}, logcollector: {...} }`.
   */
  content: Record<string, unknown>;
  /**
   * The module keys present in this report. Derived by the manager from
   * `content`'s keys, so the two can never drift apart.
   */
  modules: string[];
  /** When the agent last reported. */
  modifiedAt?: string;
}

const toArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value;
  }
  return value ? [value as string] : [];
};

const readAgentReportedConfiguration = async (
  agentId: string,
): Promise<AgentReportedConfiguration | null> => {
  const indexPattern = await getDataPlugin().indexPatterns.get(
    WAZUH_AGENT_CONFIG_PATTERN,
  );
  const searchSource = await getDataPlugin().search.searchSource.create();
  const clusterName = AppState.getClusterInfo().cluster;

  /* The whole document is read instead of trimming _source to the
  configuration subtree: it is a single configuration report, not a result set,
  and reading it whole keeps this independent of how the fields are mapped. */
  // TODO: filter via the PatternDataSource/PatternDataSourceFilterManager
  // cluster-filter helper (see other wazuh.agent.* indices) instead of a
  // raw term here, if this read is ever migrated onto that framework.
  const response = await searchSource
    .setParent(undefined)
    .setField('index', indexPattern)
    .setField('size', 1)
    .setField('query', {
      language: 'lucene',
      query: {
        bool: {
          must: [
            { term: { 'wazuh.agent.id': agentId } },
            { term: { 'wazuh.cluster.name': clusterName } },
          ],
        },
      },
    })
    .fetch();

  const source = response?.hits?.hits?.[0]?._source;

  if (!source) {
    return null;
  }

  const configuration = source?.wazuh?.agent?.configuration ?? {};

  return {
    content: configuration.content ?? {},
    modules: toArray(configuration.modules),
    modifiedAt: source?.state?.modified_at,
  };
};

/**
 * The report read for the agent currently being looked at.
 *
 * Every configuration section asks for the same thing: the report is a single
 * document holding every module, so the section a view renders is picked out of
 * it rather than requested. Caching it means the sections of one visit share
 * one read, and one snapshot -- eight separate reads could straddle a new
 * report and show two generations of the same configuration side by side.
 *
 * The promise is cached rather than its value so that callers arriving while
 * the read is in flight join it instead of starting another.
 */
let cachedRead: {
  agentId: string;
  configuration: Promise<AgentReportedConfiguration | null>;
} | null = null;

/**
 * Discard the cached report. Called when the visit that owns it ends, so
 * coming back to the configuration reads the agent's current report.
 */
export const clearAgentReportedConfigurationCache = () => {
  cachedRead = null;
};

/**
 * Get the configuration an agent last reported.
 *
 * Returns `null` when the agent has no document in the index. That is not an
 * error: reporting is an opt-in `ossec.conf` toggle that is disabled by
 * default, so an agent that has never reported is the expected case.
 *
 * Throws when the index pattern is missing, which is a real misconfiguration
 * rather than an absence of data.
 *
 * @param agentId Agent ID
 */
export const getAgentReportedConfiguration = (
  agentId: string,
): Promise<AgentReportedConfiguration | null> => {
  if (cachedRead?.agentId === agentId) {
    return cachedRead.configuration;
  }

  const configuration = readAgentReportedConfiguration(agentId);
  const read = { agentId, configuration };

  cachedRead = read;

  /* A failed read is not an answer, so it is not kept: the next section
  retries instead of inheriting the error for the rest of the visit. `null` is
  kept -- an agent that has never reported is a valid answer. */
  configuration.catch(() => {
    if (cachedRead === read) {
      cachedRead = null;
    }
  });

  return configuration;
};
