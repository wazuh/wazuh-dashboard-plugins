import React, { useState, useEffect } from 'react';
import { EuiPage, EuiPageBody, EuiProgress } from '@elastic/eui';
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
import { endpointSummary } from '../../../utils/applications';
import { withErrorBoundary, withReduxProvider } from '../../common/hocs';
import { compose } from 'redux';
import { PinnedAgentManager } from '../../wz-agent-selector/wz-agent-selector-service';

export const AgentView = compose(
  withErrorBoundary,
  withReduxProvider,
)(() => {
  //TODO: Replace when implement React router
  const $injector = getAngularModule().$injector;
  const $commonData = $injector.get('commonData');

  //TODO: Replace with useDatasource and useSearchBar when replace WzDatePicker with SearchBar in AgentsWelcome component
  const savedTimefilter = $commonData.getTimefilter();
  if (savedTimefilter) {
    getDataPlugin().query.timefilter.timefilter.setTime(savedTimefilter);
    $commonData.removeTimefilter();
  }

  const pinnedAgentManager = new PinnedAgentManager();

  const [agent, setAgent] = useState<Agent>();
  const [isLoadingAgent, setIsLoadingAgent] = useState(true);
  const [tab, setTab] = useState<string>($commonData.checkTabLocation());

  const getAgent = async () => {
    await pinnedAgentManager.syncPinnedAgentSources();
    const isPinnedAgent = pinnedAgentManager.isPinnedAgent();
    setAgent(isPinnedAgent ? pinnedAgentManager.getPinnedAgent() : null);
  };

  useEffect(() => {
    setIsLoadingAgent(true);
    getAgent();
    setIsLoadingAgent(false);
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

  if (tab === 'syscollector' && agent) {
    return <MainSyscollector agent={agent} />;
  }

  if (tab === 'stats' && agent) {
    return <MainAgentStats agent={agent} />;
  }

  if (tab === 'configuration' && agent) {
    return <WzManagementConfiguration agent={agent} />;
  }

  return (
    <AgentsWelcome
      switchTab={switchTab}
      agent={agent}
      pinAgent={pinnedAgentManager.pinAgent}
      unPinAgent={pinnedAgentManager.unPinAgent}
    />
  );
});
