import React from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiHealth,
  EuiToolTip,
  EuiLink,
} from '@elastic/eui';
import { getCore } from '../../../../plugin-services';
import { IAgentResponse } from '../../../../../common/types';
import { AgentGroups, HostOS } from '../../../common';
import { AGENTS_SUMMARY_ID } from '../../../../groups/agents/applications';
import { DataGridColumn } from '../../../common/data-grid/types';
import { getFriendlyFieldName } from './agent-fields';

/**
 * Helper function to create standard columns
 * @param fieldId - Field ID
 * @param options - Additional column options
 * @returns Configured column object
 */
export const createStandardColumn = (
  fieldId: string,
  options: Partial<DataGridColumn> = {}
): DataGridColumn => {
  return {
    id: fieldId,
    displayAsText: getFriendlyFieldName(fieldId),
    name: getFriendlyFieldName(fieldId),
    isSortable: true,
    ...options
  };
};

/**
 * Creates special columns that require custom rendering
 * @returns Array of special columns
 */
export const createSpecialColumns = (): DataGridColumn[] => [
  {
    id: 'agent.name',
    displayAsText: getFriendlyFieldName('agent.name'),
    name: getFriendlyFieldName('agent.name'),
    isSortable: true,
    searchable: true,
    render: (id: string, agentData: IAgentResponse) => (
      <EuiFlexGroup direction="column" gutterSize="none">
        <EuiFlexItem>
          <EuiToolTip content={agentData.agent.id}>
            <EuiLink
              href={
                getCore().application.getUrlForApp(AGENTS_SUMMARY_ID, {
                  path: `#/agents/${agentData.agent.id}`,
                })
              }
            >
              {id}
            </EuiLink>
          </EuiToolTip>
        </EuiFlexItem>
      </EuiFlexGroup>
    ),
  },
  {
    id: 'agent.groups',
    displayAsText: getFriendlyFieldName('agent.groups'),
    name: getFriendlyFieldName('agent.groups'),
    isSortable: true,
    render: (groups: string[]) => <AgentGroups groups={groups} />,
  },
  {
    id: 'agent.version',
    displayAsText: getFriendlyFieldName('agent.version'),
    name: getFriendlyFieldName('agent.version'),
    isSortable: true,
    initialWidth: 100,
    render: (version: string) => {
      const isOutdated = false;
      // const isOutdated = !!outdatedAgents.find(
      //   outdatedAgent => outdatedAgent.id === agent.id,
      // );

      return (
        <EuiFlexGroup
          wrap={false}
          responsive={false}
          gutterSize="xs"
          alignItems="center"
        >
          <EuiFlexItem grow={false}>{version}</EuiFlexItem>
          {
            isOutdated ? (
              <EuiFlexItem grow={false}>
                <EuiToolTip content={<p>Outdated</p>}>
                  <EuiHealth className="wz-flex" color="danger"></EuiHealth>
                </EuiToolTip>
              </EuiFlexItem>
            ) : null
          }
        </EuiFlexGroup>
      );
    },
  },
  {
    id: 'agent.host.os.full',
    displayAsText: getFriendlyFieldName('agent.host.os.full'),
    name: getFriendlyFieldName('agent.host.os.full'),
    isSortable: true,
    render: (_field: string, agentData: IAgentResponse) => (
      <HostOS os={agentData.agent.host?.os} />
    ),
  },
  {
    id: 'agent.host.ip',
    displayAsText: getFriendlyFieldName('agent.host.ip'),
    name: getFriendlyFieldName('agent.host.ip'),
    initialWidth: 140,
  },
];

/**
 * Creates all agent table columns by combining special and standard columns
 * @param standardColumnIds - IDs of standard columns to include
 * @returns Combined array of all columns
 */
export const createAgentTableColumns = (standardColumnIds: string[]): DataGridColumn[] => {
  const specialColumns = createSpecialColumns();
  const standardColumns = standardColumnIds.map(fieldId => createStandardColumn(fieldId));

  return [
    ...specialColumns,
    ...standardColumns
  ];
};
