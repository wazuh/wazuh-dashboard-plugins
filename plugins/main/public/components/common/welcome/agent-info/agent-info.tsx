/*
 * Wazuh app - React component for showing agent fields such as IP, ID, name,
 * version, OS, registration date, last keep alive.
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component } from 'react';
import { EuiFlexItem, EuiFlexGroup, EuiBadge } from '@elastic/eui';
import { WzRequest } from '../../../../react-services/wz-request';
import { formatUIDate } from '../../../../react-services/time-service';
import WzTextWithTooltipIfTruncated from '../../wz-text-with-tooltip-if-truncated';
import { WzStat } from '../../../wz-stat';
import { GroupTruncate } from '../../util/agent-group-truncate';
import { AgentStatus } from '../../../agents/agent-status';
import './agent-info.scss';
import { Agent } from '../../../endpoints-summary/types';

interface AgentInfoProps {
  agent: Agent;
  goGroups?: (agent: Agent, key: number) => void;
  isCondensed?: boolean;
}

interface Stats {
  title: string;
  description: string;
  style: React.CSSProperties;
}

export class AgentInfo extends Component<AgentInfoProps> {
  constructor(props: AgentInfoProps) {
    super(props);

    this.state = {};
  }

  async componentDidMount() {
    const managerVersion = await WzRequest.apiReq('GET', '/', {});
    this.setState({
      managerVersion: managerVersion?.data?.data?.api_version || {},
    });
  }

  getPlatformIcon(agent?: Agent) {
    let icon = '';
    const os = agent?.os;

    if (os?.uname?.includes('Linux')) {
      icon = 'linux';
    } else if (os?.platform === 'windows') {
      icon = 'windows';
    } else if (os?.platform === 'darwin') {
      icon = 'apple';
    }

    return (
      <i
        className={`fa fa-${icon} AgentsTable__soBadge AgentsTable__soBadge--${icon}`}
        aria-hidden='true'
      ></i>
    );
  }

  getOsName(agent?: Agent) {
    const { name, version } = agent?.os || {};

    if (!name && !version) return '-';

    if (!version) return name;

    if (!name) return version;

    return `${name} ${version}`;
  }

  renderField = (field?: string) => {
    return field !== undefined || field ? field : '-';
  };

  buildStats(items: Stats[]) {
    const stats = items.map(item => {
      const wzWidth100 = { anchorClassName: 'wz-width-100' };
      const elementStyle = { maxWidth: item.style.maxWidth, fontSize: 12 };
      // We add tooltipProps, so that the ClusterNode and Operating System fields occupy their space and do not exceed this, overlapping with the one on the right
      const tooltipProps =
        item.description === 'Cluster node' ? wzWidth100 : {};
      return (
        <EuiFlexItem
          className='wz-agent-info'
          key={item.description}
          style={item.style || null}
        >
          <WzStat
            title={
              item.description === 'Groups' &&
              this.props.agent.group?.length ? (
                <GroupTruncate
                  groups={this.props.agent.group}
                  length={40}
                  label={'more'}
                  action={'redirect'}
                  {...this.props}
                />
              ) : item.description === 'Operating system' ? (
                <WzTextWithTooltipIfTruncated
                  position='bottom'
                  tooltipProps={wzWidth100}
                  elementStyle={elementStyle}
                >
                  {this.getPlatformIcon(this.props.agent)}{' '}
                  {this.getOsName(this.props.agent)}
                </WzTextWithTooltipIfTruncated>
              ) : item.description === 'Status' ? (
                <AgentStatus
                  status={this.props.agent.status}
                  agent={this.props.agent}
                  style={{ ...item.style, fontSize: 12 }}
                />
              ) : (
                <WzTextWithTooltipIfTruncated
                  position='bottom'
                  tooltipProps={tooltipProps}
                  elementStyle={elementStyle}
                >
                  {this.renderField(item.title)}
                </WzTextWithTooltipIfTruncated>
              )
            }
            description={item.description}
            titleSize='xs'
          />
        </EuiFlexItem>
      );
    });
    return stats;
  }

  render() {
    const { agent } = this.props;
    let arrayStats: Stats[];

    if (this.props.isCondensed) {
      arrayStats = [
        { title: agent.id, description: 'ID', style: { maxWidth: 100 } },
        {
          title: agent.status,
          description: 'Status',
          style: { maxWidth: 150 },
        },
        {
          title: agent.version,
          description: 'Version',
          style: { maxWidth: 150 },
        },
        {
          title: agent.name,
          description: 'Operating system',
          style: { minWidth: 200, maxWidth: 200 },
        },
      ];
    } else {
      arrayStats = [
        { title: agent.id, description: 'ID', style: { minWidth: 30 } },
        {
          title: agent.status,
          description: 'Status',
          style: { minWidth: 100 },
        },
        {
          title: agent.ip,
          description: 'IP address',
          style: {},
        },
        {
          title: agent.version,
          description: 'Version',
          style: { minWidth: 100 },
        },
        { title: agent.group, description: 'Groups', style: { minWidth: 150 } },
        {
          title: agent.name,
          description: 'Operating system',
          style: { minWidth: 150 },
        },
        {
          title:
            agent.node_name && agent.node_name !== 'unknown'
              ? agent.node_name
              : '-',
          description: 'Cluster node',
          style: { minWidth: 120 },
        },
        {
          title: formatUIDate(agent.dateAdd),
          description: 'Registration date',
          style: { minWidth: 180 },
        },
        {
          title: formatUIDate(agent.lastKeepAlive),
          description: 'Last keep alive',
          style: { minWidth: 180 },
        },
      ];
    }

    const stats = this.buildStats(arrayStats);

    return (
      <EuiFlexGroup
        data-test-subj='agent-info'
        wrap
        style={{ responsive: true }}
      >
        {stats}
      </EuiFlexGroup>
    );
  }
}
