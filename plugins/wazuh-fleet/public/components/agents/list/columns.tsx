import React from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiHealth,
  EuiToolTip,
  EuiLink,
} from '@elastic/eui';
import { getCore } from '../../../plugin-services';
import { IAgentResponse } from '../../../../common/types';
import { AgentGroups, HostOS } from '../../common';
import { AGENTS_SUMMARY_ID } from '../../../groups/agents/applications';
import { DataGridColumn } from '../../common/data-grid';

/**
 * Dictionary of friendly names for technical fields
 * Used to display more user-friendly names
 */
export const friendlyFieldNames: Record<string, string> = {
  // Agent fields
  'agent.name': 'Name',
  'agent.id': 'Agent ID',
  'agent.version': 'Version',
  'agent.status': 'Status',
  'agent.groups': 'Groups',
  'agent.type': 'Agent Type',
  'agent.key': 'Key',
  'agent.last_login': 'Last Login',

  // Host fields
  'agent.host.ip': 'IP Address',
  'agent.host.name': 'Host Name',
  'agent.host.hostname': 'Hostname',
  'agent.host.architecture': 'Architecture',
  'agent.host.os.name': 'OS',
  'agent.host.os.version': 'OS Version',
  'agent.host.os.family': 'OS Family',
  'agent.host.os.full': 'Full OS',
  'agent.host.os.kernel': 'Kernel',
  'agent.host.os.platform': 'Platform',
  'agent.host.os.type': 'OS Type',
  'agent.host.boot.id': 'Boot ID',
  'agent.host.mac': 'MAC Address',
  'agent.host.domain': 'Domain',
  'agent.host.id': 'Host ID',
  'agent.host.uptime': 'Uptime',
  'agent.host.pid_ns_ino': 'PID Namespace ID',
  'agent.host.type': 'Host Type',

  // Resource fields
  'agent.host.cpu.usage': 'CPU Usage',
  'agent.host.disk.read.bytes': 'Disk Read',
  'agent.host.disk.write.bytes': 'Disk Write',
  'agent.host.network.egress.bytes': 'Network Out',
  'agent.host.network.egress.packets': 'Packets Out',
  'agent.host.network.ingress.bytes': 'Network In',
  'agent.host.network.ingress.packets': 'Packets In',

  // Risk fields
  'agent.host.risk.calculated_level': 'Risk Level',
  'agent.host.risk.calculated_score': 'Risk Score',
  'agent.host.risk.calculated_score_norm': 'Risk Score Norm',
  'agent.host.risk.static_level': 'Static Risk',
  'agent.host.risk.static_score': 'Static Score',
  'agent.host.risk.static_score_norm': 'Static Score Norm',

  // Geographic fields
  'agent.host.geo.city_name': 'City',
  'agent.host.geo.continent_code': 'Continent Code',
  'agent.host.geo.continent_name': 'Continent',
  'agent.host.geo.country_iso_code': 'Country Code',
  'agent.host.geo.country_name': 'Country',
  'agent.host.geo.location': 'Location',
  'agent.host.geo.name': 'Geo Name',
  'agent.host.geo.postal_code': 'Postal Code',
  'agent.host.geo.region_iso_code': 'Region Code',
  'agent.host.geo.region_name': 'Region',
  'agent.host.geo.timezone': 'Timezone',

  // Common fields
  '_id': 'ID',
  '_index': 'Index',
  '_score': 'Score',
  '_source': 'Source',
  '_type': 'Type'
};

/**
 * Function to get the friendly name of a field
 * @param fieldId - Technical ID of the field
 * @returns Friendly name or original ID if no translation exists
 */
export const getFriendlyFieldName = (fieldId: string): string => {
  return friendlyFieldNames[fieldId] || fieldId;
};

/**
 * Helper function to create standard columns
 * @param fieldId - Field ID
 * @param options - Additional column options
 * @returns Configured column object
 */
const createStandardColumn = (
  fieldId: string,
  options: Partial<DataGridColumn> = {}
): DataGridColumn => {
  return {
    id: fieldId,
    displayAsText: friendlyFieldNames[fieldId],
    name: friendlyFieldNames[fieldId],
    isSortable: true,
    ...options
  };
};

// Definition of special columns that require custom rendering
const specialColumns: DataGridColumn[] = [
  {
    id: 'agent.name',
    displayAsText: friendlyFieldNames['agent.name'],
    name: friendlyFieldNames['agent.name'],
    isSortable: true,
    searchable: true,
    render: (id: string, agentData: IAgentResponse) => (
      <EuiFlexGroup direction='column' gutterSize='none'>
        <EuiFlexItem>
          <EuiToolTip content={agentData.agent.id}>
            <EuiLink
              href={getCore().application.getUrlForApp(AGENTS_SUMMARY_ID, {
                path: `#/agents/${agentData.agent.id}`,
              })}
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
    displayAsText: friendlyFieldNames['agent.groups'],
    name: friendlyFieldNames['agent.groups'],
    isSortable: true,
    render: (groups: string[]) => <AgentGroups groups={groups} />,
  },
  {
    id: 'agent.version',
    displayAsText: friendlyFieldNames['agent.version'],
    name: friendlyFieldNames['agent.version'],
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
          gutterSize='xs'
          alignItems='center'
        >
          <EuiFlexItem grow={false}>{version}</EuiFlexItem>
          {isOutdated ? (
            <EuiFlexItem grow={false}>
              <EuiToolTip content={<p>Outdated</p>}>
                <EuiHealth className='wz-flex' color='danger'></EuiHealth>
              </EuiToolTip>
            </EuiFlexItem>
          ) : null}
        </EuiFlexGroup>
      );
    },
  },
  {
    id: 'agent.host.os.full',
    displayAsText: friendlyFieldNames['agent.host.os.full'],
    name: friendlyFieldNames['agent.host.os.full'],
    isSortable: true,
    render: (field: string, agentData: IAgentResponse) => (
      <HostOS os={agentData.agent.host?.os} />
    ),
  },
  {
    id: 'agent.host.ip',
    displayAsText: friendlyFieldNames['agent.host.ip'],
    name: friendlyFieldNames['agent.host.ip'],
    initialWidth: 140,
  },
];

const specialColumnIds = specialColumns.map(column => column.id);

// Generate standardColumnIds from friendlyFieldNames, excluding special columns
const standardColumnIds = Object.keys(friendlyFieldNames).filter(fieldId =>
  !specialColumnIds.includes(fieldId)
);

// Generate all standard columns
const standardColumns: DataGridColumn[] = standardColumnIds.map(fieldId =>
  createStandardColumn(fieldId)
);

// Combine special and standard columns
export const agentsTableColumns: DataGridColumn[] = [
  ...specialColumns,
  ...standardColumns
];
