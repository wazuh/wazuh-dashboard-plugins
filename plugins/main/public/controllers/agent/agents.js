/*
 * Wazuh app - Agents controller
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { FilterHandler } from '../../utils/filter-handler';
import { TabNames } from '../../utils/tab-names';
import { visualizations } from '../../templates/agents/visualizations';

import { ConfigurationHandler } from '../../utils/config-handler';
import { AppState } from '../../react-services/app-state';
import { WazuhConfig } from '../../react-services/wazuh-config';
import { GenericRequest } from '../../react-services/generic-request';
import { WzRequest } from '../../react-services/wz-request';
import {
  getToasts,
  getDataPlugin,
  getWazuhCorePlugin,
} from '../../kibana-services';
import { ShareAgent } from '../../factories/share-agent';
import { TabVisualizations } from '../../factories/tab-visualizations';
import { formatUIDate } from '../../react-services/time-service';
import { hasAgentSupportModule } from '../../react-services/wz-agents';
import { UI_LOGGER_LEVELS } from '../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../react-services/common-services';
import { updateCurrentAgentData } from '../../redux/actions/appStateActions';
import store from '../../redux/store';

export class AgentsController {
  /**
   * Class constructor
   * @param {Object} $scope
   * @param {Object} $location
   * @param {Object} $rootScope
   * @param {Object} errorHandler
   * @param {Object} commonData
   * @param {Object} reportingService
   * @param {Object} visFactoryService
   * @param {Object} csvReq
   */
  constructor(
    $scope,
    $location,
    $rootScope,
    errorHandler,
    commonData,
    reportingService,
    visFactoryService,
    csvReq,
  ) {
    this.$scope = $scope;
    this.$location = $location;
    this.$rootScope = $rootScope;
    this.errorHandler = errorHandler;
    this.tabVisualizations = new TabVisualizations();
    this.$scope.visualizations = visualizations;
    this.shareAgent = new ShareAgent();
    this.commonData = commonData;
    this.reportingService = reportingService;
    this.visFactoryService = visFactoryService;
    this.csvReq = csvReq;
    this.wazuhConfig = new WazuhConfig();
    this.genericReq = GenericRequest;

    // Config on-demand
    this.$scope.isArray = Array.isArray;
    this.configurationHandler = new ConfigurationHandler(errorHandler);
    this.$scope.currentConfig = null;
    this.$scope.configurationTab = '';
    this.$scope.configurationSubTab = '';
    this.$scope.integrations = {};
    this.$scope.selectedItem = 0;
    this.targetLocation = null;
    this.ignoredTabs = ['syscollector', 'welcome', 'configuration', 'stats'];

    this.$scope.expandArray = [
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ];

    this.loadWelcomeCardsProps();
    this.$scope.getWelcomeCardsProps = resultState => {
      return { ...this.$scope.welcomeCardsProps, resultState };
    };
  }

  /**
   * On controller loads
   */
  async $onInit() {
    const savedTimefilter = this.commonData.getTimefilter();
    if (savedTimefilter) {
      getDataPlugin().query.timefilter.timefilter.setTime(savedTimefilter);
      this.commonData.removeTimefilter();
    }

    this.$rootScope.reportStatus = false;

    this.$location.search('_a', null);
    this.filterHandler = new FilterHandler(AppState.getCurrentPattern());
    this.visFactoryService.clearAll();

    // Getting possible target location
    this.targetLocation = this.shareAgent.getTargetLocation();

    if (this.targetLocation && typeof this.targetLocation === 'object') {
      this.$scope.tabView = this.targetLocation.subTab;
      this.$scope.tab = this.targetLocation.tab;
    } else {
      this.$scope.tabView = this.commonData.checkTabViewLocation();
      this.$scope.tab = this.commonData.checkTabLocation();
    }
    this.tabHistory = [];
    if (!this.ignoredTabs.includes(this.$scope.tab))
      this.tabHistory.push(this.$scope.tab);

    // Tab names
    this.$scope.tabNames = TabNames;

    this.tabVisualizations.assign('agents');

    /**
     * This check if given array of items contais a single given item
     * @param {Object} item
     * @param {Array<Object>} array
     */
    this.$scope.inArray = (item, array) =>
      item && Array.isArray(array) && array.includes(item);

    this.$scope.switchSubtab = async (
      subtab,
      force = false,
      onlyAgent = false,
    ) => this.switchSubtab(subtab, force, onlyAgent);

    this.changeAgent = false;

    this.$scope.switchTab = (tab, force = false) => this.switchTab(tab, force);
    this.$scope.getAgent = async newAgentId => this.getAgent(newAgentId);
    this.$scope.goGroups = (agent, group) => this.goGroups(agent, group);

    this.$scope.search = (term, specificPath) =>
      this.$scope.$broadcast('wazuhSearch', {
        term,
        specificPath,
      });

    this.$scope.searchSyscheckFile = (term, specificFilter) =>
      this.$scope.$broadcast('wazuhSearch', {
        term,
        specificFilter,
      });

    this.$scope.searchRootcheck = (term, specificFilter) =>
      this.$scope.$broadcast('wazuhSearch', {
        term,
        specificFilter,
      });

    this.$scope.shouldShowComponent = component =>
      this.shouldShowComponent(component);

    this.$scope.$on('$destroy', () => {
      this.visFactoryService.clearAll();
    });

    this.$scope.isArray = Array.isArray;

    this.$scope.goGroup = () => {
      this.shareAgent.setAgent(this.$scope.agent);
      this.$location.path('/manager/groups');
    };

    this.$scope.exportConfiguration = enabledComponents => {
      this.reportingService.startConfigReport(
        this.$scope.agent,
        'agentConfig',
        enabledComponents,
      );
    };

    //Load
    try {
      this.$scope.getAgent();
    } catch (error) {
      const options = {
        context: `${AgentsController.name}.$onInit`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        error: {
          error: error,
          message: error.message || error,
          title: `Error getting the agent: ${error.message || error}`,
        },
      };
      getErrorOrchestrator().handleError(options);
    }

    // Config on demand
    this.$scope.getXML = () => this.configurationHandler.getXML(this.$scope);
    this.$scope.getJSON = () => this.configurationHandler.getJSON(this.$scope);
    this.$scope.isString = item => typeof item === 'string';
    this.$scope.hasSize = obj =>
      obj && typeof obj === 'object' && Object.keys(obj).length;
    this.$scope.offsetTimestamp = (text, time) =>
      this.offsetTimestamp(text, time);
    this.$scope.switchConfigTab = (
      configurationTab,
      sections,
      navigate = true,
    ) => {
      this.$scope.navigate = navigate;
      try {
        this.$scope.configSubTab = JSON.stringify({
          configurationTab: configurationTab,
          sections: sections,
        });
        if (!this.$location.search().configSubTab) {
          AppState.setSessionStorageItem(
            'configSubTab',
            this.$scope.configSubTab,
          );
          this.$location.search('configSubTab', true);
        }
      } catch (error) {
        const options = {
          context: `${AgentsController.name}.switchConfigTab`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          store: true,
          error: {
            error: error,
            message: error.message || error,
            title: `${error.message || error} Set configuration path`,
          },
        };
        getErrorOrchestrator().handleError(options);
      }
      this.configurationHandler.switchConfigTab(
        configurationTab,
        sections,
        this.$scope,
        this.$scope.agent.id,
      );
    };

    this.$scope.switchWodle = (wodleName, navigate = true) => {
      this.$scope.navigate = navigate;
      this.$scope.configWodle = wodleName;
      if (!this.$location.search().configWodle) {
        this.$location.search('configWodle', this.$scope.configWodle);
      }
      this.configurationHandler.switchWodle(
        wodleName,
        this.$scope,
        this.$scope.agent.id,
      );
    };

    this.$scope.switchConfigurationTab = (configurationTab, navigate) => {
      this.$scope.navigate = navigate;
      this.configurationHandler.switchConfigurationTab(
        configurationTab,
        this.$scope,
      );
      if (!this.$scope.navigate) {
        const configSubTab = this.$location.search().configSubTab;
        if (configSubTab) {
          try {
            const config = AppState.getSessionStorageItem('configSubTab');
            const configSubTabObj = JSON.parse(config);
            this.$scope.switchConfigTab(
              configSubTabObj.configurationTab,
              configSubTabObj.sections,
              false,
            );
          } catch (error) {
            throw new Error(error);
          }
        } else {
          const configWodle = this.$location.search().configWodle;
          if (configWodle) {
            this.$scope.switchWodle(configWodle, false);
          }
        }
      } else {
        this.$location.search('configSubTab', null);
        AppState.removeSessionStorageItem('configSubTab');
        this.$location.search('configWodle', null);
      }
    };
    this.$scope.switchConfigurationSubTab = configurationSubTab => {
      this.configurationHandler.switchConfigurationSubTab(
        configurationSubTab,
        this.$scope,
      );
      if (configurationSubTab === 'pm-sca') {
        this.$scope.currentConfig.sca = this.configurationHandler.parseWodle(
          this.$scope.currentConfig,
          'sca',
        );
      }
    };
    this.$scope.updateSelectedItem = i => (this.$scope.selectedItem = i);
    this.$scope.getIntegration = list =>
      this.configurationHandler.getIntegration(list, this.$scope);

    this.$scope.$on('$routeChangeStart', () => {
      return AppState.removeSessionStorageItem('configSubTab');
    });

    this.$scope.expand = i => this.expand(i);
    this.setTabs();
  }

  // Switch subtab
  async switchSubtab(subtab, force = false, onlyAgent = false) {
    try {
      if (this.$scope.tabView === subtab && !force) return;
      this.tabVisualizations.clearDeadVis();
      this.visFactoryService.clear(onlyAgent);
      this.$location.search('tabView', subtab);
      if (
        (subtab === 'panels' ||
          (this.targetLocation &&
            typeof this.targetLocation === 'object' &&
            this.targetLocation.subTab === 'discover' &&
            subtab === 'discover')) &&
        !this.ignoredTabs.includes(this.$scope.tab)
      ) {
        await this.visFactoryService.buildAgentsVisualizations(
          this.filterHandler,
          this.$scope.tab,
          subtab,
          this.$scope.agent.id,
        );

        this.changeAgent = false;
      } else {
        this.$scope.$emit('changeTabView', {
          tabView: subtab,
          tab: this.$scope.tab,
        });
      }
      this.$scope.tabView = subtab;
    } catch (error) {
      throw new Error(error);
    }
  }

  /**
   * Switch tab
   * @param {*} tab
   * @param {*} force
   */
  async switchTab(tab, force = false) {
    const timefilter = getDataPlugin().query.timefilter.timefilter;
    this.tabVisualizations.setTab(tab);
    this.$rootScope.rendered = false;
    this.$rootScope.$applyAsync();
    this.falseAllExpand();
    if (this.ignoredTabs.includes(tab)) {
      this.commonData.setRefreshInterval(timefilter.getRefreshInterval());
      timefilter.setRefreshInterval({
        pause: true,
        value: 0,
      });
    } else if (this.ignoredTabs.includes(this.$scope.tab)) {
      timefilter.setRefreshInterval(this.commonData.getRefreshInterval());
    }

    // Update agent status
    if (!force && this.$scope.agent) {
      try {
        const agentInfo = await WzRequest.apiReq('GET', '/agents', {
          params: {
            agents_list: this.$scope.agent.id,
            select: 'status',
          },
        });
        this.$scope.agent.status =
          agentInfo?.data?.data?.affected_items?.[0]?.status ||
          this.$scope.agent.status;

        this.$scope.$applyAsync();
      } catch (error) {
        throw new Error(error);
      }
    }

    try {
      if (tab === 'configuration') {
        this.$scope.switchConfigurationTab('welcome');
      } else {
        this.configurationHandler.reset(this.$scope);
      }

      if (!this.ignoredTabs.includes(tab)) this.tabHistory.push(tab);
      if (this.tabHistory.length > 2)
        this.tabHistory = this.tabHistory.slice(-2);

      if (this.$scope.tab === tab && !force) {
        this.$scope.$applyAsync();
        return;
      }

      const onlyAgent = this.$scope.tab === tab && force;
      const sameTab = this.$scope.tab === tab;
      this.$location.search('tab', tab);
      const preserveDiscover =
        this.tabHistory.length === 2 &&
        this.tabHistory[0] === this.tabHistory[1] &&
        !force;
      this.$scope.tab = tab;

      const targetSubTab =
        this.targetLocation && typeof this.targetLocation === 'object'
          ? this.targetLocation.subTab
          : 'panels';

      if (!this.ignoredTabs.includes(this.$scope.tab)) {
        this.$scope.switchSubtab(
          targetSubTab,
          true,
          onlyAgent,
          sameTab,
          preserveDiscover,
        );
      }

      this.shareAgent.deleteTargetLocation();
      this.targetLocation = null;
      this.$scope.$applyAsync();
    } catch (error) {
      const options = {
        context: `${AgentsController.name}.switchTab`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.CRITICAL,
        store: true,
        error: {
          error: error,
          message: error.message || error,
          title: error.message || error,
        },
      };
      getErrorOrchestrator().handleError(options);
    }

    this.$scope.configurationTabsProps = {};
    this.$scope.buildProps = tabs => {
      const cleanTabs = [];
      tabs.forEach(x => {
        if (
          this.$scope.configurationTab === 'integrity-monitoring' &&
          x.id === 'fim-whodata' &&
          x.agent &&
          x.agent.agentPlatform !== 'linux'
        )
          return;

        cleanTabs.push({
          id: x.id,
          name: x.name,
        });
      });
      this.$scope.configurationTabsProps = {
        clickAction: tab => {
          this.$scope.switchConfigurationSubTab(tab);
        },
        selectedTab:
          this.$scope.configurationSubTab || (tabs && tabs.length)
            ? tabs[0].id
            : '',
        tabs: cleanTabs,
      };
    };

    this.setTabs();
  }

  /**
   * Filter by Mitre.ID
   * @param {*} id
   */
  addMitrefilter(id) {
    const filter = `{"meta":{"index": ${
      AppState.getCurrentPattern() ||
      getWazuhCorePlugin().configuration.getSettingValue('pattern')
    }},"query":{"match":{"rule.mitre.id":{"query":"${id}","type":"phrase"}}}}`;
    this.$rootScope.$emit('addNewKibanaFilter', {
      filter: JSON.parse(filter),
    });
  }

  /**
   * Build the current section tabs
   */
  setTabs() {
    this.$scope.agentsTabsProps = false;
    if (this.$scope.agent) {
      this.currentPanel = this.commonData.getCurrentPanel(
        this.$scope.tab,
        true,
      );

      if (!this.currentPanel) return;

      const tabs = this.commonData.getTabsFromCurrentPanel(
        this.currentPanel,
        this.$scope.tabNames,
      );

      const cleanTabs = [];
      tabs.forEach(x => {
        if (!hasAgentSupportModule(this.$scope.agent, x.id)) return;

        cleanTabs.push({
          id: x.id,
          name: x.name,
        });
      });

      this.$scope.agentsTabsProps = {
        clickAction: tab => {
          this.switchTab(tab, true);
        },
        selectedTab:
          this.$scope.tab ||
          (this.currentPanel && this.currentPanel.length
            ? this.currentPanel[0]
            : ''),
        tabs: cleanTabs,
      };
      this.$scope.$applyAsync();
    }
  }

  showToast = (color, title, text, time) => {
    getToasts().add({
      color: color,
      title: title,
      text: text,
      toastLifeTimeMs: time,
    });
  };

  // Agent data

  /**
   * Checks rootcheck of selected agent
   */
  validateRootCheck() {
    const result = this.commonData.validateRange(this.$scope.agent.rootcheck);
    this.$scope.agent.rootcheck = result;
  }

  /**
   * Checks syscheck of selected agent
   */
  validateSysCheck() {
    const result = this.commonData.validateRange(this.$scope.agent.syscheck);
    this.$scope.agent.syscheck = result;
  }

  /**
   * Get the needed data for load syscollector
   * @param {*} id
   */
  async loadSyscollector(id) {
    try {
      const syscollectorData = await this.genericReq.request(
        'GET',
        `/api/syscollector/${id}`,
      );
      this.$scope.syscollector = syscollectorData?.data || {};
      return;
    } catch (error) {
      throw new Error(error);
    }
  }

  /**
   * Get all data from agent
   * @param {*} newAgentId
   */
  async getAgent(newAgentId) {
    try {
      this.$scope.emptyAgent = false;
      this.$scope.load = true;
      this.changeAgent = true;

      const globalAgent = this.shareAgent.getAgent();

      const id = this.commonData.checkLocationAgentId(newAgentId, globalAgent);

      this.loadWelcomeCardsProps();
      this.$scope.getWelcomeCardsProps = resultState => {
        return { ...this.$scope.welcomeCardsProps, resultState };
      };

      if (!id) {
        this.$scope.load = false;
        // We set some properties used by the rendered component to work and allowing
        // to manage when there is not selected agent.
        await this.$scope.switchTab(this.$scope.tab, true);
        this.loadWelcomeCardsProps();
        this.$scope.getWelcomeCardsProps = resultState => {
          return { ...this.$scope.welcomeCardsProps, resultState };
        };
        this.$scope.$applyAsync();
        return;
      }

      const data = await WzRequest.apiReq('GET', `/agents`, {
        params: {
          agents_list: id,
        },
      });

      const agentInfo = data?.data?.data?.affected_items[0] || false;
      // Agent
      this.$scope.agent = agentInfo;

      if (!this.$scope.agent) return;

      // Sync the selected agent on Redux store
      if (
        store.getState().appStateReducers.currentAgentData.id !==
        this.$scope.agent.id
      ) {
        store.dispatch(updateCurrentAgentData(this.$scope.agent));
      }

      if (agentInfo && this.$scope.agent.os) {
        this.$scope.agentOS =
          this.$scope.agent.os.name + ' ' + this.$scope.agent.os.version;
        const isLinux = this.$scope.agent.os.uname.includes('Linux');
        this.$scope.agent.agentPlatform = isLinux
          ? 'linux'
          : this.$scope.agent.os.platform;
      } else {
        this.$scope.agentOS = '-';
        this.$scope.agent.agentPlatform = false;
      }

      await this.$scope.switchTab(this.$scope.tab, true);

      this.loadWelcomeCardsProps();
      this.$scope.getWelcomeCardsProps = resultState => {
        return { ...this.$scope.welcomeCardsProps, resultState };
      };
      this.$scope.load = false;
      this.$scope.$applyAsync();
      return;
    } catch (error) {
      if (!this.$scope.agent) {
        if ((error || {}).status === -1) {
          this.$scope.emptyAgent = 'API timeout.';
        }
      }
      if (
        error &&
        typeof error === 'string' &&
        error.includes('Agent does not exist')
      ) {
        this.$location.search('agent', null);
        this.$location.path('/agents-preview');
      }
      this.$scope.load = false;
      this.$scope.$applyAsync();
      throw new Error(error);
    }
  }

  shouldShowComponent(component) {
    return hasAgentSupportModule(this.$scope.agent, component);
  }

  setAgent(agent) {
    this.$scope.agent = agent;
  }
  /**
   * Get available welcome cards after getting the agent
   */
  loadWelcomeCardsProps() {
    this.$scope.welcomeCardsProps = {
      switchTab: (tab, force) => this.switchTab(tab, force),
      agent: this.$scope.agent,
      api: AppState.getCurrentAPI(),
      setAgent: agent => this.setAgent(agent),
      goGroups: (agent, group) => this.goGroups(agent, group),
    };
  }

  /**
   * This adds timezone offset to a given date
   * @param {String} binding_text
   * @param {String} date
   */
  offsetTimestamp(text, time) {
    try {
      return text + formatUIDate(time);
    } catch (error) {
      const options = {
        context: `${AgentsController.name}.offsetTimestamp`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: false,
        error: {
          error: error,
          message: error.message || error,
          title: error.message || error,
        },
      };
      getErrorOrchestrator().handleError(options);
      return time !== '-' ? `${text}${time} (UTC)` : time;
    }
  }

  /**
   * Navigate to the groups of an agent
   * @param {*} agent
   * @param {*} group
   */
  goGroups(agent, group) {
    AppState.setNavigation({
      status: true,
    });
    this.visFactoryService.clearAll();
    this.shareAgent.setAgent(agent, group);
    this.$location.search('tab', 'groups');
    this.$location.search('navigation', true);
    this.$location.path('/manager');
  }

  falseAllExpand() {
    this.$scope.expandArray = [
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ];
  }

  expand(i) {
    const oldValue = this.$scope.expandArray[i];
    this.falseAllExpand();
    this.$scope.expandArray[i] = !oldValue;
  }
}
