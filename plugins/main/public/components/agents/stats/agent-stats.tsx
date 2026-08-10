/*
 * Wazuh app - Component to display the Agent stats
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { useState, useEffect } from 'react';
import semver from 'semver';
import { get } from 'lodash';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPage,
  EuiPageBody,
  EuiSpacer,
} from '@elastic/eui';
import {
  withGlobalBreadcrumb,
  withGuard,
  withUserAuthorizationPrompt,
  withErrorBoundary,
  withDataSourceInitiated,
} from '../../common/hocs';
import { compose } from 'redux';
import { formatUIDate } from '../../../react-services';
import { formatUINumber } from '../../../react-services/format-number';
import { AgentStatTable } from './table';
import {
  PromptNoActiveAgentWithoutSelect,
  PromptAgentFeatureVersion,
} from '../prompts';
import {
  UIErrorLog,
  UI_ERROR_SEVERITIES,
  UILogLevel,
  UIErrorSeverity,
} from '../../../react-services/error-orchestrator/types';
import {
  API_NAME_AGENT_STATUS,
  UI_LOGGER_LEVELS,
} from '../../../../common/constants';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { endpointSummary } from '../../../utils/applications';
import NavigationService from '../../../react-services/navigation-service';
import WzRibbon from '../../common/ribbon/ribbon';
import { Agent } from '../../endpoints-summary/types';
import { SECTIONS } from '../../../sections';
import { getAgentVersion } from '../../../../common/services/wz-agent';
import {
  AgentStatsDataSource,
  AgentStatsDataSourceRepository,
  PatternDataSource,
  tParsedIndexPattern,
  useDataSource,
} from '../../common/data-source';

const tableColumns = [
  {
    field: 'location',
    name: 'Location',
    sortable: true,
  },
  {
    field: 'events',
    name: 'Events',
    sortable: true,
  },
  {
    field: 'bytes',
    name: 'Bytes',
    sortable: true,
  },
];

interface AgentStatsLogcollectorFile {
  location?: string;
  events?: number;
  bytes?: number;
  targets?:
    | { name?: string; drops?: number }
    | { name?: string; drops?: number }[];
}

interface AgentStatsLogcollectorWindow {
  start?: string;
  end?: string;
  // The index maps the files as a plain object, not as nested, so a report with
  // a single file can travel as an object instead of a one-element array
  files?: AgentStatsLogcollectorFile | AgentStatsLogcollectorFile[];
}

/**
 * Read a value the index maps as a plain object as a list, so a single item and
 * a list of items are handled the same way.
 */
