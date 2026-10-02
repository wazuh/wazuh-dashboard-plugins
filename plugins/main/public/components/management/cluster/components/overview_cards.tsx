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
import '../dashboard/cluster_dashboard.scss';
import { formatUINumber } from '../../../../react-services/format-number';
import { i18n } from '@osd/i18n';

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
                    <h2>
                      {i18n.translate(
                        'wazuh.cluster.overviewCards.detailsTitle',
                        {
                          defaultMessage: 'Details',
                        },
                      )}
                    </h2>
                  </EuiTitle>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiButtonEmpty
                    color='primary'
                    size='s'
                    onClick={goConfiguration}
                    iconType='visPie'
                  >
                    {i18n.translate(
                      'wazuh.cluster.overviewCards.viewOverviewButton',
                      {
                        defaultMessage: 'View Overview',
                      },
                    )}
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
                  title: i18n.translate(
                    'wazuh.cluster.overviewCards.ipAddressLabel',
                    {
                      defaultMessage: 'IP address',
                    },
                  ),
                  description: configuration?.nodes[0] || '-',
                },
                {
                  title: i18n.translate(
                    'wazuh.cluster.overviewCards.versionLabel',
                    {
                      defaultMessage: 'Version',
                    },
                  ),
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
                <h2>
                  {i18n.translate(
                    'wazuh.cluster.overviewCards.informationTitle',
                    {
                      defaultMessage: 'Information',
                    },
                  )}
                </h2>
              </EuiTitle>
            }
          >
            <EuiDescriptionList
              type='column'
              compressed
              listItems={[
                {
                  title: i18n.translate(
                    'wazuh.cluster.overviewCards.nodesLabel',
                    {
                      defaultMessage: 'Nodes',
                    },
                  ),
                  description: (
                    <EuiToolTip
                      content={i18n.translate(
                        'wazuh.cluster.overviewCards.nodesTooltip',
                        { defaultMessage: 'Click to open the list of nodes' },
                      )}
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
                  title: i18n.translate(
                    'wazuh.cluster.overviewCards.agentsLabel',
                    {
                      defaultMessage: 'Agents',
                    },
                  ),
                  description: (
                    <EuiToolTip
                      content={i18n.translate(
                        'wazuh.cluster.overviewCards.agentsTooltip',
                        { defaultMessage: 'Click to open the list of agents' },
                      )}
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
