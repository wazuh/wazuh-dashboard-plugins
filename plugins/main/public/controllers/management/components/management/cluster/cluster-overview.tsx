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
  authorized: boolean;
  clusterEnabled: boolean;
  isClusterRunning: boolean;
  statusRunning: string;
  permissions: any;
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
        authorized: true,
        clusterEnabled: false,
        isClusterRunning: false,
        statusRunning: 'no',
        permissions: undefined,
      };
    }

    clusterStatus = async () => {
      try {
        const status = await WzRequest.apiReq('GET', '/cluster/status', {});
        this.setState({
          authorized: true,
        });
        return status;
      } catch (error) {
        if (error === '3013 - Permission denied: Resource type: *:*')
          this.setState({
            authorized: false,
          });
      }
    };

    async componentDidMount() {
      this._isMount = true;
      const clusterEnabled =
        AppState.getClusterInfo() &&
        AppState.getClusterInfo().status === 'enabled';

      const status: any = await this.clusterStatus();
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
            {!this.state?.clusterEnabled ||
            !this.state?.isClusterRunning ||
            !this.state?.authorized ? (
              <ClusterDisabled
                enabled={this.state?.clusterEnabled}
                running={this.state?.isClusterRunning}
              />
            ) : null}
          </div>
          {this.state?.clusterEnabled &&
          this.state?.isClusterRunning &&
          this.state?.authorized ? (
            <ClusterDashboard statusRunning={this.state?.statusRunning} />
          ) : null}
        </>
      );
    }
  },
);
