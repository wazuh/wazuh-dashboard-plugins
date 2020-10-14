/*
 * Wazuh app - Management controller
 * Copyright (C) 2015-2020 Wazuh, Inc.
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
import RulesetHandler from './components/management/ruleset/utils/ruleset-handler';

export class ManagementController {
  /**
   * Class constructor
   * @param {*} $scope
   * @param {*} $location
   */
  constructor(
    $scope,
    $rootScope,
    $location,
    configHandler,
    errorHandler,
    $interval
  ) {
    this.$scope = $scope;
    this.$rootScope = $rootScope;
    this.$location = $location;
    this.shareAgent = new ShareAgent();
    this.wazuhConfig = new WazuhConfig();
    this.configHandler = configHandler;
    this.errorHandler = errorHandler;
    this.$interval = $interval;
    this.tab = 'welcome';
    this.rulesetTab = 'rules';
    this.globalConfigTab = 'overview';
    this.tabNames = TabNames;
    this.wazuhManagementTabs = ['ruleset', 'groups', 'configuration'];
    this.statusReportsTabs = ['status', 'logs', 'reporting', 'monitoring'];
    this.currentGroup = false;
    this.logtestOpened = false;
    this.uploadOpened = false;
    this.rulesetHandler = RulesetHandler;

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
        path: params.path
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

    this.$rootScope.$on('performRestart', ev => {
      ev.stopPropagation();
      this.clusterInfo.status === 'enabled'
        ? this.restartCluster()
        : this.restartManager();
    });

    this.welcomeCardsProps = {
      switchTab: (tab, setNav) => this.switchTab(tab, setNav)
    };

    this.managementTabsProps = {
      clickAction: tab => this.switchTab(tab, true),
      selectedTab: this.tab,
      tabs: [
        { id: 'status', name: 'Status' },
        { id: 'logs', name: 'Logs' },
        { id: 'monitoring', name: 'Cluster' },
        { id: 'reporting', name: 'Reporting' }
      ]
    };

    this.logtestProps = {
      clickAction: log => this.testLogtest(log),
      close: () => this.openLogtest(),
      showClose: true
    };

    this.managementProps = {
      switchTab: section => this.switchTab(section, true),
      section: '',
      groupsProps: {},
      configurationProps: {
        agent: {
          id: '000'
        }, // TODO: get dynamically the agent?
        updateWazuhNotReadyYet: status => {
          this.$rootScope.wazuhNotReadyYet = status;
          this.$scope.$applyAsync();
        },
        wazuhNotReadyYet: () => this.$rootScope.wazuhNotReadyYet
      }
    };
  }

  /**
   * When controller loads
   */
  $onInit() {
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
      upload: (files, path) => this.uploadFiles(files, path)
    };
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
      ErrorHandler.handle(
        error.message || error,
        'Error restarting manager'
      );
    }
  }

  async restartCluster() {
    try {
      if (this.isRestarting) return;
      this.isRestarting = true;
      await this.configHandler.restartCluster();
      this.isRestarting = false;
      this.$scope.$applyAsync();
      ErrorHandler.info(
        'Restarting cluster, it will take up to 30 seconds.'
      );
    } catch (error) {
      this.isRestarting = false;
      this.$scope.$applyAsync();
      ErrorHandler.handle(
        error.message || error,
        'Error restarting cluster'
      );
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
      reloadConfigSubTab: true
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
    this.managementProps.section =
      this.tab === 'ruleset' ? this.rulesetTab : this.tab;
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
    this.refreshUploadFileProps();
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
        const nodeList =
          (((response || {}).data || {}).data || {}).items || false;
        if (Array.isArray(nodeList) && nodeList.length) {
          this.nodeList = nodeList.map(item => item.name).reverse();
          this.selectedNode = nodeList.filter(
            item => item.type === 'master'
          )[0].name;
        }
      }
    } catch (error) {
      console.log(error.message || error); // eslint-disable-line
    }
    this.loadingNodes = false;
    this.$scope.$applyAsync();
  }

  openLogtest() {
    this.logtestOpened = !this.logtestOpened;
    this.$scope.$applyAsync();
  }

  newFile() {
    this.openedFileDirect = true;
    this.switchFilesSubTab();
    this.$scope.$applyAsync();
    this.$scope.$broadcast('addNewFile', { type: this.globalRulesetTab });
  }

  testLogtest = async log => {
    //return await WzRequest.apiReq('GET', '/testlog', {log});
    const sleep = m => new Promise(r => setTimeout(r, m));
    await sleep(1000);
    return `**Phase 1: Completed pre-decoding.
    full event: 'timestamp:2019-09-03T13:22:27.950+0000 rule:level:7 rule:description:python: Undocumented local_file protocol allows remote attackers to bypass protection mechanisms rule:id:23504 rule:firedtimes:33 rule:mail:false rule:groups:[vulnerability-detector] rule:gdpr:[IV_35.7.d] agent:id:000 agent:name:a205e5b2a1aa manager:{name:a205e5b2a1aa} id:1567516947.252273 cluster:name:wazuh cluster:node:master decoder:{name:json} data:{vulnerability:cve:CVE-2019-9948} data:{vulnerability:title:python: Undocumented local_file protocol allows remote attackers to bypass protection mechanisms} data:{vulnerability:severity:Medium} data:{vulnerability:published:2019-03-23T00:00:00+00:00} data:{vulnerability:state:Fixed} data:{vulnerability:cvss:{cvss3_score:7.400000}} data:{vulnerability:package:name:python} data:{vulnerability:package:version:2.7.5-80.el7_6} data:{vulnerability:package:condition:less than 2.7.5-86.el7} data:{vulnerability:advisories:RHSA-2019:2030,RHSA-2019:1700} data:{vulnerability:cwe_reference:CWE-749} data:{vulnerability:bugzilla_reference:https://bugzilla.redhat.com/show_bug.cgi?id=1695570} data:{vulnerability:reference:https://access.redhat.com/security/cve/CVE-2019-9948} location:vulnerability-detector'
    timestamp: '(null)'
    hostname: 'a205e5b2a1aa'
    program_name: '(null)'
    log: 'timestamp:2019-09-03T13:22:27.950+0000 rule:level:7 rule:description:python: Undocumented local_file protocol allows remote attackers to bypass protection mechanisms rule:id:23504 rule:firedtimes:33 rule:mail:false rule:groups:[vulnerability-detector] rule:gdpr:[IV_35.7.d] agent:id:000 agent:name:a205e5b2a1aa manager:{name:a205e5b2a1aa} id:1567516947.252273 cluster:name:wazuh cluster:node:master decoder:{name:json} data:{vulnerability:cve:CVE-2019-9948} data:{vulnerability:title:python: Undocumented local_file protocol allows remote attackers to bypass protection mechanisms} data:{vulnerability:severity:Medium} data:{vulnerability:published:2019-03-23T00:00:00+00:00} data:{vulnerability:state:Fixed} data:{vulnerability:cvss:{cvss3_score:7.400000}} data:{vulnerability:package:name:python} data:{vulnerability:package:version:2.7.5-80.el7_6} data:{vulnerability:package:condition:less than 2.7.5-86.el7} data:{vulnerability:advisories:RHSA-2019:2030,RHSA-2019:1700} data:{vulnerability:cwe_reference:CWE-749} data:{vulnerability:bugzilla_reference:https://bugzilla.redhat.com/show_bug.cgi?id=1695570} data:{vulnerability:reference:https://access.redhat.com/security/cve/CVE-2019-9948} location:vulnerability-detector'
  **Phase 2: Completed decoding.
    No decoder matched.
  **Phase 3: Completed filtering (rules).
    Rule id: '1002'
    Level: '2'
    Description: 'Unknown problem somewhere in the system.'`;
  };

  openUploadFile() {
    this.uploadOpened = !this.uploadOpened;
    this.$scope.$applyAsync();
  }

  refreshUploadFileProps() {
    this.uploadFilesProps = {
      msg: this.rulesetTab,
      path: `etc/${this.rulesetTab}`,
      upload: (files, path) => this.uploadFiles(files, path)
    };
  }

  /**
   * Uploads the files
   * @param {Array} files
   * @param {String} path
   */
  async uploadFiles(files, path) {
    try {
      this.errors = false;
      this.results = [];
      if (path === 'etc/rules') {
        this.upload = this.rulesetHandler.sendRuleConfiguration;
      } else if (path === 'etc/decoders') {
        this.upload = this.rulesetHandler.sendDecoderConfiguration;
      } else {
        this.upload = this.rulesetHandler.sendCdbList;
      }
      for (let idx in files) {
        const { file, content } = files[idx];
        try {
          await this.upload(file, content, true); // True does not overwrite the file
          this.results.push({
            index: idx,
            uploaded: true,
            file: file,
            error: 0
          });
        } catch (error) {
          this.errors = true;
          this.results.push({
            index: idx,
            uploaded: false,
            file: file,
            error: error
          });
        }
      }
      if (this.errors) throw this.results;
      ErrorHandler.info('Upload successful');
      return;
    } catch (error) {
      if (Array.isArray(error) && error.length) return Promise.reject(error);
      ErrorHandler.handle('Files cannot be uploaded');
    }
  }
}
