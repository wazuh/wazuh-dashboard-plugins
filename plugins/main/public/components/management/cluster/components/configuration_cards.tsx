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
import { i18n } from '@osd/i18n';

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
      label: i18n.translate('wazuh.cluster.configurationCards.hiddenLabel', {
        defaultMessage: 'Hidden',
      }),
      value: String(configuration?.hidden),
    },
    {
      key: 'name',
      label: i18n.translate('wazuh.cluster.configurationCards.nameLabel', {
        defaultMessage: 'Name',
      }),
      value: configuration?.name,
    },
    {
      key: 'node-name',
      label: i18n.translate('wazuh.cluster.configurationCards.nodeNameLabel', {
        defaultMessage: 'Node name',
      }),
      value: configuration?.node_name,
    },
    {
      key: 'node-type',
      label: i18n.translate('wazuh.cluster.configurationCards.nodeTypeLabel', {
        defaultMessage: 'Node type',
      }),
      value: configuration?.node_type,
    },
    {
      key: 'bind-address',
      label: i18n.translate(
        'wazuh.cluster.configurationCards.bindAddressLabel',
        {
          defaultMessage: 'Bind address',
        },
      ),
      value: configuration?.bind_addr,
    },
    {
      key: 'ip',
      label: i18n.translate('wazuh.cluster.configurationCards.ipLabel', {
        defaultMessage: 'IP',
      }),
      value: configuration?.nodes?.[0],
    },
    {
      key: 'port',
      label: i18n.translate('wazuh.cluster.configurationCards.portLabel', {
        defaultMessage: 'Port',
      }),
      value: configuration?.port,
    },
  ];

  return (
    <WzRibbonPanel>
      <WzRibbonTitle
        title={
          <EuiFlexGroup alignItems='center' gutterSize='s'>
            <EuiFlexItem grow={false}>
              <EuiToolTip
                content={i18n.translate(
                  'wazuh.cluster.configurationCards.goBackTooltip',
                  { defaultMessage: 'Go back' },
                )}
                position='bottom'
              >
                <EuiButtonIcon
                  color='primary'
                  size='s'
                  display='empty'
                  iconType='arrowLeft'
                  aria-label={i18n.translate(
                    'wazuh.cluster.configurationCards.backAriaLabel',
                    { defaultMessage: 'Back' },
                  )}
                  onClick={goBack}
                />
              </EuiToolTip>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiTitle>
                <h2>
                  {i18n.translate('wazuh.cluster.configurationCards.title', {
                    defaultMessage: 'Overview',
                  })}
                </h2>
              </EuiTitle>
            </EuiFlexItem>
          </EuiFlexGroup>
        }
      />
      <WzRibbonBody items={configurationItemsList} />
    </WzRibbonPanel>
  );
};
