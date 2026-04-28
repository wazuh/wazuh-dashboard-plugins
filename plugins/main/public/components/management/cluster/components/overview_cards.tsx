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
                    <h2>Details</h2>
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
                  title: 'IP address',
                  description: configuration?.nodes[0] || '-',
                },
                {
                  title: 'Version',
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
                <h2>Information</h2>
              </EuiTitle>
            }
          >
            <EuiDescriptionList
              type='column'
              compressed
              listItems={[
                {
                  title: 'Nodes',
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
                  title: 'Agents',
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
