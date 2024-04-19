import React, { useState, useEffect } from 'react';
import { EuiPage, EuiPageBody, EuiProgress } from '@elastic/eui';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { AgentsWelcome } from '../../common/welcome/agents-welcome';
import { Agent } from '../types';
import { getAngularModule, getDataPlugin } from '../../../kibana-services';
import { MainSyscollector } from '../../agents/syscollector/main';
import { MainAgentStats } from '../../agents/stats';
import WzManagementConfiguration from '../../../controllers/management/components/management/configuration/configuration-main.js';
import { getAgentsService } from '../services';
import { ShareAgent } from '../../../factories/share-agent';
import { FilterHandler } from '../../../utils/filter-handler';
import { AppState } from '../../../react-services';
import { TabVisualizations } from '../../../factories/tab-visualizations';
import store from '../../../redux/store';
import { updateCurrentAgentData } from '../../../redux/actions/appStateActions';

export const AgentView = () => {
  AppState.removeSessionStorageItem('configSubTab');

  const $injector = getAngularModule().$injector;

  const router = $injector.get('$route');
  const location = $injector.get('$location');
  const commonData = $injector.get('commonData');
  const visFactoryService = $injector.get('visFactoryService');
  const reportingService = $injector.get('reportingService');

  const shareAgent = new ShareAgent();

  const tabVisualizations = new TabVisualizations();

  const { agent: agentId } = router.current.params;

  const [agent, setAgent] = useState<Agent>();
  const [isLoadingAgent, setIsLoadingAgent] = useState(true);
  const [tab, setTab] = useState('welcome');
  const [tabview, setTabview] = useState();

  const init = async () => {
    const savedTimefilter = commonData.getTimefilter();
    if (savedTimefilter) {
      getDataPlugin().query.timefilter.timefilter.setTime(savedTimefilter);
      commonData.removeTimefilter();
    }

    location.search('_a', null);
    const filterHandler = new FilterHandler(AppState.getCurrentPattern());

    visFactoryService.clearAll();

    // Getting possible target location
    const targetLocation = shareAgent.getTargetLocation();

    setTabview(targetLocation?.tabview || commonData.checkTabViewLocation());
    setTab(targetLocation?.tab || commonData.checkTabLocation());

    //TODO: Investigate
    // this.tabHistory = [];
    // if (!this.ignoredTabs.includes(this.$scope.tab))
    //   this.tabHistory.push(this.$scope.tab);

    tabVisualizations.assign('agents');

    await getAgent();
  };

  const getAgent = async () => {
    try {
      setIsLoadingAgent(true);

      const globalAgent = new ShareAgent().getAgent();
      const id = commonData.checkLocationAgentId(agentId, globalAgent);

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
      store.dispatch(updateCurrentAgentData(agent));
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

  const goGroup = (agent, group) => {
    shareAgent.setAgent(agent, group);
    location.path('/manager/groups');
  };

  const exportConfiguration = enabledComponents => {
    reportingService.startConfigReport(agent, 'agentConfig', enabledComponents);
  };

  useEffect(() => {
    init();
    return () => {
      visFactoryService.clearAll();
    };
  }, []);

  const switchTab = async (tab: string, force = false) => {
    const timefilter = getDataPlugin().query.timefilter.timefilter;
    setTab(tab);
    // this.$rootScope.rendered = false;
    // this.$rootScope.$applyAsync();
    // this.falseAllExpand();
    // if (this.ignoredTabs.includes(tab)) {
    //   this.commonData.setRefreshInterval(timefilter.getRefreshInterval());
    //   timefilter.setRefreshInterval({
    //     pause: true,
    //     value: 0,
    //   });
    // } else if (this.ignoredTabs.includes(this.$scope.tab)) {
    //   timefilter.setRefreshInterval(this.commonData.getRefreshInterval());
    // }
    // // Update agent status
    // if (!force && this.$scope.agent) {
    //   try {
    //     const agentInfo = await WzRequest.apiReq('GET', '/agents', {
    //       params: {
    //         agents_list: this.$scope.agent.id,
    //         select: 'status',
    //       },
    //     });
    //     this.$scope.agent.status =
    //       agentInfo?.data?.data?.affected_items?.[0]?.status ||
    //       this.$scope.agent.status;
    //     this.$scope.$applyAsync();
    //   } catch (error) {
    //     throw new Error(error);
    //   }
    // }
    // try {
    //   if (tab === 'configuration') {
    //     this.$scope.switchConfigurationTab('welcome');
    //   } else {
    //     this.configurationHandler.reset(this.$scope);
    //   }
    //   if (!this.ignoredTabs.includes(tab)) this.tabHistory.push(tab);
    //   if (this.tabHistory.length > 2)
    //     this.tabHistory = this.tabHistory.slice(-2);
    //   if (this.$scope.tab === tab && !force) {
    //     this.$scope.$applyAsync();
    //     return;
    //   }
    //   const onlyAgent = this.$scope.tab === tab && force;
    //   const sameTab = this.$scope.tab === tab;
    //   this.$location.search('tab', tab);
    //   const preserveDiscover =
    //     this.tabHistory.length === 2 &&
    //     this.tabHistory[0] === this.tabHistory[1] &&
    //     !force;
    //   this.$scope.tab = tab;
    //   const targetSubTab =
    //     this.targetLocation && typeof this.targetLocation === 'object'
    //       ? this.targetLocation.subTab
    //       : 'panels';
    //   if (!this.ignoredTabs.includes(this.$scope.tab)) {
    //     this.$scope.switchSubtab(
    //       targetSubTab,
    //       true,
    //       onlyAgent,
    //       sameTab,
    //       preserveDiscover,
    //     );
    //   }
    //   this.shareAgent.deleteTargetLocation();
    //   this.targetLocation = null;
    //   this.$scope.$applyAsync();
    // } catch (error) {
    //   const options = {
    //     context: `${AgentsController.name}.switchTab`,
    //     level: UI_LOGGER_LEVELS.ERROR,
    //     severity: UI_ERROR_SEVERITIES.CRITICAL,
    //     store: true,
    //     error: {
    //       error: error,
    //       message: error.message || error,
    //       title: error.message || error,
    //     },
    //   };
    //   getErrorOrchestrator().handleError(options);
    // }
    // this.$scope.configurationTabsProps = {};
    // this.$scope.buildProps = tabs => {
    //   const cleanTabs = [];
    //   tabs.forEach(x => {
    //     if (
    //       this.$scope.configurationTab === 'integrity-monitoring' &&
    //       x.id === 'fim-whodata' &&
    //       x.agent &&
    //       x.agent.agentPlatform !== 'linux'
    //     )
    //       return;
    //     cleanTabs.push({
    //       id: x.id,
    //       name: x.name,
    //     });
    //   });
    //   this.$scope.configurationTabsProps = {
    //     clickAction: tab => {
    //       this.$scope.switchConfigurationSubTab(tab);
    //     },
    //     selectedTab:
    //       this.$scope.configurationSubTab || (tabs && tabs.length)
    //         ? tabs[0].id
    //         : '',
    //     tabs: cleanTabs,
    //   };
    // };
  };

  // if (error) {
  //   const options = {
  //     context: `AgentView.getAgent`,
  //     level: UI_LOGGER_LEVELS.ERROR,
  //     severity: UI_ERROR_SEVERITIES.CRITICAL,
  //     store: true,
  //     error: {
  //       error,
  //       message: error.message || error,
  //       title: `Could not get agent`,
  //     },
  //   };
  //   getErrorOrchestrator().handleError(options);
  // }

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
    return (
      <WzManagementConfiguration
        agent={agent}
        goGroups={goGroup}
        exportConfiguration={exportConfiguration}
      />
    );
  }
};
