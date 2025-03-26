import React, { useState, useEffect, useRef } from 'react';
import { EuiPage, EuiPageBody, EuiProgress, EuiLink } from '@elastic/eui';
import { AgentsWelcome } from '../../common/welcome/agents-welcome';
import { MainAgentStats } from '../../agents/stats';
import WzManagementConfiguration from '../../../controllers/management/components/management/configuration/configuration-main.js';
import {
  withErrorBoundary,
  withGlobalBreadcrumb,
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
import { AgentTabs } from './agent-tabs';
import { SECTIONS } from '../../../sections';

const mapStateToProps = state => ({
  agent: state.appStateReducers?.currentAgentData,
});

export const AgentView = compose(
  withErrorBoundary,
  withRouteResolvers({ enableMenu, ip, nestedResolve, savedSearch }),
  connect(mapStateToProps),
  withAgentSync,
  withGlobalBreadcrumb(() => {
    return [
      {
        text: endpointSummary.breadcrumbLabel,
        href: NavigationService.getInstance().getUrlForApp(endpointSummary.id, {
          path: `#/${SECTIONS.AGENTS_PREVIEW}`,
        }),
      },
    ];
  }),
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
                  onClick={() =>
                    NavigationService.getInstance().navigate(
                      SECTIONS.AGENTS_PREVIEW,
                    )
                  }
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
  const { tab = AgentTabs.WELCOME } = useRouterSearch();
  const navigationService = NavigationService.getInstance();

  //TODO: Replace with useDatasource and useSearchBar when replace WzDatePicker with SearchBar in AgentsWelcome component
  /* const savedTimefilter = $commonData.getTimefilter();
  if (savedTimefilter) {
    getDataPlugin().query.timefilter.timefilter.setTime(savedTimefilter);
    $commonData.removeTimefilter();
  } */

  const pinnedAgentManager = new PinnedAgentManager();

  const [isLoadingAgent, setIsLoadingAgent] = useState(false);
  const isMounted = useRef(false);

  const syncAgent = async () => {
    setIsLoadingAgent(true);
    await pinnedAgentManager.syncPinnedAgentSources();
    setIsLoadingAgent(false);
  };

  useEffect(() => {
    /* The component has the withAgentSync hook that synchronizes the agent data and this
    effect would trigger on mount causing the views are mounted 2 times, that causes problems with
    the views that are wrapped with index pattern creation due to conflict document errors (same index pattern could be tried to create despite it exist). Avoiding the effect is triggered on mount mitigates the problem or canceling the async operations (index patten validation/creation)
    */
    if (isMounted.current) {
      syncAgent();
    }
  }, [tab]);

  useEffect(() => {
    isMounted.current = true;
  }, []);

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

  const unPinAgent = () => {
    // remove the pinned agent from the URL
    navigationService.navigate(`/agents?tab=${tab}`);
  };

  return (
    <Switch>
      <Route path={`?tab=${AgentTabs.STATS}`}>
        <MainModuleAgent
          agent={agentData}
          section={tab}
          unPinAgent={unPinAgent}
        />
        <MainAgentStats agent={agentData} />
      </Route>
      <Route path={`?tab=${AgentTabs.CONFIGURATION}`}>
        <MainModuleAgent
          agent={agentData}
          section={tab}
          unPinAgent={unPinAgent}
        />
        <WzManagementConfiguration agent={agentData} />
      </Route>
      <Route path='?tab=welcome'>
        <AgentsWelcome
          switchTab={switchTab}
          agent={agentData}
          pinAgent={pinnedAgentManager.pinAgent}
          unPinAgent={unPinAgent}
        />
      </Route>
      <Redirect to='?tab=welcome'></Redirect>
    </Switch>
  );
});
