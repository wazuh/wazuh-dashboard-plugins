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
import { getPlugins } from '../../../../kibana-services';
import '../dashboard/cluster_dashboard.scss';
import { tFilter } from '../../../common/data-source';
import {
  WzRibbonBody,
  WzRibbonPanel,
  WzRibbonTitle,
} from '../../../common/ribbon/ribbon';

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
}: ConfigurationCardsProps) => {
  const configurationItemsList = [
    {
      label: 'Hidden',
      value: String(configuration?.hidden),
    },
    {
      label: 'Name',
      value: configuration?.name,
    },
    {
      label: 'Node name',
      value: configuration?.node_name,
    },
    {
      label: 'Node type',
      value: configuration?.node_type,
    },
    {
      label: 'Bind address',
      value: configuration?.bind_addr,
    },
    {
      label: 'IP',
      value: configuration?.nodes[0],
    },
    {
      label: 'Port',
      value: configuration?.port,
    },
  ];

  return (
    <WzRibbonPanel>
      <WzRibbonTitle
        title={
          <EuiFlexGroup alignItems='center' gutterSize='s'>
            <EuiFlexItem grow={false}>
              <EuiToolTip content='Go back' position='bottom'>
                <EuiButtonIcon
                  color='primary'
                  size='s'
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
        }
      />
      <WzRibbonBody items={configurationItemsList} />
    </WzRibbonPanel>
  );
};
