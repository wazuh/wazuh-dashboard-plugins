/*
 * Wazuh app - React component for showing agent fields such as IP, ID, name,
 * version, OS, registration date, last keep alive.
 *
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component, Fragment } from 'react';
import {
  EuiStat,
  EuiFlexItem,
  EuiFlexGroup,
  EuiHealth
} from '@elastic/eui';
import { WzRequest } from '../../../react-services/wz-request';

import WzTextWithTooltipIfTruncated from '../wz-text-with-tooltip-if-truncated';

export class AgentInfo extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  async componentDidMount() {
    const managerVersion = await WzRequest.apiReq('GET', '/version', {});

    this.setState({
      managerVersion: ((managerVersion || {}).data || {}).data || {}
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

    return <i
      className={`fa fa-${icon} AgentsTable__soBadge AgentsTable__soBadge--${icon}`}
      aria-hidden="true"
    ></i>
  }


  addTextPlatformRender(agent) {
    const checkField = field => {
      return field !== undefined ? field : '-';
    };

    const os_name =
      checkField(((agent || {}).os || {}).name) +
      ' ' +
      checkField(((agent || {}).os || {}).version);

    const osName = os_name === '- -' ? '-' : os_name;

    return (
      <WzTextWithTooltipIfTruncated position='bottom' elementStyle={{ maxWidth: "250px", fontSize: 12 }}>
        {this.getPlatformIcon(this.props.agent)}
        {' '}{osName}
      </WzTextWithTooltipIfTruncated>
    )
  }


  color = (status, hex = false) => {
    if (status.toLowerCase() === 'active') { return hex ? '#017D73' : 'success'; }
    else if (status.toLowerCase() === 'disconnected') { return hex ? '#BD271E' : 'danger'; }
    else if (status.toLowerCase() === 'never connected') { return hex ? '#98A2B3' : 'subdued'; }
  }

  addHealthRender(agent) {
    return (
      <EuiHealth style={{ paddingTop: 3 }} size="xl" color={this.color(this.props.agent.status)}>
        {this.props.agent.status}
      </EuiHealth>
    )
  }

  buildStats(items) {
    const checkField = field => {
      return field !== undefined || field ? field : '-';
    };
    const stats = items.map(item => {
      return (
        <EuiFlexItem key={item.description} style={item.style || null}>
          <EuiStat
            title={
              item.description === 'Operating system' ? (
                this.addTextPlatformRender(this.props.agent)
              ) : item.description === 'Status' ? (
                this.addHealthRender(this.props.agent)
              ) : (
                    <span
                      style={{
                        overflow: 'hidden',
                        maxWidth: "250px",
                        margin: '0 auto',
                        fontSize: 12
                      }}
                    >
                      {checkField(item.title)}
                    </span>
                  )
            }
            description={item.description}
            titleSize="xs"
          />
        </EuiFlexItem>
      );
    });
    return stats;
  }

  render() {
    const { agent } = this.props;
    const stats = this.buildStats([
      { title: agent.id, description: 'ID', style: { maxWidth: 100 } },
      { title: agent.status, description: 'Status', style: { maxWidth: 200 } },
      { title: agent.ip, description: 'IP' },
      { title: agent.version, description: 'Version' },
      {
        title: agent.name,
        description: 'Operating system',
        style: { minWidth: 300 }
      },
      { title: agent.dateAdd, description: 'Registration date' },
      { title: agent.lastKeepAlive, description: 'Last keep alive' }
    ]);

    return (
      <Fragment>
        <EuiFlexGroup className="wz-welcome-page-agent-info-details">
          {stats}
        </EuiFlexGroup>
      </Fragment>
    );
  }
}
