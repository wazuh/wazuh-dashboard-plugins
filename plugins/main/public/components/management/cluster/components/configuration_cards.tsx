import React from 'react';
import {
  EuiFlexItem,
  EuiButtonIcon,
  EuiToolTip,
  EuiFlexGroup,
  EuiTitle,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
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
      label: {i18n.translate('wazuh.hidden', { defaultMessage: 'Hidden' })},
      value: String(configuration?.hidden),
    },
    {
      label: {i18n.translate('wazuh.name', { defaultMessage: 'Name' })},
      value: configuration?.name,
    },
    {
      label: {i18n.translate('wazuh.nodename', { defaultMessage: 'Node name' })},
      value: configuration?.node_name,
    },
    {
      label: {i18n.translate('wazuh.nodetype', { defaultMessage: 'Node type' })},
      value: configuration?.node_type,
    },
    {
      label: {i18n.translate('wazuh.bindaddress', { defaultMessage: 'Bind address' })},
      value: configuration?.bind_addr,
    },
    {
      label: {i18n.translate('wazuh.ip', { defaultMessage: 'IP' })},
      value: configuration?.nodes?.[0],
    },
    {
      label: {i18n.translate('wazuh.port', { defaultMessage: 'Port' })},
      value: configuration?.port,
    },
  ];

  return (
    <WzRibbonPanel>
      <WzRibbonTitle
        title={
          <EuiFlexGroup alignItems='center' gutterSize='s'>
            <EuiFlexItem grow={false}>
              <EuiToolTip content={i18n.translate('wazuh.goback', { defaultMessage: 'Go back' })} position='bottom'>
                <EuiButtonIcon
                  color='primary'
                  size='s'
                  display='empty'
                  iconType='arrowLeft'
                  aria-label={i18n.translate('wazuh.back', { defaultMessage: {i18n.translate('wazuh.back', { defaultMessage: 'Back' })} })}
                  onClick={goBack}
                />
              </EuiToolTip>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiTitle>
                <h2>{i18n.translate('wazuh.overview', { defaultMessage: 'Overview' })}</h2>
              </EuiTitle>
            </EuiFlexItem>
          </EuiFlexGroup>
        }
      />
      <WzRibbonBody items={configurationItemsList} />
    </WzRibbonPanel>
  );
};
