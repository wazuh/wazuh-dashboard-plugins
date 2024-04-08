import React from 'react';
import {
  EuiFlexItem,
  EuiButtonEmpty,
  EuiCard,
  EuiDescriptionList,
  EuiSpacer,
  EuiToolTip,
  EuiFlexGroup,
  EuiTitle,
} from '@elastic/eui';
import { getDashboardPanels } from '../dashboard/dashboard_panels';
import { ViewMode } from '../../../../../../../src/plugins/embeddable/public';
import '../dashboard/cluster_dashboard.scss';
import { getPlugins } from '../../../../kibana-services';
import { DiscoverNoResults } from '../../../common/no-results/no-results';
import { tFilter } from '../../../common/data-source';

interface OverviewCardsProps {
  goAgents: () => void;
  goNodes: () => void;
  goConfiguration: () => void;
  configuration: any;
  status: any;
  version: any;
  nodesCount: number;
  nodeList: any[];
  agentsCount: number;
  searchBarProps: any;
  results: any;
  indexPatternId: string;
  clusterName?: string;
  filters: tFilter[];
}

const plugins = getPlugins();

const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

export const OverviewCards = ({
  goAgents,
  goNodes,
  goConfiguration,
  configuration,
  status,
  version,
  nodesCount,
  nodeList,
  agentsCount,
  searchBarProps,
  results,
  indexPatternId,
  clusterName,
  filters,
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
                  <EuiTitle size='s'>
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
            <EuiSpacer size='m' />
            <EuiDescriptionList
              type='responsiveColumn'
              compressed
              listItems={[
                {
                  title: 'IP address',
                  description: configuration?.nodes[0] || '-',
                },
                {
                  title: 'Running',
                  description: status ?? 'no',
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
              <span className='euiTitle euiTitle--small euiCard__title'>
                Information
              </span>
            }
          >
            <EuiSpacer size='m' />
            <EuiDescriptionList
              type='column'
              compressed
              listItems={[
                {
                  title: (
                    <EuiToolTip
                      content='Click to open the list of nodes'
                      position='left'
                    >
                      <EuiButtonEmpty
                        color='primary'
                        flush='left'
                        onClick={goNodes}
                        style={{ height: 'auto' }}
                      >
                        Nodes
                      </EuiButtonEmpty>
                    </EuiToolTip>
                  ),
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
                        {nodesCount}
                      </EuiButtonEmpty>
                    </EuiToolTip>
                  ),
                },
                {
                  title: (
                    <EuiToolTip
                      content='Click to open the list of agents'
                      position='left'
                    >
                      <EuiButtonEmpty
                        color='primary'
                        flush='left'
                        onClick={goAgents}
                        style={{ height: 'auto' }}
                      >
                        Agents
                      </EuiButtonEmpty>
                    </EuiToolTip>
                  ),
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
                        {agentsCount}
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
      {results?.hits?.total > 0 ? (
        <div className='ct-dashboard-responsive'>
          <DashboardByRenderer
            input={{
              viewMode: ViewMode.VIEW,
              panels: getDashboardPanels(indexPatternId, nodeList, clusterName),
              isFullScreenMode: false,
              filters: filters,
              useMargins: true,
              id: 'ct-dashboard-tab',
              timeRange: {
                from: searchBarProps.dateRangeFrom,
                to: searchBarProps.dateRangeTo,
              },
              title: 'Cluster Timelions dashboard',
              description: 'Dashboard of the Cluster Timelions',
              query: searchBarProps.query,
              refreshConfig: {
                pause: false,
                value: 15,
              },
              hidePanelTitles: false,
            }}
          />
        </div>
      ) : (
        <DiscoverNoResults
          message='There are no results for selected time range. Try another
            one.'
        />
      )}
    </>
  );
};
