import React from 'react';
import {
  EuiFlexItem,
  EuiButtonIcon,
  EuiCard,
  EuiDescriptionList,
  EuiSpacer,
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

interface ConfigurationCardsProps {
  goBack: () => void;
  configuration: any;
  searchBarProps: any;
  results: any;
  indexPatternId?: string;
  filters: tFilter[];
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
}: ConfigurationCardsProps) => {
  return (
    <EuiFlexGroup direction='column' gutterSize='s'>
      <EuiFlexItem>
        <EuiFlexGroup responsive={false} alignItems='center' gutterSize='s'>
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
        <EuiFlexGroup responsive alignItems='flexStart' gutterSize='s'>
          <EuiFlexItem
            grow={false}
            style={{
              minWidth: '500px',
              overflow: 'hidden',
              height: '100%',
            }}
          >
            {results?.hits?.total > 0 ? (
              <DashboardByRenderer
                input={{
                  viewMode: ViewMode.VIEW,
                  panels: getDashboardConfigurationPanels(indexPatternId),
                  isFullScreenMode: false,
                  filters: filters,
                  useMargins: true,
                  id: 'ct-dashboard-configuration-tab',
                  timeRange: {
                    from: searchBarProps.dateRangeFrom,
                    to: searchBarProps.dateRangeTo,
                  },
                  title: 'Cluster configuration dashboard',
                  description: 'Dashboard of the Cluster configuration',
                  query: searchBarProps.query,
                  refreshConfig: {
                    pause: false,
                    value: 15,
                  },
                  hidePanelTitles: false,
                }}
              />
            ) : (
              <DiscoverNoResults
                message='There are no results for selected time range. Try another
            one.'
              />
            )}
          </EuiFlexItem>
          <EuiFlexItem style={{ padding: '8px 0 0 0', height: '364px' }}>
            <EuiCard
              textAlign='left'
              title={
                <EuiTitle size='s'>
                  <h2>Configuration</h2>
                </EuiTitle>
              }
            >
              <EuiSpacer size='m' />
              <EuiDescriptionList
                type='column'
                compressed={true}
                align='left'
                listItems={[
                  {
                    title: (
                      <span style={{ fontWeight: 400, fontSize: '1rem' }}>
                        Disabled
                      </span>
                    ),
                    description: configuration?.disabled ? 'true' : 'false',
                  },
                  {
                    title: (
                      <span style={{ fontWeight: 400, fontSize: '1rem' }}>
                        Hidden
                      </span>
                    ),
                    description: configuration?.hidden ? 'true' : 'false',
                  },
                  {
                    title: (
                      <span style={{ fontWeight: 400, fontSize: '1rem' }}>
                        Name
                      </span>
                    ),
                    description: configuration?.name,
                  },
                  {
                    title: (
                      <span style={{ fontWeight: 400, fontSize: '1rem' }}>
                        Node name
                      </span>
                    ),
                    description: configuration?.node_name,
                  },
                  {
                    title: (
                      <span style={{ fontWeight: 400, fontSize: '1rem' }}>
                        Node type
                      </span>
                    ),
                    description: configuration?.node_type,
                  },
                  {
                    title: (
                      <span style={{ fontWeight: 400, fontSize: '1rem' }}>
                        Bind address
                      </span>
                    ),
                    description: configuration?.bind_addr,
                  },
                  {
                    title: (
                      <span style={{ fontWeight: 400, fontSize: '1rem' }}>
                        IP
                      </span>
                    ),
                    description: configuration?.nodes[0] || '-',
                  },
                  {
                    title: (
                      <span style={{ fontWeight: 400, fontSize: '1rem' }}>
                        Port
                      </span>
                    ),
                    description: configuration?.port,
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
        </EuiFlexGroup>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
