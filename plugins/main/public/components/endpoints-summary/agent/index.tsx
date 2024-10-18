import React, { useState, useEffect } from 'react';
import { EuiPage, EuiPageBody, EuiProgress, EuiLink } from '@elastic/eui';
import { AgentsWelcome } from '../../common/welcome/agents-welcome';
import { MainSyscollector } from '../../agents/syscollector/main';
import { MainAgentStats } from '../../agents/stats';
import WzManagementConfiguration from '../../../controllers/management/components/management/configuration/configuration-main.js';
import {
  withErrorBoundary,
  withGuard,
  withRouteResolvers,
} from '../../common/hocs';
import { compose } from 'redux';
import { PinnedAgentManager } from '../../wz-agent-selector/wz-agent-selector-service';
import { MainModuleAgent } from '../../common/modules/main-agent';
import {
  enableMenu,
  ip,
  nestedResolve,
  savedSearch,
} from '../../../services/resolves';
import { useRouterSearch } from '../../common/hooks/use-router-search';
import { Redirect, Route, Switch } from '../../router-search';
import NavigationService from '../../../react-services/navigation-service';
import { connect } from 'react-redux';
import { PromptNoSelectedAgent } from '../../agents/prompts';
import { RedirectAppLinks } from '../../../../../../src/plugins/opensearch_dashboards_react/public';
import { getCore } from '../../../kibana-services';
import { endpointSummary } from '../../../utils/applications';
import { withAgentSync } from '../../common/hocs/withAgentSync';

const mapStateToProps = state => ({
  agent: state.appStateReducers?.currentAgentData,
});

export const AgentView = compose(
  withErrorBoundary,
  withRouteResolvers({ enableMenu, ip, nestedResolve, savedSearch }),
  connect(mapStateToProps),
  withAgentSync,
  withGuard(
    props => !(props.agent && props.agent.id),
    () => (
      <>
        <PromptNoSelectedAgent
          body={
            <>
              You need to select an agent or return to
              <RedirectAppLinks application={getCore().application}>
                <EuiLink
                  className='eui-textCenter'
                  aria-label='go to Endpoint summary'
                  href={`${endpointSummary.id}#${SECTIONS.AGENTS_PREVIEW}`}
                  onClick={() => NavigationService.getInstance().navigate(SECTIONS.AGENTS_PREVIEW)}
                >
                  Endpoint summary
                </EuiLink>
              </RedirectAppLinks>
            </>
          }
        />
      </>
    ),
  ),
)(({ agent: agentData }) => {
  const { tab = 'welcome' } = useRouterSearch();
  const navigationService = NavigationService.getInstance();

  //TODO: Replace with useDatasource and useSearchBar when replace WzDatePicker with SearchBar in AgentsWelcome component
  /* const savedTimefilter = $commonData.getTimefilter();
  if (savedTimefilter) {
    getDataPlugin().query.timefilter.timefilter.setTime(savedTimefilter);
    $commonData.removeTimefilter();
  } */

  const pinnedAgentManager = new PinnedAgentManager();

  const [isLoadingAgent, setIsLoadingAgent] = useState(true);

  const syncAgent = async () => {
    setIsLoadingAgent(true);
    await pinnedAgentManager.syncPinnedAgentSources();
    setIsLoadingAgent(false);
  };

  useEffect(() => {
    syncAgent();
  }, [tab]);

  const switchTab = (tab: string) => {
    navigationService.navigate(`/agents?tab=${tab}&agent=${agentData?.id}`);
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
      <Route path={`?tab=${AgentTabs.SOFTWARE}`}>
        <MainModuleAgent agent={agentData} section={tab} />
      </Route>
      <Route path={`?tab=${AgentTabs.NETWORK}`}>
        <MainModuleAgent agent={agentData} section={tab} />
      </Route>
      <Route path={`?tab=${AgentTabs.PROCESSES}`}>
        <MainModuleAgent agent={agentData} section={tab} />
      </Route>
      <Route path='?tab=syscollector'>
        <MainModuleAgent agent={agentData} section={tab} />
        <MainSyscollector agent={agentData} />
      </Route>
      <Route path={`?tab=${AgentTabs.STATS}`}>
        <MainModuleAgent agent={agentData} section={tab} />
        <MainAgentStats agent={agentData} />
      </Route>
      <Route path={`?tab=${AgentTabs.CONFIGURATION}`}>
        <MainModuleAgent agent={agentData} section={tab} />
        <WzManagementConfiguration agent={agentData} />
      </Route>
      <Route path='?tab=welcome'>
        <AgentsWelcome
          switchTab={switchTab}
          agent={agentData}
          pinAgent={pinnedAgentManager.pinAgent}
          unPinAgent={pinnedAgentManager.unPinAgent}
        />
      </Route>
      <Redirect to='?tab=welcome'></Redirect>
    </Switch>
  );
});
