/*
 * Wazuh app - React component for alerts stats.
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
import { visualizations } from '../../../components/visualize/visualizations';
import PropTypes from 'prop-types';
import { EuiStat, EuiFlexItem, EuiFlexGroup } from '@elastic/eui';
import { connect } from 'react-redux';

class AlertsStats extends Component {
  constructor(props) {
    super(props);
    this.visualizations = visualizations;
    this.state = {
      items: []
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.state) {
      nextProps.items.forEach(x => {
        x.value = nextProps.state[x.id] || '-';
      });
    }
    this.setState({
      items: nextProps.items
    });
  }

  buildStats() {
    const stats = (this.state.items || []).map(item => {
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

const mapStateToProps = state => {
  return {
    state: state.visualizationsReducers
  };
};

export default connect(mapStateToProps)(AlertsStats);

AlertsStats.propTypes = {
  items: PropTypes.array,
  tab: PropTypes.string
};
