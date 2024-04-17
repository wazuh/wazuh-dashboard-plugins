import React, { Component } from 'react';
import { compose } from 'redux';
import {
  withErrorBoundary,
  withGlobalBreadcrumb,
  withGuardAsync,
  withReduxProvider,
  withUserAuthorizationPrompt,
} from '../../../../../components/common/hocs';
import { cluster } from '../../../../../utils/applications';
import { AppState, WzRequest } from '../../../../../react-services';
import { ClusterDisabled } from '../../../../../components/management/cluster/cluster-disabled';
import { ClusterDashboard } from '../../../../../components/management/cluster/dashboard/dashboard';
import { LoadingSpinner } from '../../../../../components/common/loading-spinner/loading-spinner';
import { FormattedMessage } from '@osd/i18n/react';

interface ClusterOverviewState {
  clusterEnabled: boolean;
  isClusterRunning: boolean;
  statusRunning: string;
}

const checkClusterIsEnabledAndRunning = async () => {
  try {
    const status: any = await WzRequest.apiReq('GET', '/cluster/status', {});
    const clusterEnabled = status?.data?.data?.enabled;
    const statusRunning = status?.data?.data?.running;
    const isClusterRunning = statusRunning === 'yes';
    return {
      ok: !Boolean(clusterEnabled && statusRunning),
      data: {
        clusterEnabled,
        isClusterRunning,
        statusRunning,
      },
    };
  } catch (error) {
    return {
      ok: true,
      data: {
        error,
      },
    };
  }
};

export const ClusterOverview = compose(
  withErrorBoundary,
  withReduxProvider,
  withGlobalBreadcrumb([{ text: cluster.breadcrumbLabel }]),
  withUserAuthorizationPrompt([
    { action: 'cluster:status', resource: '*:*:*' },
  ]),
  withGuardAsync(
    checkClusterIsEnabledAndRunning,
    ({ clusterEnabled, isClusterRunning }) => (
      <ClusterDisabled enabled={clusterEnabled} running={isClusterRunning} />
    ),
    () => (
      <LoadingSpinner
        message={
          <FormattedMessage
            id='module.cluster.checking'
            defaultMessage='Checking if cluster is enabled and running...'
          />
        }
      />
    ),
  ),
)(
  class ClusterOverview extends Component<ClusterOverviewState> {
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
          {this.props?.clusterEnabled && this.props?.isClusterRunning ? (
            <ClusterDashboard statusRunning={this.props?.statusRunning} />
          ) : null}
        </>
      );
    }
  },
);
