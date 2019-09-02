/*
 * Wazuh app - React component for showing agent fields such as IP, ID, name,
 * version, OS, registration date, last keep alive.
 *
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { EuiStat, EuiFlexItem, EuiFlexGroup, EuiPanel } from '@elastic/eui';

export class Stats extends Component {
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
    const stats = this.buildStats([
      { title: this.props.id, description: 'ID', style: { maxWidth: 100 } },
      { title: this.props.ip, description: 'IP' },
      { title: this.props.version, description: 'Version' },
      {
        title: this.props.agentOS,
        description: 'OS',
        style: { minWidth: 400 }
      },
      { title: this.props.dateAdd, description: 'Registration date' },
      { title: this.props.lastKeepAlive, description: 'Last keep alive' }
    ]);
    return (
      <EuiPanel betaBadgeLabel={this.props.name}>
        <EuiFlexGroup>{stats}</EuiFlexGroup>
      </EuiPanel>
    );
  }
}

Stats.propTypes = {
  id: PropTypes.string,
  ip: PropTypes.string,
  version: PropTypes.string,
  agentOS: PropTypes.string,
  dateAdd: PropTypes.any,
  lastKeepAlive: PropTypes.any,
  name: PropTypes.string
};
