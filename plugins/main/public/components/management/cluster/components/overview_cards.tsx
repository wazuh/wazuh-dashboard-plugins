import React from 'react';
import {
  EuiFlexItem,
  EuiButtonEmpty,
  EuiCard,
  EuiDescriptionList,
  EuiToolTip,
  EuiFlexGroup,
  EuiTitle,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import '../dashboard/cluster_dashboard.scss';
import { formatUINumber } from '../../../../react-services/format-number';

interface OverviewCardsProps {
  goAgents: () => void;
  goNodes: () => void;
  goConfiguration: () => void;
  configuration: any;
  version: any;
  nodesCount: number;
  nodeList: any[];
  agentsCount: number;
}

export const OverviewCards = ({
  goAgents,
  goNodes,
  goConfiguration,
  configuration,
  version,
  nodesCount,
  agentsCount,
}: OverviewCardsProps) => {
  return (
    <>
      <EuiFlexGroup responsive gutterSize='s'>
        <EuiFlexItem>
          <EuiCard
            textAlign='left'
            title={
              <EuiFlexGroup
                alignItems='center'
                gutterSize='s'
                justifyContent='flexStart'
                responsive={false}
                wrap
              >
                <EuiFlexItem grow={false}>
                  <EuiTitle>
                    <h2>{i18n.translate('wazuh.details', { defaultMessage: 'Details' })}</h2>
                  </EuiTitle>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiButtonEmpty
                    color='primary'
                    size='s'
                    onClick={goConfiguration}
                    iconType='visPie'
                  >
                    View Overview
                  </EuiButtonEmpty>
                </EuiFlexItem>
              </EuiFlexGroup>
            }
          >
            <EuiDescriptionList
              type='responsiveColumn'
              compressed
              listItems={[
                {
                  title: {i18n.translate('wazuh.ipaddress', { defaultMessage: 'IP address' })},
                  description: configuration?.nodes[0] || '-',
                },
                {
                  title: {i18n.translate('wazuh.version', { defaultMessage: 'Version' })},
                  description: version ?? '-',
                },
              ]}
              titleProps={{
                className: 'cluster-descriptionList-title',
              }}
              descriptionProps={{
                className: 'color-grey cluster-descriptionList-description',
              }}
            />
          </EuiCard>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiCard
            textAlign='left'
            title={
              <EuiTitle>
                <h2>{i18n.translate('wazuh.information', { defaultMessage: 'Information' })}</h2>
              </EuiTitle>
            }
          >
            <EuiDescriptionList
              type='column'
              compressed
              listItems={[
                {
                  title: {i18n.translate('wazuh.nodes', { defaultMessage: 'Nodes' })},
                  description: (
                    <EuiToolTip
                      content='Click to open the list of nodes'
                      position='right'
                    >
                      <EuiButtonEmpty
                        color='primary'
                        flush='left'
                        onClick={goNodes}
                        style={{ height: 'auto' }}
                      >
                        {formatUINumber(nodesCount)}
                      </EuiButtonEmpty>
                    </EuiToolTip>
                  ),
                },
                {
                  title: {i18n.translate('wazuh.agents', { defaultMessage: 'Agents' })},
                  description: (
                    <EuiToolTip
                      content='Click to open the list of agents'
                      position='right'
                    >
                      <EuiButtonEmpty
                        color='primary'
                        flush='left'
                        onClick={goAgents}
                        style={{ height: 'auto' }}
                      >
                        {formatUINumber(agentsCount)}
                      </EuiButtonEmpty>
                    </EuiToolTip>
                  ),
                },
              ]}
              titleProps={{
                className: 'cluster-descriptionList-title',
              }}
              descriptionProps={{
                className: 'cluster-descriptionList-description',
              }}
            />
          </EuiCard>
        </EuiFlexItem>
      </EuiFlexGroup>
    </>
  );
};
