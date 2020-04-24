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
  EuiToolTip,
  EuiButton
} from '@elastic/eui';

export class AgentInfo extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  addIconPlatformRender(agent) {
    let icon = false;
    const checkField = field => {
      return field !== undefined ? field : '-';
    };
    const os = (agent || {}).os;

    if (((os || {}).uname || '').includes('Linux')) {
      icon = 'linux';
    } else if ((os || {}).platform === 'windows') {
      icon = 'windows';
    } else if ((os || {}).platform === 'darwin') {
      icon = 'apple';
    }
    const os_name =
      checkField(((agent || {}).os || {}).name) +
      ' ' +
      checkField(((agent || {}).os || {}).version);

    return (
      <EuiToolTip position="bottom" content={os_name === '- -' ? '-' : os_name}>
        <span
          className="euiTableCellContent__text euiTableCellContent--truncateText"
          style={{ overflow: 'hidden', maxWidth: 250, margin: '0 auto' }}
        >
          <i
            className={`fa fa-${icon} AgentsTable__soBadge AgentsTable__soBadge--${icon}`}
            aria-hidden="true"
          ></i>
          {os_name === '- -' ? '-' : ' ' + os_name}
        </span>
      </EuiToolTip>
    );
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
              item.description === 'OS' ? (
                this.addIconPlatformRender(this.props.agent)
              ) : (
                <span
                  style={{
                    overflow: 'hidden',
                    maxWidth: 250,
                    margin: '0 auto'
                  }}
                >
                  {checkField(item.title)}
                </span>
              )
            }
            description={item.description}
            textAlign="center"
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
      { title: agent.ip, description: 'IP' },
      { title: agent.version, description: 'Version' },
      {
        title: agent.name,
        description: 'OS',
        style: { minWidth: 400 }
      },
      { title: agent.dateAdd, description: 'Registration date' },
      { title: agent.lastKeepAlive, description: 'Last keep alive' }
    ]);
    return (
      <Fragment>
        <EuiFlexGroup className="wz-welcome-page-agent-info-details">
          {stats}
        </EuiFlexGroup>
        <EuiFlexGroup className="wz-welcome-page-agent-info-actions">
          <EuiFlexItem grow={false} style={{ marginRight: 0 }}>
            <EuiButton
              onClick={() => this.props.switchTab('syscollector')}
              iconType="inspect"
            >
              Inventory data
            </EuiButton>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton
              onClick={() => this.props.switchTab('configuration')}
              iconType="gear"
            >
              Configuration
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </Fragment>
    );
  }
}
