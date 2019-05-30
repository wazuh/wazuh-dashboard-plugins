import React, { Component } from 'react';

import { EuiStat, EuiFlexItem, EuiFlexGroup, EuiPanel } from '@elastic/eui';

export class Stats extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    return (
      <EuiPanel betaBadgeLabel={this.props.name}>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiStat
              title={this.props.id}
              description="ID"
              textAlign="center"
              titleSize="s"
              reverse
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiStat
              title={this.props.ip}
              description="IP"
              textAlign="center"
              titleSize="s"
              reverse
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiStat
              title={this.props.version}
              description="Version"
              textAlign="center"
              titleSize="s"
              reverse
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiStat
              title={this.props.agentOS}
              description="OS"
              textAlign="center"
              titleSize="s"
              reverse
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiStat
              title={this.props.dateAdd}
              description="Registration date"
              textAlign="center"
              titleSize="s"
              reverse
            />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiStat
              title={this.props.lastKeepAlive}
              description="Last keep alive"
              textAlign="center"
              titleSize="s"
              reverse
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    );
  }
}
