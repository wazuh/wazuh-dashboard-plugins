import React, { Component } from 'react';

// Eui components
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiPage,
  EuiSpacer
} from '@elastic/eui';

// Wazuh components
import RulesetTable from '../tables/ruleset-table';
import './layout-overview.scss';
import WzRestartClusterManagerCallout from '../../../../../../components/common/restart-cluster-manager-callout';

export default class WzLayoutOverview extends Component {
  constructor(props) {
    super(props);
    this.state = {
      totalItems: 0,
      showWarningRestart: false
    }
  }

  updateRestartManagers(showWarningRestart) {
    this.setState({ showWarningRestart });
  }

  render() {
    const { section, sectionName, clusterStatus } = this.props;
    return (
      <EuiPage style={{ background: 'transparent' }}>
        <EuiPanel>
          {this.state.showWarningRestart && (
            <>
              <EuiSpacer size='s' />
              <WzRestartClusterManagerCallout
                onRestarted={() => this.updateRestartManagers(false)}
                onRestartedError={() => this.updateRestartManagers(true)}
              />
              <EuiSpacer size='s' />
            </>
          )}
          <EuiFlexGroup>
            <EuiFlexItem>
              <RulesetTable
                clusterStatus={clusterStatus}
                request={section}
                title={sectionName}
                updateTotalItems={(totalItems) => this.setState({ totalItems })}
                updateRestartClusterManager={(showWarningRestart) => this.updateRestartManagers(showWarningRestart)}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
      </EuiPage>
    );
  }
}
