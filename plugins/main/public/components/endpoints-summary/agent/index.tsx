import React, { useState, useEffect } from 'react';
import { EuiPage, EuiPageBody, EuiProgress } from '@elastic/eui';
import { AgentsWelcome } from '../../common/welcome/agents-welcome';
import { Agent } from '../types';
import { getCore } from '../../../kibana-services';
import { MainSyscollector } from '../../agents/syscollector/main';
import { MainAgentStats } from '../../agents/stats';
import WzManagementConfiguration from '../../../controllers/management/components/management/configuration/configuration-main.js';
import { endpointSummary } from '../../../utils/applications';
import { withErrorBoundary, withRouteResolvers } from '../../common/hocs';
import { compose } from 'redux';
import { PinnedAgentManager } from '../../wz-agent-selector/wz-agent-selector-service';
import { MainModuleAgent } from '../../common/modules/main-agent';
import {
  enableMenu,
  ip,
  nestedResolve,
  savedSearch,
} from '../../../services/resolves';
import { useHistory } from 'react-router-dom';
import { useRouterSearch } from '../../common/hooks/use-router-search';
import { Redirect, Route, Switch } from '../../router-search';

export const AgentView = compose(
  withErrorBoundary,
  withRouteResolvers({ enableMenu, ip, nestedResolve, savedSearch }),
)(() => {
  const { tab = 'welcome' } = useRouterSearch();
  const history = useHistory();

  //TODO: Replace with useDatasource and useSearchBar when replace WzDatePicker with SearchBar in AgentsWelcome component
  /* const savedTimefilter = $commonData.getTimefilter();
  if (savedTimefilter) {
    getDataPlugin().query.timefilter.timefilter.setTime(savedTimefilter);
    $commonData.removeTimefilter();
  } */

  const pinnedAgentManager = new PinnedAgentManager();

  const [agent, setAgent] = useState<Agent>();
  const [isLoadingAgent, setIsLoadingAgent] = useState(true);

  const getAgent = async () => {
    setIsLoadingAgent(true);
    await pinnedAgentManager.syncPinnedAgentSources();
    const isPinnedAgent = pinnedAgentManager.isPinnedAgent();
    setAgent(isPinnedAgent ? pinnedAgentManager.getPinnedAgent() : null);
    setIsLoadingAgent(false);
  };

  useEffect(() => {
    getAgent();
  }, [tab]);

  const switchTab = (tab: string) => {
    history.push(`/agents?tab=${tab}&agent=${agent?.id}`);
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

  return (
    <Switch>
      <Route path='?tab=syscollector'>
        <MainModuleAgent agent={agent} section={tab} />
        <MainSyscollector agent={agent} />
      </Route>
      <Route path='?tab=stats'>
        <MainModuleAgent agent={agent} section={tab} />
        <MainAgentStats agent={agent} />
      </Route>
      <Route path='?tab=configuration'>
        <MainModuleAgent agent={agent} section={tab} />
        <MainAgentStats agent={agent} />
      </Route>
      <Route path='?tab=welcome'>
        <AgentsWelcome
          switchTab={switchTab}
          agent={agent}
          pinAgent={pinnedAgentManager.pinAgent}
          unPinAgent={pinnedAgentManager.unPinAgent}
        />
      </Route>
      <Redirect to='?tab=welcome'></Redirect>
    </Switch>
  );
});
