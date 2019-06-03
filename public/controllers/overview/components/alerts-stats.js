import React, { Component } from 'react';

import { EuiStat, EuiFlexItem, EuiFlexGroup } from '@elastic/eui';

export class AlertsStats extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    return (
      <div>
        <EuiFlexGroup>
          <EuiFlexItem />
          <EuiFlexItem>
            <EuiStat
              title={this.props.total}
              description="Alerts"
              titleColor="primary"
              textAlign="center"
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiStat
              title={this.props.highLevel}
              description="Level 12 or above alerts"
              titleColor="secondary"
              textAlign="center"
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiStat
              title={this.props.authFailure}
              description="Authentication failure"
              titleColor="danger"
              textAlign="center"
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiStat
              title={this.props.authSuccess}
              description="Authentication success"
              titleColor="accent"
              textAlign="center"
            />
          </EuiFlexItem>
          <EuiFlexItem />
        </EuiFlexGroup>
      </div>
    );
  }
}
