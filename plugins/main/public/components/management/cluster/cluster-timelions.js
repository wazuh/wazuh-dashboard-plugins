import React, { Component } from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiPanel, EuiButtonIcon } from '@elastic/eui';
import WzReduxProvider from '../../../redux/wz-redux-provider';
import KibanaVis from '../../../kibana-integrations/kibana-vis';
import { compose } from 'redux';
import { withErrorBoundary, withReduxProvider } from '../../common/hocs';

export const ClusterTimelions = compose (withErrorBoundary,withReduxProvider) (class ClusterTimelions extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  expand = (id) => {
    this.setState({ expandedVis: this.state.expandedVis === id ? false : id });
  };

  render() {
    return (
      <EuiFlexGroup style={{ height: '450px' }}>
        <EuiFlexItem key={'Wazuh-App-Cluster-monitoring-Overview-Manager'}>
          <EuiPanel
            paddingSize="none"
            className={
              this.state.expandedVis === 'Wazuh-App-Cluster-monitoring-Overview-Manager'
                ? 'fullscreen h-100'
                : 'h-100'
            }
          >
            <EuiFlexItem className="h-100">
              <EuiFlexGroup style={{ padding: '12px 12px 0px' }} className="embPanel__header">
                <h2 className="embPanel__title wz-headline-title">{'Cluster alerts summary'}</h2>
                <EuiButtonIcon
                  color="text"
                  style={{ padding: '0px 6px', height: 30 }}
                  onClick={() => this.expand('Wazuh-App-Cluster-monitoring-Overview-Manager')}
                  iconType="expand"
                  aria-label="Expand"
                />
              </EuiFlexGroup>
              <div style={{ height: '100%' }}>
                <WzReduxProvider>
                  <KibanaVis
                    visID={'Wazuh-App-Cluster-monitoring-Overview-Manager'}
                    tab={'monitoring'}
                  ></KibanaVis>
                </WzReduxProvider>
              </div>
            </EuiFlexItem>
          </EuiPanel>
        </EuiFlexItem>
        <EuiFlexItem key={'Wazuh-App-Cluster-monitoring-Overview'}>
          <EuiPanel
            paddingSize="none"
            className={
              this.state.expandedVis === 'Wazuh-App-Cluster-monitoring-Overview'
                ? 'fullscreen h-100'
                : 'h-100'
            }
          >
            <EuiFlexItem className="h-100">
              <EuiFlexGroup style={{ padding: '12px 12px 0px' }} className="embPanel__header">
                <h2 className="embPanel__title wz-headline-title">{'Alerts by node summary'}</h2>
                <EuiButtonIcon
                  color="text"
                  style={{ padding: '0px 6px', height: 30 }}
                  onClick={() => this.expand('Wazuh-App-Cluster-monitoring-Overview')}
                  iconType="expand"
                  aria-label="Expand"
                />
              </EuiFlexGroup>
              <div style={{ height: '100%' }}>
                <WzReduxProvider>
                  <KibanaVis
                    visID={'Wazuh-App-Cluster-monitoring-Overview'}
                    tab={'monitoring'}
                  ></KibanaVis>
                </WzReduxProvider>
              </div>
            </EuiFlexItem>
          </EuiPanel>
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }
})
