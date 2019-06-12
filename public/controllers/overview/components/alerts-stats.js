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
