import React, { useState, useEffect } from 'react';
import { SearchResponse } from '../../../../../../../src/core/server';
import { IndexPattern } from '../../../../../../../src/plugins/data/common';
import { I18nProvider } from '@osd/i18n/react';
import useSearchBar from '../../../common/search-bar/use-search-bar';
import {
  ErrorFactory,
  ErrorHandler,
  HttpError,
} from '../../../../react-services/error-management';
import { LoadingSearchbarProgress } from '../../../common/loading-searchbar-progress/loading-searchbar-progress';
import { withErrorBoundary } from '../../../common/hocs/error-boundary/with-error-boundary';
import { EuiSpacer, EuiFlexItem } from '@elastic/eui';

import { OverviewCards } from '../components/overview_cards';
import { endpointSummary } from '../../../../utils/applications';
import { WzRequest } from '../../../../react-services';
import { ConfigurationCards } from '../components/configuration_cards';
import { NodeList } from '../node-list';
import NavigationService from '../../../../react-services/navigation-service';
import { useRouterSearch } from '../../../common/hooks';
import { UI_LOGGER_LEVELS } from '../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../react-services/error-orchestrator/types';
interface ClusterDashboardState {
  nodeList: any;
  configuration: any;
  version: any;
  nodesCount: number;
  agentsCount: number;
}

const DashboardCT: React.FC<{}> = () => {
  const navigationService = NavigationService.getInstance();
  const { tabView } = useRouterSearch();
  const showNodes = tabView === 'nodes';
  const showConfig = tabView === 'config';

  const [state, setState] = useState<ClusterDashboardState>({
    nodeList: [],
    configuration: undefined,
    version: undefined,
    nodesCount: 0,
    agentsCount: 0,
  });

  const switchClusterSubTab = (subTab: 'nodes' | 'config' | null) =>
    navigationService.updateAndNavigateSearchParams({
      tabView: subTab,
    });

  const goAgents = () => {
    navigationService.navigateToApp(endpointSummary.id, {
      path: '#/agents-preview',
    });
  };

  const goBack = () => {
    switchClusterSubTab(null);
  };

  const goNodes = () => {
    switchClusterSubTab('nodes');
  };

  const goConfiguration = () => {
    switchClusterSubTab('config');
  };

  useEffect(() => {
    const getData = async () => {
      const data = await Promise.allSettled([
        WzRequest.apiReq('GET', '/cluster/nodes', {}),
        WzRequest.apiReq('GET', '/cluster/local/config', {}),
        WzRequest.apiReq('GET', '/', {}),
        WzRequest.apiReq('GET', '/agents', {
          params: { limit: 1 },
        }),
        // WzRequest.apiReq('GET', '/cluster/healthcheck', {}), // Endpoint returns Internal Server Error
      ]);

      if (data[0].status === 'fulfilled') {
        const nodeList = data[0].value.data.data;
        setState(prevState => ({
          ...prevState,
          nodeList: nodeList.affected_items ?? [],
          nodesCount: nodeList.total_affected_items ?? 0,
        }));
      }
      if (data[1].status === 'fulfilled') {
        const clusterConfig = data[1].value.data.data;
        setState(prevState => ({
          ...prevState,
          configuration: clusterConfig.affected_items[0],
        }));
      }
      if (data[2].status === 'fulfilled') {
        const version = data[2].value.data.data;
        setState(prevState => ({
          ...prevState,
          version: version.api_version,
        }));
      }
      if (data[3].status === 'fulfilled') {
        const agents = data[3].value.data.data;
        setState(prevState => ({
          ...prevState,
          agentsCount: Number(agents.total_affected_items ?? 0),
        }));
      }

      const errors = data
        .filter(result => result.status === 'rejected')
        .map(result => result.reason);

      if (errors.length > 0) {
        errors.forEach(error => {
          const options = {
            context: 'StatusDashboard',
            level: UI_LOGGER_LEVELS.ERROR,
            severity: UI_ERROR_SEVERITIES.BUSINESS,
            display: true,
            store: false,
            error: {
              error: error,
              message: error.message || error,
              title: error.name || error,
            },
          };
          ErrorHandler.handleError(error, options);
        });
      }
    };

    getData();
  }, []);

  return (
    <I18nProvider>
      <EuiFlexItem>
        {!showConfig && !showNodes ? (
          <OverviewCards
            goNodes={goNodes}
            goAgents={goAgents}
            goConfiguration={goConfiguration}
            configuration={state?.configuration}
            version={state?.version}
            nodesCount={state?.nodesCount}
            nodeList={state?.nodeList}
            clusterName={state.configuration?.name}
            agentsCount={state?.agentsCount}
          />
        ) : null}
        {showConfig ? (
          <ConfigurationCards
            goBack={goBack}
            configuration={state?.configuration}
          />
        ) : null}
        {showNodes ? <NodeList goBack={goBack} /> : null}
      </EuiFlexItem>
    </I18nProvider>
  );
};

export const ClusterDashboard = withErrorBoundary(DashboardCT);
