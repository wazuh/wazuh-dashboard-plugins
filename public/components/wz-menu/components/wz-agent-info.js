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

export class AgentInfo extends Component {
  constructor(props) {
    super(props);

    this.agent = {
      id: '002',
      status: 'Active',
      ip: 'X.X.X.X',
      version: 'Wazuh v3.12.3',
      name: 'CentOS Linux 7.6'
    };

    this.state = {};

    this

  }

  async componentDidMount() {
    const managerVersion = await WzRequest.apiReq('GET', '//', {});

    this.setState({
      managerVersion: (((managerVersion || {}).data || {}).data || {}).api_version || {}
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

  color = (status, hex = false) => {
    if (status.toLowerCase() === 'active') { return hex ? '#017D73' : 'success'; }
    else if (status.toLowerCase() === 'disconnected') { return hex ? '#BD271E' : 'danger'; }
    else if (status.toLowerCase() === 'never connected') { return hex ? '#98A2B3' : 'subdued'; }
  }

  addHealthRender(agent) {
    // this was rendered with a EuiHealth, but EuiHealth has a div wrapper, and this section is rendered  within a <p> tag. <div> tags aren't allowed within <p> tags.
    return (
      <span className="euiFlexGroup euiFlexGroup--gutterExtraSmall euiFlexGroup--alignItemsCenter euiFlexGroup--directionRow" style={{ paddingTop: 3, fontSize: '12px'}}>
        <span className="euiFlexItem euiFlexItem--flexGrowZero">
          <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" className={`euiIcon euiIcon--medium euiIcon--${this.color(this.agent.status)}`} focusable="false" role="img" aria-hidden="true">
            <circle cx="8" cy="8" r="4"></circle>
          </svg>
        </span>
        <span className="euiFlexItem euiFlexItem--flexGrowZero">{this.agent.status}</span>
      </span>
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
                'hola'
              ) : item.description === 'Status' ? (
                this.addHealthRender(this.agent)
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
    const stats = this.buildStats([
      { title: this.agent.id, description: 'ID', style: { maxWidth: 100 } },
      { title: this.agent.status, description: 'Status', style: { maxWidth: 200 } },
      { title: this.agent.version, description: 'Version' },
      {
        title: this.agent.name,
        description: 'Operating system',
        style: { }
      }
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
