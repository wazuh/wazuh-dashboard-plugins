import React, { Component } from 'react';

import { EuiStat, EuiFlexItem, EuiFlexGroup } from '@elastic/eui';

export class AlertsStats extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  buildStats() {
    const stats = this.props.items.map(item => {
      return (
        <EuiFlexItem>
          <EuiStat
            title={item.value}
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
