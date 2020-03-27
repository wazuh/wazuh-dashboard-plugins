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
import React, { Component } from 'react';
import { EuiStat, EuiFlexItem, EuiFlexGroup, EuiPanel } from '@elastic/eui';

export class AgentInfo extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  buildStats(items) {
    const stats = items.map(item => {
      return (
        <EuiFlexItem key={item.description} style={item.style || null}>
          <EuiStat
            title={item.title}
            description={item.description}
            textAlign="center"
            titleSize="s"
            reverse
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
        title: agent.agentOS,
        description: 'OS',
        style: { minWidth: 400 }
      },
      { title: agent.dateAdd, description: 'Registration date' },
      { title: agent.lastKeepAlive, description: 'Last keep alive' }
    ]);
    return (
      <EuiPanel>
        <EuiFlexGroup>{stats}</EuiFlexGroup>
      </EuiPanel>
    );
  }
}
