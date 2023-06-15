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
import React, { Component, Fragment } from 'react';
import { EuiFlexItem, EuiFlexGroup, EuiBadge } from '@elastic/eui';
import { WzRequest } from '../../../react-services/wz-request';
import { formatUIDate } from '../../../react-services/time-service';
import WzTextWithTooltipIfTruncated from '../wz-text-with-tooltip-if-truncated';
import { WzStat } from '../../wz-stat';
import { GroupTruncate } from '../util/agent-group-truncate';
import { AgentStatus } from '../../agents/agent_status';

export class AgentInfo extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  async componentDidMount() {
    const managerVersion = await WzRequest.apiReq('GET', '/', {});
    this.setState({
      managerVersion:
        (((managerVersion || {}).data || {}).data || {}).api_version || {},
    });
  }

  getPlatformIcon(agent) {
    let icon = false;
    const os = (agent || {}).os;

    if (((os || {}).uname || '').includes('Linux')) {
      icon = 'linux';
    } else if ((os || {}).platform === 'windows') {
      icon = 'windows';
    } else if ((os || {}).platform === 'darwin') {
      icon = 'apple';
    }

    return (
      <i
        className={`fa fa-${icon} AgentsTable__soBadge AgentsTable__soBadge--${icon}`}
        aria-hidden='true'
      ></i>
    );
  }

  addTextPlatformRender(agent, style) {
    const checkField = field => {
      return field !== undefined ? field : '-';
    };

    const os_name =
      checkField(((agent || {}).os || {}).name) +
      ' ' +
      checkField(((agent || {}).os || {}).version);

    const osName = os_name === '- -' ? '-' : os_name;

    return (
      <WzTextWithTooltipIfTruncated
        position='bottom'
        tooltipProps={{ anchorClassName: 'wz-width-100' }}
        elementStyle={{ maxWidth: style.maxWidth, fontSize: 12 }}
      >
        {this.getPlatformIcon(this.props.agent)} {osName}
      </WzTextWithTooltipIfTruncated>
    );
  }

  addGroupsRender(agent) {
    // this was rendered with a EuiHealth, but EuiHealth has a div wrapper, and this section is rendered  within a <p> tag. <div> tags aren't allowed within <p> tags.
    return (
      <span>
        {agent.group.map((group, key) => (
          <EuiBadge
            color={'hollow'}
            key={`agent-group-${key}`}
            onClickAriaLabel={`agent-group-${group}`}
            onClick={() => this.props.goGroups(this.props.agent, key)}
          >
            {group}
          </EuiBadge>
        ))}
      </span>
    );
  }

  buildStats(items) {
    const checkField = field => {
      return field !== undefined || field ? field : '-';
    };
    const stats = items.map(item => {
      // We add tooltipProps, so that the ClusterNode and Operating System fields occupy their space and do not exceed this, overlapping with the one on the right
      const tooltipProps =
        item.description === 'Cluster node'
          ? { anchorClassName: 'wz-width-100' }
          : {};
      return (
        <EuiFlexItem key={item.description} style={item.style || null}>
          <WzStat
            title={
              item.description === 'Groups' ? (
                <GroupTruncate
                  agent={this.props.agent}
                  groups={this.props.agent.group}
                  length={40}
                  label={'more'}
                  action={'redirect'}
                  agent={this.props.agent}
                  {...this.props}
                />
              ) : item.description === 'Operating system' ? (
                this.addTextPlatformRender(this.props.agent, item.style)
              ) : item.description === 'Status' ? (
                <AgentStatus
                  status={this.props.agent.status}
                  style={{ ...item.style, fontSize: '12px' }}
                />
              ) : (
                <WzTextWithTooltipIfTruncated
                  position='bottom'
                  tooltipProps={tooltipProps}
                  elementStyle={{ maxWidth: item.style.maxWidth, fontSize: 12 }}
                >
                  {checkField(item.title)}
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
    let arrayStats;

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
          style: { minwidth: 150 },
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

    // window.innerWidth < 1500 ? console.log("<1500") : console.log("max")

    return (
      <Fragment>
        <EuiFlexGroup
          wrap
          style={{ responsive: true }}
          className='wz-welcome-page-agent-info-details'
        >
          {stats}
        </EuiFlexGroup>
      </Fragment>
    );
  }
}
