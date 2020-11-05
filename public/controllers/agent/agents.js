/*
 * Wazuh app - Agents controller
 * Copyright (C) 2015-2020 Wazuh, Inc.
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
import * as FileSaver from '../../services/file-saver';
import { TabDescription } from '../../../server/reporting/tab-description';
import { UnsupportedComponents } from '../../utils/components-os-support';
import { visualizations } from '../../templates/agents/visualizations';

import { ConfigurationHandler } from '../../utils/config-handler';
import { timefilter } from 'ui/timefilter';
import { AppState } from '../../react-services/app-state';
import { WazuhConfig } from '../../react-services/wazuh-config';
import { GenericRequest } from '../../react-services/generic-request';
import { WzRequest } from '../../react-services/wz-request';
import { toastNotifications } from 'ui/notify';
import { ShareAgent } from '../../factories/share-agent';
import { TabVisualizations } from '../../factories/tab-visualizations';
import { TimeService } from '../../react-services/time-service';
import { ErrorHandler } from '../../react-services/error-handler';
import { GroupHandler } from '../../react-services/group-handler';
import store from '../../redux/store';
import { updateGlobalBreadcrumb } from '../../redux/actions/globalBreadcrumbActions';
import { WAZUH_ALERTS_PATTERN } from '../../../util/constants';

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
    csvReq
    
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
    this.groupHandler = GroupHandler;
    this.wazuhConfig = new WazuhConfig();
    this.timeService = TimeService;
    this.genericReq = GenericRequest;

    // Config on-demand
    this.$scope.isArray = Array.isArray;
    this.configurationHandler = new ConfigurationHandler(
      errorHandler
    );
    this.$scope.currentConfig = null;
    this.$scope.configurationTab = '';
    this.$scope.configurationSubTab = '';
    this.$scope.integrations = {};
    this.$scope.selectedItem = 0;
    this.targetLocation = null;
    this.ignoredTabs = ['syscollector', 'welcome', 'configuration'];

    this.$scope.showNewFim = true;
    this.$scope.showScaScan = false;

    this.$scope.editGroup = false;
    this.$scope.addingGroupToAgent = false;

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
      false
    ];
  }

  /**
   * On controller loads
   */
  async $onInit() {
    const savedTimefilter = this.commonData.getTimefilter();
    if (savedTimefilter) {
      timefilter.setTime(savedTimefilter);
      this.commonData.removeTimefilter();
    }

    this.$scope.TabDescription = TabDescription;

    this.$rootScope.reportStatus = false;

    this.$location.search('_a', null);
    this.filterHandler = new FilterHandler(AppState.getCurrentPattern());
    this.visFactoryService.clearAll();

    const currentApi = JSON.parse(AppState.getCurrentAPI()).id;
    const extensions = await AppState.getExtensions(currentApi);
    this.$scope.extensions = extensions;

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
      onlyAgent = false
    ) => this.switchSubtab(subtab, force, onlyAgent);

    this.changeAgent = false;

    this.$scope.switchTab = (tab, force = false) => this.switchTab(tab, force);

    this.$scope.getAgentStatusClass = agentStatus =>
      agentStatus === 'active' ? 'teal' : 'red';

    this.$scope.formatAgentStatus = agentStatus => {
      return ['active', 'disconnected'].includes(agentStatus) ?
        agentStatus :
        'never connected';
    };
    this.$scope.getAgent = async newAgentId => this.getAgent(newAgentId);
    this.$scope.goGroups = (agent, group) => this.goGroups(agent, group);
    this.$scope.downloadCsv = async (path, fileName, filters = []) =>
      this.downloadCsv(path, fileName, filters);

    this.$scope.search = (term, specificPath) =>
      this.$scope.$broadcast('wazuhSearch', {
        term,
        specificPath
      });

    this.$scope.searchSyscheckFile = (term, specificFilter) =>
      this.$scope.$broadcast('wazuhSearch', {
        term,
        specificFilter
      });

    this.$scope.searchRootcheck = (term, specificFilter) =>
      this.$scope.$broadcast('wazuhSearch', {
        term,
        specificFilter
      });

    this.$scope.launchRootcheckScan = () => this.launchRootcheckScan();
    this.$scope.launchSyscheckScan = () => this.launchSyscheckScan();

    this.$scope.startVis2Png = () => this.startVis2Png();

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
        enabledComponents
      );
    };

    this.$scope.restartAgent = async agent => {
      this.$scope.restartingAgent = true;
      try {
        const data = await WzRequest.apiReq(
          'PUT',
          `/agents/${agent.id}/restart`,
          {}
        );
        const result = ((data || {}).data || {}).data || false;
        const failed =
          result &&
          Array.isArray(result.failed_items) &&
          result.failed_items.length;
        if (failed) {
          throw new Error(result.failed_items[0].detail);
        } else if (result) {
          ErrorHandler.info(result.msg);
        } else {
          throw new Error('Unexpected error upgrading agent');
        }
        this.$scope.restartingAgent = false;
      } catch (error) {
        ErrorHandler.handle(error);
        this.$scope.restartingAgent = false;
      }
      this.$scope.$applyAsync();
    };

    //Load
    try {
      this.$scope.getAgent();
    } catch (e) {
      ErrorHandler.handle(
        'Unexpected exception loading controller',
        'Agents'
      );
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
      navigate = true
    ) => {
      this.$scope.navigate = navigate;
      try {
        this.$scope.configSubTab = JSON.stringify({
          configurationTab: configurationTab,
          sections: sections
        });
        if (!this.$location.search().configSubTab) {
          AppState.setSessionStorageItem(
            'configSubTab',
            this.$scope.configSubTab
          );
          this.$location.search('configSubTab', true);
        }
      } catch (error) {
        ErrorHandler.handle(error, 'Set configuration path');
      }
      this.configurationHandler.switchConfigTab(
        configurationTab,
        sections,
        this.$scope,
        this.$scope.agent.id
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
        this.$scope.agent.id
      );
    };

    this.$scope.switchConfigurationTab = (configurationTab, navigate) => {
      // Check if configuration is synced
      this.checkSync();
      this.$scope.navigate = navigate;
      this.configurationHandler.switchConfigurationTab(
        configurationTab,
        this.$scope
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
              false
            );
          } catch (error) {
            ErrorHandler.handle(error, 'Get configuration path');
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
        this.$scope
      );
      if (configurationSubTab === 'pm-sca') {
        this.$scope.currentConfig.sca = this.configurationHandler.parseWodle(
          this.$scope.currentConfig,
          'sca'
        );
      }
    };
    this.$scope.updateSelectedItem = i => (this.$scope.selectedItem = i);
    this.$scope.getIntegration = list =>
      this.configurationHandler.getIntegration(list, this.$scope);

    this.$scope.switchScaScan = () => {
      this.$scope.showScaScan = !this.$scope.showScaScan;
      if (!this.$scope.showScaScan) {
        this.$scope.$emit('changeTabView', {
          tabView: this.$scope.tabView,
          tab: this.$scope.tab
        });
      }
      this.$scope.$applyAsync();
    };

    this.$scope.goDiscover = () => this.goDiscover();
    this.$scope.onClickUpgrade = () => this.onClickUpgrade();
    this.$scope.onClickRestart = () => this.onClickRestart();

    this.$scope.$on('$routeChangeStart', () => {
      return AppState.removeSessionStorageItem('configSubTab');
    });

    this.$scope.switchGroupEdit = () => {
      this.$scope.addingGroupToAgent = false;
      this.switchGroupEdit();
    };

    this.$scope.showConfirmAddGroup = group => {
      this.$scope.addingGroupToAgent = this.$scope.addingGroupToAgent
        ? false
        : group;
    };

    this.$scope.cancelAddGroup = () => (this.$scope.addingGroupToAgent = false);

    this.$scope.loadScaChecks = policy =>
      (this.$scope.lookingSca = {
        ...policy,
        id: policy.policy_id
      });

    this.$scope.closeScaChecks = () => (this.$scope.lookingSca = false);

    this.$scope.confirmAddGroup = group => {
      this.groupHandler
        .addAgentToGroup(group, this.$scope.agent.id)
        .then(() => WzRequest.apiReq('GET', `/agents`, {
          params: {
            agents_list: this.$scope.agent.id,
          }
        }))
        .then(agent => {
          this.$scope.agent.group = agent.data.data.affected_items[0].group;
          this.$scope.groups = this.$scope.groups.filter(
            item => !agent.data.data.affected_items[0].group.includes(item)
          );
          this.$scope.addingGroupToAgent = false;
          this.$scope.editGroup = false;
          ErrorHandler.info(`Group ${group} has been added.`);
          this.$scope.$applyAsync();
        })
        .catch(error => {
          this.$scope.editGroup = false;
          this.$scope.addingGroupToAgent = false;
          ErrorHandler.handle(
            error.message || error,
            'Error adding group to agent'
          );
        });
    };

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
          this.$scope.agent.id
        );

        this.changeAgent = false;
      } else {
        this.$scope.$emit('changeTabView', {
          tabView: subtab,
          tab: this.$scope.tab
        });
      }
      this.$scope.tabView = subtab;
      return;
    } catch (error) {
      ErrorHandler.handle(error, 'Agents');
      return;
    }
  }

  /**
   * Switch tab
   * @param {*} tab
   * @param {*} force
   */
  async switchTab(tab, force = false) {
    this.tabVisualizations.setTab(tab);
    this.$rootScope.rendered = false;
    this.$rootScope.$applyAsync();
    this.falseAllExpand();
    if (this.ignoredTabs.includes(tab)) {
      this.commonData.setRefreshInterval(timefilter.getRefreshInterval());
      timefilter.setRefreshInterval({
        pause: true,
        value: 0
      });
    } else if (this.ignoredTabs.includes(this.$scope.tab)) {
      timefilter.setRefreshInterval(this.commonData.getRefreshInterval());
    }
    if(tab === 'syscollector'){ // TODO: Migrate syscollector to React
      let breadcrumb = [
          {
            text: '',
          },
          {
            text: 'Agents',
            href: "#/agents-preview"
          },
          { agent: this.$scope.agent },
          {
            text: 'Inventory Data',
            className: 'wz-global-breadcrumb-popover'
          },
        ];
      store.dispatch(updateGlobalBreadcrumb(breadcrumb));
      $('#breadcrumbNoTitle').attr("title","");
    }

    // Update agent status
    if (!force && ((this.$scope || {}).agent || false)) {
      try {
        const agentInfo = await WzRequest.apiReq(
          'GET',
          `/agents`, {
            params: {
              agents_list: this.$scope.agent.id,
              select: 'status'
            }
          }
        );
        this.$scope.agent.status =
          (((((agentInfo || {}).data || {}).data || {}).affected_items || [])[0] || {}).status ||
          this.$scope.agent.status;
      } catch (error) { } // eslint-disable-line
    }

    try {
      this.$scope.showScaScan = false;
      if (tab === 'sca') {
        //remove to component
        this.$scope.scaProps = {
          agent: this.$scope.agent,
          loadScaChecks: policy => this.$scope.loadScaChecks(policy),
          downloadCsv: (path, name) => this.downloadCsv(path, name)
        };
      }

      if (tab === 'syscollector')
        try {
          await this.loadSyscollector(this.$scope.agent.id);
        } catch (error) { } // eslint-disable-line
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
        this.targetLocation && typeof this.targetLocation === 'object' ?
        this.targetLocation.subTab :
        'panels';

      if (!this.ignoredTabs.includes(this.$scope.tab)) {
        this.$scope.switchSubtab(
          targetSubTab,
          true,
          onlyAgent,
          sameTab,
          preserveDiscover
        );
      }

      this.shareAgent.deleteTargetLocation();
      this.targetLocation = null;
      this.$scope.$applyAsync();
    } catch (error) {
      return Promise.reject(error);
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
          name: x.name
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
        tabs: cleanTabs
      };
    };

    this.setTabs();
  }

  /**
   * Filter by Mitre.ID
   * @param {*} id
   */
  addMitrefilter(id) {
    const filter = `{"meta":{"index": ${AppState.getCurrentPattern() || WAZUH_ALERTS_PATTERN}},"query":{"match":{"rule.mitre.id":{"query":"${id}","type":"phrase"}}}}`;
    this.$rootScope.$emit('addNewKibanaFilter', { 
      filter: JSON.parse(filter)
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
        true
      );

      if (!this.currentPanel) return;

      const tabs = this.commonData.getTabsFromCurrentPanel(
        this.currentPanel,
        this.$scope.extensions,
        this.$scope.tabNames
      );

      const cleanTabs = [];
      tabs.forEach(x => {
        if (
          (
            UnsupportedComponents[(this.$scope.agent || {}).agentPlatform] ||
            UnsupportedComponents['other']
          ).includes(x.id)
        )
          return;

        cleanTabs.push({
          id: x.id,
          name: x.name
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
        tabs: cleanTabs
      };
      this.$scope.$applyAsync();
    }
  }

  showToast = (color, title, text, time) => {
    toastNotifications.add({
      color: color,
      title: title,
      text: text,
      toastLifeTimeMs: time
    });
  };

  goDiscover() {
    this.targetLocation = {
      tab: 'general',
      subTab: 'discover'
    };
    return this.switchTab('general');
  }

  onClickUpgrade() {
    try {
      WzRequest.apiReq('PUT', `/agents/${this.$scope.agent.id}/upgrade`, {})
        .then(() => {
          this.showToast('success', 'The agent is being upgrade.', '', 5000);
        })
        .catch(() => {
          this.showToast('warning', 'This agent is already upgrade.', '', 5000);
        });
    } catch (error) {
      console.log(error);
    }
  }

  onClickRestart() {
    try {
      WzRequest.apiReq('PUT', `/agents/${this.$scope.agent.id}/restart`, {})
        .then(() => {
          this.showToast('success', 'Agent restarted.', '', 5000);
        })
        .catch(() => {
          this.showToast('warning', 'Error restarting agent.', '', 5000);
        });
    } catch (error) {
      console.log(error);
    }
  }

  checkStatusAgent() {
    console.log(this.$scope.agent.status);
    if (this.$scope.agent.status !== 'Active') {
      return false;
    } else if (this.$scope.agent.status === 'Active') {
      return true;
    }
  }

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
   * Checks if configuration is sync
   */
  async checkSync() {
    const isSync = await WzRequest.apiReq(
      'GET',
      `/agents/${this.$scope.agent.id}/group/is_sync`, {}
    );
    this.$scope.isSynchronized =
      (((((isSync || {}).data || {}).data || {}).affected_items || [])[0] || {}).synced || false;
    this.$scope.$applyAsync();
  }

  /**
   * Get the needed data for load syscollector
   * @param {*} id
   */
  async loadSyscollector(id) {
    try {
      const syscollectorData = await this.genericReq.request(
        'GET',
        `/api/syscollector/${id}`
      );
      this.$scope.syscollector = (syscollectorData || {}).data || {};

      return;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Get all data from agent
   * @param {*} newAgentId
   */
  async getAgent(newAgentId) {
    try {
      this.$scope.emptyAgent = false;
      this.$scope.isSynchronized = false;
      this.$scope.load = true;
      this.changeAgent = true;

      const globalAgent = this.shareAgent.getAgent();

      const id = this.commonData.checkLocationAgentId(newAgentId, globalAgent);

      const data = await WzRequest.apiReq('GET', `/agents`, {
        params: {
          agents_list: id,
        }
      });

      const agentInfo = ((((data || {}).data || {}).data || {}).affected_items || [])[0] || false;
      // Agent
      this.$scope.agent = agentInfo;

      if (!this.$scope.agent) return;
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

      const groups = await WzRequest.apiReq('GET', '/groups', {});
      this.$scope.groups = groups.data.data.affected_items
        .map(item => item.name)
        .filter(
          item =>
            this.$scope.agent.group && !this.$scope.agent.group.includes(item)
        );

      this.loadWelcomeCardsProps();
      this.$scope.getWelcomeCardsProps = (resultState) => {
        return {...this.$scope.welcomeCardsProps, resultState }
      }
      this.$scope.load = false;
      this.$scope.$applyAsync();
      return;
    } catch (error) {
      if (!this.$scope.agent) {
        if ((error || {}).status === -1) {
          this.$scope.emptyAgent = 'Wazuh API timeout.';
        }
      }
      ErrorHandler.handle(error, 'Agents');
      if (
        error &&
        typeof error === 'string' &&
        error.includes('Agent does not exist')
      ) {
        this.$location.search('agent', null);
        this.$location.path('/agents-preview');
      }
    }

    this.$scope.load = false;
    this.$scope.$applyAsync();
    return;
  }

  shouldShowComponent(component) {
    return !(
      UnsupportedComponents[this.$scope.agent.agentPlatform] ||
      UnsupportedComponents['other']
    ).includes(component);
  }

  cleanExtensions(extensions) {
    const result = {};
    for (const extension in extensions) {
      if (
        !(
          UnsupportedComponents[this.$scope.agent.agentPlatform] ||
          UnsupportedComponents['other']
        ).includes(extension)
      ) {
        result[extension] = extensions[extension];
      }
    }
    return result;
  }

  /**
   * Get available welcome cards after getting the agent
   */
  loadWelcomeCardsProps() {
    this.$scope.welcomeCardsProps = {
      switchTab: tab => this.switchTab(tab),
      extensions: this.cleanExtensions(this.$scope.extensions),
      agent: this.$scope.agent,
      api: AppState.getCurrentAPI(),
      goGroups: (agent, group) => this.goGroups(agent, group),
      setExtensions: (api, extensions) => {
        AppState.setExtensions(api, extensions);
        this.$scope.extensions = extensions;
      }
    };
  }

  switchGroupEdit() {
    this.$scope.editGroup = !!!this.$scope.editGroup;
    this.$scope.$applyAsync();
  }

  /**
   * This adds timezone offset to a given date
   * @param {String} binding_text
   * @param {String} date
   */
  offsetTimestamp(text, time) {
    try {
      return text + this.timeService.offset(time);
    } catch (error) {
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
      status: true
    });
    this.visFactoryService.clearAll();
    this.shareAgent.setAgent(agent, group);
    this.$location.search('tab', 'groups');
    this.$location.search('navigation', true);
    this.$location.path('/manager');
  }

  /**
   * Get full data on CSV format from a path
   * @param {*} path path with data to convert
   * @param {*} fileName Output file name
   * @param {*} filters Filters to apply
   */
  async downloadCsv(path, fileName, filters = []) {
    try {
      ErrorHandler.info(
        'Your download should begin automatically...',
        'CSV'
      );
      const currentApi = JSON.parse(AppState.getCurrentAPI()).id;
      const output = await this.csvReq.fetch(path, currentApi, filters);
      const blob = new Blob([output], {
        type: 'text/csv'
      }); // eslint-disable-line

      FileSaver.saveAs(blob, fileName);
    } catch (error) {
      ErrorHandler.handle(error, 'Download CSV');
    }
    return;
  }

  /**
   * Transform a visualization into an image
   */
  startVis2Png() {
    const syscollectorFilters = [];
    if (this.$scope.tab === 'syscollector' && (this.$scope.agent || {}).id) {
      syscollectorFilters.push(
        this.filterHandler.managerQuery(AppState.getClusterInfo().cluster, true)
      );
      syscollectorFilters.push(
        this.filterHandler.agentQuery(this.$scope.agent.id)
      );
    }
    this.reportingService.startVis2Png(
      this.$scope.tab,
      (this.$scope.agent || {}).id || true,
      syscollectorFilters.length ? syscollectorFilters : null
    );
  }

  async launchRootcheckScan() {
    try {
      const isActive = ((this.$scope.agent || {}).status || '') === 'active';
      if (!isActive) {
        throw new Error('Agent is not active');
      }
      await WzRequest.apiReq(
        'PUT',
        `/rootcheck/${this.$scope.agent.id}`,
        {}
      );
      ErrorHandler.info(
        `Policy monitoring scan launched successfully on agent ${this.$scope.agent.id}`);
    } catch (error) {
      ErrorHandler.handle(error);
    }
    return;
  }

  async launchSyscheckScan() {
    try {
      const isActive = ((this.$scope.agent || {}).status || '') === 'active';
      if (!isActive) {
        throw new Error('Agent is not active');
      }
      await WzRequest.apiReq('PUT', `/syscheck`, {
        params: {
          agents_list: this.$scope.agent.id
        }
      });
      ErrorHandler.info(
        `FIM scan launched successfully on agent ${this.$scope.agent.id}`,
        ''
      );
    } catch (error) {
      ErrorHandler.handle(error);
    }
    return;
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
      false
    ];
  }

  expand(i) {
    const oldValue = this.$scope.expandArray[i];
    this.falseAllExpand();
    this.$scope.expandArray[i] = !oldValue;
  }
}
