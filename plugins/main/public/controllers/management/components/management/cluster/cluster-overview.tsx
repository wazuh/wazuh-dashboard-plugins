import React, { Component } from 'react';
import { compose } from 'redux';
import {
  withErrorBoundary,
  withGlobalBreadcrumb,
  withReduxProvider,
  withUserAuthorizationPrompt,
} from '../../../../../components/common/hocs';
import { cluster } from '../../../../../utils/applications';
import { AppState, WzRequest } from '../../../../../react-services';
import { ClusterDisabled } from '../../../../../components/management/cluster/cluster-disabled';
import { ClusterDashboard } from '../../../../../components/management/cluster/dashboard/dashboard';

interface ClusterOverviewState {
  clusterEnabled: boolean;
  isClusterRunning: boolean;
  statusRunning: string;
}

export const ClusterOverview = compose(
  withErrorBoundary,
  withReduxProvider,
  withGlobalBreadcrumb([{ text: cluster.breadcrumbLabel }]),
  withUserAuthorizationPrompt([
    { action: 'cluster:status', resource: '*:*:*' },
  ]),
)(
  class ClusterOverview extends Component<unknown, ClusterOverviewState> {
    _isMount = false;

    constructor(props) {
      super(props);
      this.state = {
        clusterEnabled: false,
        isClusterRunning: false,
        statusRunning: 'no',
      };
    }

    async componentDidMount() {
      this._isMount = true;
      const clusterEnabled =
        AppState.getClusterInfo() &&
        AppState.getClusterInfo().status === 'enabled';

      const status: any = await WzRequest.apiReq('GET', '/cluster/status', {});
      const statusRunning = status?.data?.data?.running;
      this.setState({
        clusterEnabled: clusterEnabled,
        isClusterRunning: statusRunning === 'no' ? false : true,
        statusRunning,
      });
    }

    componentWillUnmount() {
      this._isMount = false;
    }

    render() {
      return (
        <>
          <div style={{ padding: '16px' }}>
            {!this.state?.clusterEnabled || !this.state?.isClusterRunning ? (
              <ClusterDisabled
                enabled={this.state?.clusterEnabled}
                running={this.state?.isClusterRunning}
              />
            ) : null}
          </div>
          {this.state?.clusterEnabled && this.state?.isClusterRunning ? (
            <ClusterDashboard statusRunning={this.state?.statusRunning} />
          ) : null}
        </>
      );
    }
  },
);
