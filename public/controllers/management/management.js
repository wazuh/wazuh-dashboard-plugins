/*
 * Wazuh app - Management controller
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { TabNames } from '../../utils/tab-names';
import { AppState } from '../../react-services/app-state';
import { WazuhConfig } from '../../react-services/wazuh-config';
import { WzRequest } from '../../react-services/wz-request';
import { ErrorHandler } from '../../react-services/error-handler';
import { ShareAgent } from '../../factories/share-agent';
import {
  ResourcesHandler,
  ResourcesConstants
} from './components/management/common/resources-handler';

import { UI_ERROR_SEVERITIES } from '../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../common/constants';
import { getErrorOrchestrator } from '../../react-services/common-services';

export class ManagementController {
  /**
   * Class constructor
   * @param {*} $scope
   * @param {*} $location
   */
  constructor($scope, $rootScope, $location, configHandler, errorHandler, $interval) {
    this.$scope = $scope;
    this.$rootScope = $rootScope;
    this.$location = $location;
    this.shareAgent = new ShareAgent();
    this.wazuhConfig = new WazuhConfig();
    this.configHandler = configHandler;
    this.errorHandler = errorHandler;
    this.$interval = $interval;
    this.tab = 'welcome';
    this.globalConfigTab = 'overview';
    this.tabNames = TabNames;
    this.wazuhManagementTabs = ['ruleset', 'groups', 'configuration'];
    this.statusReportsTabs = ['status', 'logs', 'reporting', 'monitoring'];
    this.currentGroup = false;
    this.logtestOpened = false;
    this.uploadOpened = false;
    this.rulesetTab = ResourcesConstants.RULES;

    this.$scope.$on('setCurrentGroup', (ev, params) => {
      this.currentGroup = (params || {}).currentGroup || false;
    });

    this.$scope.$on('removeCurrentGroup', () => {
      this.currentGroup = false;
      AppState.setNavigation({ status: true });
      this.$location.search('currentGroup', null);
    });

    this.$scope.$on('setCurrentRule', (ev, params) => {
      this.setCurrentRule(params);
    });

    this.$scope.$on('removeCurrentRule', () => {
      this.currentRule = false;
      AppState.setNavigation({ status: true });
      this.$location.search('currentRule', null);
    });

    this.$scope.$on('setCurrentDecoder', (ev, params) => {
      this.currentDecoder = (params || {}).currentDecoder || false;
      this.$location.search('currentDecoder', true);
      AppState.setNavigation({ status: true });
    });

    this.$scope.$on('removeCurrentDecoder', () => {
      this.currentDecoder = false;
      AppState.setNavigation({ status: true });
      this.$location.search('currentDecoder', null);
    });

    this.$scope.$on('setCurrentList', (ev, params) => {
      this.currentList = (params || {}).currentList || false;
      this.$location.search('currentList', true);
      AppState.setNavigation({ status: true });
      this.$scope.$applyAsync();
    });

    this.$scope.$on('removeCurrentList', () => {
      this.currentList = false;
      AppState.setNavigation({ status: true });
      this.$location.search('currentList', null);
    });

    this.$scope.$on('setCurrentConfiguration', (ev, params) => {
      this.currentConfiguration = (params || {}).currentConfiguration || false;
    });

    this.$scope.$on('removeCurrentConfiguration', () => {
      this.currentConfiguration = false;
    });

    this.$scope.$on('viewFileOnly', (ev, params) => {
      $scope.$broadcast('viewFileOnlyTable', {
        file: params.item,
        path: params.path,
      });
    });

    this.$rootScope.$on('setRestarting', () => {
      if (this.clusterInfo.status === 'enabled') {
        this.blockEditioncounter = 0;
        this.blockEdition = true;
        this.$interval(
          () => {
            this.blockEditioncounter++;
            if (this.blockEditioncounter == 100) {
              this.blockEdition = false;
              this.isRestarting = false;
              this.$scope.$applyAsync();
            }
          },
          333,
          100
        );
      }
      this.isRestarting = true;
      this.$scope.$applyAsync();
    });

    this.$rootScope.$on('removeBlockEdition', () => {
      this.blockEdition = false;
      this.isRestarting = false;
      this.$scope.$applyAsync();
    });

    this.$scope.$on('removeRestarting', () => {
      this.isRestarting = false;
      this.$scope.$applyAsync();
    });

    this.$rootScope.$on('performRestart', (ev) => {
      ev.stopPropagation();
      this.clusterInfo.status === 'enabled' ? this.restartCluster() : this.restartManager();
    });

    this.$rootScope.timeoutIsReady;
    this.$rootScope.$watch('resultState', () => {
      if (this.$rootScope.timeoutIsReady) {
        clearTimeout(this.$rootScope.timeoutIsReady);
      }
      if (this.$rootScope.resultState === 'ready') {
        this.$scope.isReady = true;
      } else {
        this.$rootScope.timeoutIsReady = setTimeout(() => (this.$scope.isReady = false), 1000);
      }
    });

    this.welcomeCardsProps = {
      switchTab: (tab, setNav) => this.switchTab(tab, setNav),
    };

    this.managementTabsProps = {
      clickAction: (tab) => this.switchTab(tab, true),
      selectedTab: this.tab,
      tabs: [
        { id: 'status', name: 'Status' },
        { id: 'logs', name: 'Logs' },
        { id: 'monitoring', name: 'Cluster' },
        { id: 'reporting', name: 'Reporting' },
      ],
    };

    this.logtestProps = {
      clickAction: (log) => log,
      openCloseFlyout: () => this.openCloseFlyout(),
      showClose: true,
      onFlyout: true,
    };

    this.managementProps = {
      switchTab: (section) => this.switchTab(section, true),
      section: '',
      groupsProps: {},
      configurationProps: {
        agent: {
          id: '000',
        }, // TODO: get dynamically the agent?
        updateWazuhNotReadyYet: (status) => {
          this.$rootScope.wazuhNotReadyYet = status;
          this.$scope.$applyAsync();
        },
        wazuhNotReadyYet: () => this.$rootScope.wazuhNotReadyYet,
      },
      logtestProps: this.logtestProps,
    };
  }

  /**
   * When controller loads
   */
  $onInit() {
    try {
      this.clusterInfo = AppState.getClusterInfo();

      if (this.shareAgent.getAgent() && this.shareAgent.getSelectedGroup()) {
        this.tab = 'groups';
        this.switchTab(this.tab);
        return;
      }

      const location = this.$location.search();

      if (location && location.tab) {
        this.tab = location.tab;
        this.switchTab(this.tab);
      }

      this.uploadFilesProps = {
        msg: this.$scope.mctrl.rulesetTab,
        path: `etc/${this.$scope.mctrl.rulesetTab}`,
        upload: (files) => this.uploadFiles(files, this.$scope.mctrl.rulesetTab),
      };
    } catch (error) {
      const errorOptions = {
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        context: `${ManagementController.name}.$onInit`,
        error: {
          error: error,
          message: error?.message || '',
          title: 'Error restarting cluster',
        },
      };

      getErrorOrchestrator().handleError(errorOptions);
    }
  }

  /**
   * This check if given array of items contais a single given item
   * @param {Object} item
   * @param {Array<Object>} array
   */
  inArray(item, array) {
    return item && Array.isArray(array) && array.includes(item);
  }

  async restartManager() {
    try {
      if (this.isRestarting) return;
      this.isRestarting = true;
      await this.configHandler.restartManager();
      this.isRestarting = false;
      this.$scope.$applyAsync();
      ErrorHandler.info('Restarting manager.');
    } catch (error) {
      this.isRestarting = false;
      this.$scope.$applyAsync();

      const errorOptions = {
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        context: `${ManagementController.name}.restartManager`,
        error: {
          error: error,
          message: error?.message || '',
          title: 'Error restarting manager',
        },
      };

      getErrorOrchestrator().handleError(errorOptions);
    }
  }

  async restartCluster() {
    try {
      if (this.isRestarting) return;
      this.isRestarting = true;
      await this.configHandler.restartCluster();
      this.isRestarting = false;
      this.$scope.$applyAsync();
      ErrorHandler.info('Restarting cluster, it will take up to 30 seconds.');
    } catch (error) {
      this.isRestarting = false;
      this.$scope.$applyAsync();
      const errorOptions = {
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        context: `${ManagementController.name}.restartCluster`,
        error: {
          error: error,
          message: error?.message || '',
          title: 'Error restarting cluster',
        },
      };

      getErrorOrchestrator().handleError(errorOptions);
    }
  }

  setConfigTab(tab, nav = false) {
    this.globalConfigTab = tab;
    if (nav) {
      AppState.setNavigation({ status: true });
    } else {
      this.editionTab = tab;
    }
    this.$location.search('configSubTab', null);
    this.$location.search('editSubTab', tab);
    this.$scope.$broadcast('configurationIsReloaded', {
      globalConfigTab: this.globalConfigTab,
      reloadConfigSubTab: true,
    });
  }

  setCurrentRule(params) {
    this.currentRule = (params || {}).currentRule || false;
    this.$location.search('currentRule', true);
    AppState.setNavigation({ status: true });
  }

  /**
   * This switch to a selected tab
   * @param {String} tab
   */
  switchTab(tab, setNav = false) {
    this.editTab = '';
    if (setNav) {
      AppState.setNavigation({ status: true });
    } else {
      if (this.$location.search().editSubTab) {
        this.editTab = this.$location.search().editSubTab;
      }
    }
    this.$location.search('editSubTab', null);
    this.tab = tab;

    if (this.tab === 'groups') {
      this.$scope.$broadcast('groupsIsReloaded');
    }
    if (this.tab !== 'groups') {
      this.currentGroup = false;
      this.$location.search('currentGroup', null);
    }
    if (this.tab === 'configuration' && !this.editTab) {
      this.globalConfigTab = 'overview';
      this.currentConfiguration = false;
      this.$scope.$broadcast('configurationIsReloaded');
    } else if (this.tab === 'configuration' && this.editTab) {
      this.setConfigTab(this.editTab);
    } else {
      this.$location.search('configSubTab', null);
    }
    if (this.tab === 'ruleset') {
      this.$scope.$broadcast('rulesetIsReloaded');
      this.globalRuleSet = 'ruleset';
      this.globalRulesetTab = this.rulesetTab;
    } else {
      this.globalRuleSet = false;
      this.globalRulesetTab = false;
      this.currentRule = false;
      this.currentDecoder = false;
      this.currentList = false;
      this.managementTabsProps.selectedTab = this.tab;
    }
    this.managementProps.section = this.tab === 'ruleset' ? this.rulesetTab : this.tab;
    this.$location.search('tab', this.tab);
    this.loadNodeList();
  }

  /**
   * This set the rules tab
   * @param {String} tab
   */
  setRulesTab(tab, flag) {
    this.openedFileDirect = false;
    this.rulesetTab = tab;
    this.globalRulesetTab = this.rulesetTab;
    this.managingFiles = false;
    //this.refreshUploadFileProps();
    if (!flag) {
      this.breadCrumbBack();
    }
  }

  switchFilesSubTab(flag, showFile) {
    this.managingFiles = flag || true;
    if (showFile) {
      this.showFile = showFile;
      this.$scope.$broadcast('editFromTable');
    } else if (!this.openedFileDirect) {
      this.$scope.$broadcast('closeRulesetFile');
    }
  }

  breadCrumbBack(goRoot = false) {
    if (this.currentRule) {
      this.$scope.$broadcast('closeRuleView');
      this.$scope.$broadcast('closeRulesetFile');
      this.$scope.$emit('removeCurrentRule');
    }
    if (this.currentDecoder) {
      this.$scope.$broadcast('closeDecoderView');
      this.$scope.$broadcast('closeRulesetFile');
      this.$scope.$emit('removeCurrentDecoder');
    }
    if (this.currentList) {
      this.$scope.$broadcast('closeListView');
    }
    if (goRoot) {
      this.switchTab('ruleset', true);
      this.setRulesTab('rules');
    }
    this.$scope.$broadcast('closeRulesetFile');
    this.$scope.$applyAsync();
  }

  changeNode(node) {
    this.selectedNode = node;
    this.$scope.$broadcast('configNodeChanged');
    this.$scope.$applyAsync();
  }

  async loadNodeList() {
    try {
      this.loadingNodes = true;
      const clusterInfo = AppState.getClusterInfo() || {};
      const clusterEnabled = clusterInfo.status === 'enabled';
      if (clusterEnabled) {
        const response = await WzRequest.apiReq('GET', '/cluster/nodes', {});
        const nodeList = (((response || {}).data || {}).data || {}).items || false;
        if (Array.isArray(nodeList) && nodeList.length) {
          this.nodeList = nodeList.map((item) => item.name).reverse();
          this.selectedNode = nodeList.filter((item) => item.type === 'master')[0].name;
        }
      }
    } catch (error) {
      const errorOptions = {
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        context: `${ManagementController.name}.loadNodeList`,
        error: {
          error: error,
          message: error?.message || '',
          title: 'Error loading node list',
        },
      };

      getErrorOrchestrator().handleError(errorOptions);
    }
    this.loadingNodes = false;
    this.$scope.$applyAsync();
  }

  openCloseFlyout() {
    this.logtestOpened = !this.logtestOpened;
    this.logtestProps.isRuleset = this.tab;
    this.$scope.$applyAsync();
  }

  newFile() {
    this.openedFileDirect = true;
    this.switchFilesSubTab();
    this.$scope.$applyAsync();
    this.$scope.$broadcast('addNewFile', { type: this.globalRulesetTab });
  }

  openUploadFile() {
    this.uploadOpened = !this.uploadOpened;
    this.$scope.$applyAsync();
  }

  refreshUploadFileProps() {
    this.uploadFilesProps = {
      msg: this.rulesetTab,
      path: `etc/${this.rulesetTab}`,
      upload: (files) => this.uploadFiles(files, this.rulesetTab),
    };
  }

  /**
   * Uploads the filess
   * @param {Array} files
   * @param {String} path
   */
  async uploadFiles(files, resource) {
    try {
      this.errors = false;
      this.results = [];
      const resourcesHandler = new ResourcesHandler(resource);

      for (let idx in files) {
        const { file, content } = files[idx];
        try {
          await resourcesHandler.updateFile(file, content, true); // True does not overwrite the file
          this.results.push({
            index: idx,
            uploaded: true,
            file: file,
            error: 0,
          });
        } catch (error) {
          this.errors = true;
          this.results.push({
            index: idx,
            uploaded: false,
            file: file,
            error: error,
          });
        }
      }
      if (this.errors) throw this.results;
      ErrorHandler.info('Upload successful');
    } catch (error) {
      if (Array.isArray(error) && error.length) throw error;

      const errorOptions = {
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        context: `${ManagementController.name}.uploadFiles`,
        error: {
          error: error,
          message: error?.message || '',
          title: 'Files cannot be loaded',
        },
      };

      getErrorOrchestrator().handleError(errorOptions);
    }
  }
}
