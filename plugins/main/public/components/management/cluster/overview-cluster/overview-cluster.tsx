import React from 'react';
import { compose } from 'redux';
import { ViewMode } from '../../../../../../../src/plugins/embeddable/public';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiPanel,
  EuiButtonIcon,
  EuiSpacer,
} from '@elastic/eui';
import { withErrorBoundary } from '../../../common/hocs';
import { getDashboardOverviewNodePanels } from '../visualizations/visualization-panels';
import { AppState } from '../../../../react-services';
import { ConfigurationsInfo } from '../common/configurations-info';

interface IConfigurationProps {
  disabled: boolean;
  hidden: boolean;
  name: string;
  node_name: string;
  node_type: string;
  bind_addr: string;
  nodes: object;
  port: string;
}

interface IOverviewClusterComponentProps {
  setShowConfig: Function;
  DashboardByRenderer: any;
  searchBarProps: any;
  handleFilterByVisualization: Function;
  configuration: IConfigurationProps;
}

const OverviewClusterComponent: React.FC<
  IOverviewClusterComponentProps
> = props => {
  const {
    DashboardByRenderer,
    searchBarProps,
    handleFilterByVisualization,
    configuration,
    setShowConfig,
  } = props;

  const goBack = () => {
    setShowConfig(false);
  };

  return (
    <>
      <EuiFlexGroup gutterSize='m'>
        <EuiFlexItem grow={false}>
          <EuiButtonIcon
            display='base'
            iconType='arrowLeft'
            aria-label='Back'
            size='m'
            iconSize='l'
            onClick={goBack}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiTitle size='m'>
            <h1>Overview</h1>
          </EuiTitle>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiFlexGroup>
        <EuiFlexItem>
          <DashboardByRenderer
            input={{
              viewMode: ViewMode.VIEW,
              panels: getDashboardOverviewNodePanels(
                AppState.getCurrentPattern(),
              ),
              isFullScreenMode: false,
              filters: searchBarProps.filters ?? [],
              useMargins: true,
              id: 'overview-cluster-tab',
              timeRange: {
                from: searchBarProps.dateRangeFrom,
                to: searchBarProps.dateRangeTo,
              },
              title: 'Overview cluster',
              description: 'Overview cluster',
              query: searchBarProps.query,
              refreshConfig: {
                pause: false,
                value: 15,
              },
              hidePanelTitles: false,
            }}
            onInputUpdated={handleFilterByVisualization}
          />
        </EuiFlexItem>
        {/* Cluster configuration card */}
        <EuiFlexItem>
          <EuiPanel style={{ margin: '8px' }}>
            <EuiTitle size='s'>
              <h1>Configuration</h1>
            </EuiTitle>
            <EuiSpacer size='m' />
            {/* Configuration options */}
            <ConfigurationsInfo
              keyValue='Disabled'
              value={configuration.disabled}
            />
            <ConfigurationsInfo
              keyValue='Hidden'
              value={configuration.hidden}
            />
            <ConfigurationsInfo keyValue='Name' value={configuration.name} />
            <ConfigurationsInfo
              keyValue='Node name'
              value={configuration.node_name}
            />
            <ConfigurationsInfo
              keyValue='Node type'
              value={configuration.node_type}
            />
            <ConfigurationsInfo
              keyValue='bind_addr'
              value={configuration.bind_addr}
            />
            <ConfigurationsInfo
              keyValue='IP'
              value={configuration.nodes?.[0] || '-'}
            />
            <ConfigurationsInfo keyValue='Port' value={configuration.port} />
          </EuiPanel>
        </EuiFlexItem>
      </EuiFlexGroup>
    </>
  );
};

export const OverviewCluster = compose(withErrorBoundary)(
  OverviewClusterComponent,
);
