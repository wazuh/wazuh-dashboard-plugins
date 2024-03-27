import React, { Component } from 'react';
import { compose } from 'redux';
import {
  withErrorBoundary,
  withGlobalBreadcrumb,
  withReduxProvider,
  withUserAuthorizationPrompt,
} from '../../../../../components/common/hocs';
import { cluster, endpointSummary } from '../../../../../utils/applications';
import {
  AppState,
  WazuhConfig,
  WzRequest,
} from '../../../../../react-services';
import { ShareAgent } from '../../../../../factories/share-agent';
import { getCore } from '../../../../../kibana-services';
import { TabVisualizations } from '../../../../../factories/tab-visualizations';
import { ClusterDisabled } from '../../../../../components/management/cluster/cluster-disabled';
import { ClusterDashboard } from '../../../../../components/management/cluster/dashboard/dashboard';

export const ClusterOverview = compose(
  withErrorBoundary,
  withReduxProvider,
  withGlobalBreadcrumb([{ text: cluster.breadcrumbLabel }]),
  withUserAuthorizationPrompt([
    { action: 'cluster:status', resource: '*:*:*' },
  ]),
)(
  class ClusterOverview extends Component {
    _isMount = false;
    wazuhConfig: any;
    shareAgent: any;
    tabVisualizations: any;
    nodeProps: any;

    constructor(props) {
      super(props);
      this.state = {
        loading: true,
        currentNode: null,
        nodeSearchTerm: '',
        authorized: true,
        clusterEnabled: false,
        isClusterRunning: false,
        statusRunning: 'no',
      };

      this.tabVisualizations = new TabVisualizations();
      this.wazuhConfig = new WazuhConfig();
      this.shareAgent = new ShareAgent();
      this.nodeProps = { goBack: () => this.goBack() };
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
      /* $location.search('tabView', 'cluster-monitoring');
      $location.search('tab', 'monitoring');
      $location.search('_a', null); */
      this.tabVisualizations.removeAll();
      this.tabVisualizations.setTab('monitoring');
      this.tabVisualizations.assign({
        monitoring: 2,
      });

      const status = await this.clusterStatus();
      const statusRunning = status?.data.data.running;
      this.setState({
        authorized: true,
        clusterEnabled: clusterEnabled,
        isClusterRunning: statusRunning === 'no' ? false : true,
        statusRunning,
        permissions: !status
          ? [{ action: 'cluster:status', resource: '*:*:*' }]
          : undefined,
        loading: false,
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
