import React from 'react';
import {
  EuiFlexItem,
  EuiButtonIcon,
  EuiCard,
  EuiText,
  EuiToolTip,
  EuiFlexGroup,
  EuiTitle,
} from '@elastic/eui';
import { ViewMode } from '../../../../../../../src/plugins/embeddable/public';
import { getPlugins } from '../../../../kibana-services';
import { DiscoverNoResults } from '../../../common/no-results/no-results';
import { getDashboardConfigurationPanels } from '../dashboard/dashboard_configuration_panels';
import '../dashboard/cluster_dashboard.scss';
import { tFilter } from '../../../common/data-source';
import { WzSearchBar } from '../../../common/search-bar';

interface ConfigurationCardsProps {
  goBack: () => void;
  configuration: any;
  searchBarProps: any;
  results: any;
  indexPatternId?: string;
  filters: tFilter[];
  lastReloadRequestTime: number;
}

const plugins = getPlugins();

const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

export const ConfigurationCards = ({
  goBack,
  configuration,
  searchBarProps,
  results,
  indexPatternId,
  filters,
  lastReloadRequestTime,
}: ConfigurationCardsProps) => {
  const configurationItemsList = [
    {
      title: 'Hidden',
      description: String(configuration?.hidden),
    },
    {
      title: 'Name',
      description: configuration?.name,
    },
    {
      title: 'Node name',
      description: configuration?.node_name,
    },
    {
      title: 'Node type',
      description: configuration?.node_type,
    },
    {
      title: 'Bind address',
      description: configuration?.bind_addr,
    },
    {
      title: 'IP',
      description: configuration?.nodes[0] || '-',
    },
    {
      title: 'Port',
      description: configuration?.port,
    },
  ];

  return (
    <EuiCard textAlign='left' style={{ paddingTop: '5px' }}>
      <EuiFlexGroup direction='column' gutterSize='l'>
        <EuiFlexItem>
          <EuiFlexGroup alignItems='center' gutterSize='s'>
            <EuiFlexItem grow={false}>
              <EuiToolTip content='Go back' position='bottom'>
                <EuiButtonIcon
                  color='primary'
                  size='m'
                  display='empty'
                  iconType='arrowLeft'
                  aria-label='Back'
                  onClick={goBack}
                />
              </EuiToolTip>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiTitle>
                <h2>Overview</h2>
              </EuiTitle>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFlexGroup direction='column' gutterSize='m'>
            <EuiFlexItem>
              <EuiTitle size='xs'>
                <h3>Configuration</h3>
              </EuiTitle>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiFlexGroup
                gutterSize='l'
                responsive={false}
                justifyContent='spaceBetween'
                style={{ marginRight: '20px' }}
              >
                {configurationItemsList.map((item, index) => (
                  <EuiFlexItem key={index} grow={false}>
                    <EuiFlexGroup
                      direction='row'
                      gutterSize='xs'
                      responsive={false}
                      alignItems='baseline'
                    >
                      <EuiFlexItem grow={false}>
                        <EuiText size='m'>
                          <strong>{item.title}:</strong>
                        </EuiText>
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiText size='s'>
                          <span style={{ color: '#69707D' }}>
                            {item.description}
                          </span>
                        </EuiText>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiFlexItem>
                ))}
              </EuiFlexGroup>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiCard>
  );
};
