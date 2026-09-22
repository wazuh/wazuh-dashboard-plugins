import React from 'react';
import {
  EuiFlexItem,
  EuiButtonIcon,
  EuiToolTip,
  EuiFlexGroup,
  EuiTitle,
} from '@elastic/eui';
import '../dashboard/cluster_dashboard.scss';
import {
  WzRibbonBody,
  WzRibbonPanel,
  WzRibbonTitle,
} from '../../../common/ribbon/ribbon';

interface ConfigurationCardsProps {
  goBack: () => void;
  configuration: any;
}

export const ConfigurationCards = ({
  goBack,
  configuration,
}: ConfigurationCardsProps) => {
  const configurationItemsList = [
    {
      key: 'hidden',
      label: 'Hidden',
      value: String(configuration?.hidden),
    },
    {
      key: 'name',
      label: 'Name',
      value: configuration?.name,
    },
    {
      key: 'node-name',
      label: 'Node name',
      value: configuration?.node_name,
    },
    {
      key: 'node-type',
      label: 'Node type',
      value: configuration?.node_type,
    },
    {
      key: 'bind-address',
      label: 'Bind address',
      value: configuration?.bind_addr,
    },
    {
      key: 'ip',
      label: 'IP',
      value: configuration?.nodes?.[0],
    },
    {
      key: 'port',
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
