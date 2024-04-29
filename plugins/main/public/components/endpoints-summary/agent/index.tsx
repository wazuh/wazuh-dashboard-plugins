import React, { useState, useEffect } from 'react';
import { EuiPage, EuiPageBody, EuiProgress } from '@elastic/eui';
import { useDispatch } from 'react-redux';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { AgentsWelcome } from '../../common/welcome/agents-welcome';
import { Agent } from '../types';
import {
  getAngularModule,
  getCore,
  getDataPlugin,
} from '../../../kibana-services';
import { MainSyscollector } from '../../agents/syscollector/main';
import { MainAgentStats } from '../../agents/stats';
import WzManagementConfiguration from '../../../controllers/management/components/management/configuration/configuration-main.js';
import { getAgentsService } from '../services';
import { ShareAgent } from '../../../factories/share-agent';
import { updateCurrentAgentData } from '../../../redux/actions/appStateActions';
import { endpointSummary } from '../../../utils/applications';
import { withErrorBoundary, withReduxProvider } from '../../common/hocs';
import { compose } from 'redux';

export const AgentView = compose(
  withErrorBoundary,
  withReduxProvider,
)(() => {
  //TODO: Replace when implement React router
  const $injector = getAngularModule().$injector;
  const $router = $injector.get('$route');
  const $commonData = $injector.get('commonData');

  const shareAgent = new ShareAgent();

  //TODO: Replace with useDatasource and useSearchBar when replace WzDatePicker with SearchBar in AgentsWelcome component
  const savedTimefilter = $commonData.getTimefilter();
  if (savedTimefilter) {
    getDataPlugin().query.timefilter.timefilter.setTime(savedTimefilter);
    $commonData.removeTimefilter();
  }

  const { agent: agentId } = $router.current.params;

  const [agent, setAgent] = useState<Agent>();
  const [isLoadingAgent, setIsLoadingAgent] = useState(true);
  const [tab, setTab] = useState<string>($commonData.checkTabLocation());
  const dispatch = useDispatch();

  const getAgent = async () => {
    try {
      setIsLoadingAgent(true);

      const id = $commonData.checkLocationAgentId(
        agentId,
        shareAgent.getAgent(),
      );

      if (!id) {
        return;
      }

      const { affected_items } = await getAgentsService({
        agents: [agentId],
      });
      if (!affected_items?.length) {
        throw 'Not found';
      }

      const agent = affected_items[0];
      setAgent(agent);
      dispatch(updateCurrentAgentData(agent));
    } catch (error) {
      const options = {
        context: `AgentView.getAgent`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.CRITICAL,
        store: true,
        error: {
          error,
          message: error.message || error,
          title: `Error getting the agent: ${error.message || error}`,
        },
      };
      getErrorOrchestrator().handleError(options);
    } finally {
      setIsLoadingAgent(false);
    }
  };

  useEffect(() => {
    getAgent();
  }, [tab]);

  const switchTab = (tab: string) => {
    setTab(tab);
    getCore().application.navigateToApp(endpointSummary.id, {
      path: `#/agents?tab=${tab}&agent=${agent?.id}`,
    });
  };

  if (isLoadingAgent) {
    return (
      <EuiPage paddingSize='m'>
        <EuiPageBody>
          <EuiProgress size='xs' color='primary' />
        </EuiPageBody>
      </EuiPage>
    );
  }

  if (tab === 'welcome') {
    return <AgentsWelcome switchTab={switchTab} setAgent={setAgent} />;
  }

  if (tab === 'syscollector' && agent) {
    return <MainSyscollector agent={agent} />;
  }

  if (tab === 'stats' && agent) {
    return <MainAgentStats agent={agent} />;
  }

  if (tab === 'configuration' && agent) {
    return <WzManagementConfiguration agent={agent} />;
  }
});
