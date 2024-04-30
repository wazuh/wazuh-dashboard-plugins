import React from 'react';
import { AlertsDataSource } from '../../data-source/pattern/alerts/alerts-data-source';
import { AlertsDataSourceRepository } from '../../data-source/pattern/alerts/alerts-data-source-repository';
import { getPlugins } from '../../../../kibana-services';
import { getDashboardPanels } from './dashboard_panels';
import { ViewMode } from '../../../../../../../src/plugins/embeddable/public';
import { useDataSource } from '../../data-source/hooks';
import { PatternDataSource, tParsedIndexPattern } from '../../data-source';
import {
  EuiPanel,
  EuiFlexItem,
  EuiFlexGroup,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { useTimeFilter } from '../../hooks';
import { LoadingSpinner } from '../../loading-spinner/loading-spinner';

const plugins = getPlugins();
const DashboardByRenderer = plugins.dashboard.DashboardContainerByValueRenderer;

export const EventsCount = () => {
  const {
    dataSource,
    fetchFilters,
    isLoading: isDataSourceLoading,
  } = useDataSource<tParsedIndexPattern, PatternDataSource>({
    DataSource: AlertsDataSource,
    repository: new AlertsDataSourceRepository(),
  });

  const { timeFilter } = useTimeFilter();

  return (
    <EuiPanel paddingSize='s'>
      <EuiFlexItem>
        <EuiFlexGroup>
          <EuiFlexItem>
            <h2 className='embPanel__title wz-headline-title'>
              <EuiText size='xs'>
                <h2>Events count evolution</h2>
              </EuiText>
            </h2>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size='s' />
        {!isDataSourceLoading && dataSource ? (
          <DashboardByRenderer
            input={{
              viewMode: ViewMode.VIEW,
              panels: getDashboardPanels(dataSource?.id),
              isFullScreenMode: false,
              filters: fetchFilters ?? [],
              useMargins: true,
              id: 'agent-events-count-evolution',
              timeRange: {
                from: timeFilter.from,
                to: timeFilter.to,
              },
              title: 'Events count evolution',
              description: 'Dashboard of Events count evolution',
              refreshConfig: {
                pause: false,
                value: 15,
              },
              hidePanelTitles: true,
            }}
          />
        ) : (
          <LoadingSpinner />
        )}
      </EuiFlexItem>
    </EuiPanel>
  );
};