function toList<T>(value?: T | T[]): T[] {
  if (value === undefined || value === null) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

/**
 * Statistics the agent reports through the HTTPS communication protocol, stored
 * by the server in the agent statistics index under `wazuh.agent.statistics`.
 * Its keys are module names, so a module appears once it has a statistics
 * producer.
 */
interface AgentStatistics {
  agent?: {
    status?: string;
    last_keepalive?: string;
    messages?: { count?: number };
  };
  logcollector?: {
    global?: AgentStatsLogcollectorWindow;
    interval?: AgentStatsLogcollectorWindow;
  };
}

const statsAgents: {
  key: string;
  title: string;
  path: string;
  render?: (value?: unknown) => React.ReactNode;
}[] = [
  {
    key: 'status',
    title: 'Status',
    path: 'agent.status',
  },
  {
    key: 'messages_count',
    title: 'Messages count',
    path: 'agent.messages.count',
    render: formatUINumber,
  },
  {
    key: 'last_keepalive',
    title: 'Last keep alive',
    path: 'agent.last_keepalive',
    render: formatUIDate,
  },
];

export const MainAgentStats = compose(
  withErrorBoundary,
  withGlobalBreadcrumb(({ agent }) => [
    {
      text: endpointSummary.breadcrumbLabel,
      href: NavigationService.getInstance().getUrlForApp(endpointSummary.id, {
        path: `#/${SECTIONS.AGENTS_PREVIEW}`,
      }),
    },
    { agent },
    {
      text: 'Stats',
    },
  ]),
  withUserAuthorizationPrompt(({ agent }) => [
    [
      { action: 'agent:read', resource: `agent:id:${agent.id}` },
      ...(agent.group || []).map(group => ({
        action: 'agent:read',
        resource: `agent:group:${group}`,
      })),
    ],
  ]),
  withGuard(
    ({ agent }) => agent.status !== API_NAME_AGENT_STATUS.ACTIVE,
    PromptNoActiveAgentWithoutSelect,
  ),
  withGuard(
    ({ agent }) => {
      const { raw } = getAgentVersion(agent.version);
      return semver.lt(raw, '4.2.0');
    },
    () => (
      <PromptAgentFeatureVersion version='equal or higher version than 4.2.0' />
    ),
  ),
)(AgentStats);

interface AgentStatsProps {
  agent: Agent;
}

interface AgentStatsBodyProps {
  agentID: string;
  loading: boolean;
  statistics?: AgentStatistics;
}

const AgentStatsBody = withDataSourceInitiated({})(
  ({ agentID, loading, statistics }: AgentStatsBodyProps) => (
    <>
      <WzRibbon
        items={statsAgents.map(stat => ({
          key: stat.key,
          label: stat.title,
          isLoading: loading,
          value: stat.render
            ? stat.render(get(statistics, stat.path))
            : get(statistics, stat.path),
        }))}
      />
      <EuiSpacer size='xxl' />
      <EuiFlexGroup>
        <EuiFlexItem>
          <AgentStatTable
            columns={tableColumns}
            loading={loading}
            title='Global'
            start={statistics?.logcollector?.global?.start}
            end={statistics?.logcollector?.global?.end}
            items={toList(statistics?.logcollector?.global?.files)}
            exportCSVFilename={`agent-stats-${agentID}-logcollector-global`}
          />
        </EuiFlexItem>
        <EuiFlexItem>
          <AgentStatTable
            columns={tableColumns}
            loading={loading}
            title='Interval'
            start={statistics?.logcollector?.interval?.start}
            end={statistics?.logcollector?.interval?.end}
            items={toList(statistics?.logcollector?.interval?.files)}
            exportCSVFilename={`agent-stats-${agentID}-logcollector-interval`}
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    </>
  ),
);

export function AgentStats(props: AgentStatsProps) {
  const { agent } = props;
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<AgentStatistics>();
  const dataSource = useDataSource<tParsedIndexPattern, PatternDataSource>({
    DataSource: AgentStatsDataSource,
    repository: new AgentStatsDataSourceRepository(),
  });
  useEffect(() => {
    if (dataSource.isLoading) {
      return;
    }
    (async function () {
      setLoading(true);
      try {
        const response = await dataSource.fetchData({
          query: {
            language: 'kuery',
            query: `wazuh.agent.id: "${agent.id}"`,
          },
          // The index stores the latest report of each agent, replacing the
          // previous one, so there is only one document per agent
          pagination: { pageIndex: 0, pageSize: 1 },
        });
        setStatistics(
          response?.hits?.hits?.[0]?._source?.wazuh?.agent?.statistics,
        );
      } catch (error) {
        const options: UIErrorLog = {
          context: `${AgentStats.name}.useEffect`,
          level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
          severity: UI_ERROR_SEVERITIES.BUSINESS as UIErrorSeverity,
          error: {
            error: error,
            message: (error as Error).message || (error as string),
            title: (error as Error).name || (error as string),
          },
        };
        getErrorOrchestrator().handleError(options);
      } finally {
        setLoading(false);
      }
    })();
  }, [dataSource.isLoading, dataSource.fetchFilters, agent.id]);
  return (
    <EuiPage>
      <EuiPageBody>
        <AgentStatsBody
          agentID={agent.id}
          loading={loading || dataSource.isLoading}
          statistics={statistics}
          dataSource={dataSource}
        />
      </EuiPageBody>
    </EuiPage>
  );
}
