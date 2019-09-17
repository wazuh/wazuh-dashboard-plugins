/*
 * Wazuh app - React component for alerts stats.
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
import { EuiStat, EuiFlexItem, EuiFlexGroup } from '@elastic/eui';

export class AlertsStats extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  buildStats() {
    const stats = this.props.items.map(item => {
      const title = typeof item.value !== 'undefined' ? item.value : '-';
      return (
        <EuiFlexItem key={`${item.description}${title}`}>
          <EuiStat
            title={title}
            description={item.description}
            titleColor={item.color || 'primary'}
            textAlign="center"
          />
        </EuiFlexItem>
      );
    });
    return stats;
  }

  render() {
    const items = this.buildStats();
    return (
      <div>
        <EuiFlexGroup>
          <EuiFlexItem />
          {items}
          <EuiFlexItem />
        </EuiFlexGroup>
      </div>
    );
  }
}

AlertsStats.propTypes = {
  items: PropTypes.array
};
