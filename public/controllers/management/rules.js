/*
 * Wazuh app - Ruleset controllers
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import * as FileSaver from '../../services/file-saver';

import { colors } from './colors';
import { AppState } from '../../react-services/app-state';
import { WazuhConfig } from '../../react-services/wazuh-config';


export class RulesController {
  /**
   * Class constructor
    * @param {Objet} $scope
    * @param {Objet} $sce
    * @param {Objet} errorHandler
    * @param {Objet} csvReq
    * @param {Objet} wzTableFilter
    * @param {Objet} $location
    * @param {Objet} apiReq
    * @param {Objet} rulesetHandler
   */

  constructor(
    $scope,
    $sce,
    errorHandler,
    csvReq,
    wzTableFilter,
    $location,
    apiReq,
    rulesetHandler
  ) {
    this.scope = $scope;
    this.sce = $sce;
    this.errorHandler = errorHandler;
    this.csvReq = csvReq;
    this.wzTableFilter = wzTableFilter;
    this.location = $location;
    this.apiReq = apiReq;
    this.wazuhConfig = new WazuhConfig();
    this.rulesetHandler = rulesetHandler;

    this.overwriteError = false;
    this.isObject = item => typeof item === 'object';
    this.mctrl = this.scope.mctrl;
    this.mctrl.showingLocalRules = false;
    this.mctrl.onlyLocalFiles = false;
    this.appliedFilters = [];
  }

  async $onInit() {
    // Props
    this.mainRulesProps = {
      section: 'rules',
      wzReq: (method, path, body) => this.apiReq.request(method, path, body)
    }

    //Initialization
    this.searchTerm = '';
    this.viewingDetail = false;
    this.isArray = Array.isArray;

    const configuration = this.wazuhConfig.getConfig();
    this.adminMode = !!(configuration || {}).admin;


    // Listeners
    this.scope.$on('closeRuleView', () => {
      this.closeDetailView();
    });

    this.scope.$on('rulesetIsReloaded', () => {
      this.viewingDetail = false;
      this.scope.$applyAsync();
    });

    this.scope.$on('wazuhShowRule', (event, parameters) => {
      this.currentRule = parameters.rule;
      this.scope.$emit('setCurrentRule', { currentRule: this.currentRule });
      if (!(Object.keys((this.currentRule || {}).details || {}) || []).length) {
        this.currentRule.details = false;
      }
      this.viewingDetail = true;
      this.scope.$applyAsync();
    });

    this.scope.$on('showRestart', () => {
      this.restartBtn = true;
      this.scope.$applyAsync();
    });

    this.scope.$on('showSaveAndOverwrite', () => {
      this.overwriteError = true;
      this.scope.$applyAsync();
    });

    this.scope.$on('applyFilter', (event, parameters) => {
      this.scope.search(parameters.filter, true);
    });

    this.scope.$on('viewFileOnlyTable', (event, parameters) => {
      parameters.viewingDetail = this.viewingDetail;
      this.mctrl.switchFilesSubTab('rules', { parameters });
    });

    if (this.location.search() && this.location.search().ruleid) {
      const incomingRule = this.location.search().ruleid;
      this.location.search('ruleid', null);
      try {
        const data = await this.apiReq.request('get', `/rules/${incomingRule}`, {});
        const response = (((data || {}).data || {}).data || {}).items || [];
        if (response.length) {
          const result = response.filter(rule => rule.details.overwrite);
          this.currentRule = result.length ? result[0] : response[0];
        }
        this.scope.$emit('setCurrentRule', { currentRule: this.currentRule });
        if (
          !(Object.keys((this.currentRule || {}).details || {}) || []).length
        ) {
          this.currentRule.details = false;
        }
        this.viewingDetail = true;
        this.scope.$applyAsync();
      } catch (error) {
        this.errorHandler.handle(
          `Error fetching rule: ${incomingRule} from the Wazuh API`
        )
      }
    }
  }

  /**
   * This performs a search with a given term
   * @param {String} term 
   * @param {Boolean} fromClick 
   */
  search(term, fromClick = false) {
    let clearInput = true;
    if (term && term.startsWith('group:') && term.split('group:')[1].trim()) {
      this.custom_search = '';
      const filter = { name: 'group', value: term.split('group:')[1].trim() };
      this.appliedFilters = this.appliedFilters.filter(
        item => item.name !== 'group'
      );

      this.appliedFilters.push(filter);
      this.scope.$broadcast('wazuhFilter', { filter });
    } else if (
      term &&
      term.startsWith('level:') &&
      term.split('level:')[1].trim()
    ) {
      this.custom_search = '';
      const filter = { name: 'level', value: term.split('level:')[1].trim() };
      this.appliedFilters = this.appliedFilters.filter(
        item => item.name !== 'level'
      );
      this.appliedFilters.push(filter);
      this.scope.$broadcast('wazuhFilter', { filter });
    } else if (
      term &&
      term.startsWith('pci:') &&
      term.split('pci:')[1].trim()
    ) {
      this.custom_search = '';
      const filter = { name: 'pci', value: term.split('pci:')[1].trim() };
      this.appliedFilters = this.appliedFilters.filter(
        item => item.name !== 'pci'
      );
      this.appliedFilters.push(filter);
      this.scope.$broadcast('wazuhFilter', { filter });
    } else if (
      term &&
      term.startsWith('gdpr:') &&
      term.split('gdpr:')[1].trim()
    ) {
      this.custom_search = '';
      const filter = { name: 'gdpr', value: term.split('gdpr:')[1].trim() };
      this.appliedFilters = this.appliedFilters.filter(
        item => item.name !== 'gdpr'
      );
      this.appliedFilters.push(filter);
      this.scope.$broadcast('wazuhFilter', { filter });
    } else if (
      term &&
      term.startsWith('hipaa:') &&
      term.split('hipaa:')[1].trim()
    ) {
      this.custom_search = '';
      const filter = { name: 'hipaa', value: term.split('hipaa:')[1].trim() };
      this.appliedFilters = this.appliedFilters.filter(
        item => item.name !== 'hipaa'
      );
      this.appliedFilters.push(filter);
      this.scope.$broadcast('wazuhFilter', { filter });
    } else if (
      term &&
      term.startsWith('nist-800-53:') &&
      term.split('nist-800-53:')[1].trim()
    ) {
      this.custom_search = '';
      const filter = {
        name: 'nist-800-53',
        value: term.split('nist-800-53:')[1].trim()
      };
      this.appliedFilters = this.appliedFilters.filter(
        item => item.name !== 'nist-800-53'
      );
      this.appliedFilters.push(filter);
      this.scope.$broadcast('wazuhFilter', { filter });
    } else if (
      term &&
      term.startsWith('file:') &&
      term.split('file:')[1].trim()
    ) {
      this.custom_search = '';
      const filter = { name: 'file', value: term.split('file:')[1].trim() };
      this.appliedFilters = this.appliedFilters.filter(
        item => item.name !== 'file'
      );
      this.appliedFilters.push(filter);
      this.scope.$broadcast('wazuhFilter', { filter });
    } else if (
      term &&
      term.startsWith('path:') &&
      term.split('path:')[1].trim()
    ) {
      this.custom_search = '';
      if (!this.mctrl.showingLocalRules) {
        const filter = { name: 'path', value: term.split('path:')[1].trim() };
        this.appliedFilters = this.appliedFilters.filter(
          item => item.name !== 'path'
        );
        this.appliedFilters.push(filter);
        this.scope.$broadcast('wazuhFilter', { filter });
      }
    } else {
      clearInput = false;
      this.scope.$broadcast('wazuhSearch', { term, removeFilters: 0 });
    }
    if (clearInput && !fromClick) {
      const searchBar = $('#search-input-rules');
      searchBar.val('');
    }
    this.scope.$applyAsync();
  }

  /**
 * This show us if new filter is already included in filters
 * @param {String} filterName
 */
  includesFilter(filterName) {
    return this.appliedFilters.map(item => item.name).includes(filterName);
  }

  /**
   * Get a filter given its name
   * @param {String} filterName
   */
  getFilter(filterName) {
    const filtered = this.appliedFilters.filter(
      item => item.name === filterName
    );
    const filter = filtered.length ? filtered[0].value : '';
    return filter;
  }


  /**
   * Swotch between tabs
   */
  switchLocalRules() {
    this.removeFilter('path');
    if (!this.mctrl.showingLocalRules) this.appliedFilters.push({ name: 'path', value: 'etc/rules' });
  }

  /**
   * This a the filter given its name
   * @param {String} filterName
   */
  removeFilter(filterName) {
    this.appliedFilters = this.appliedFilters.filter(
      item => item.name !== filterName
    );
    return this.scope.$broadcast('wazuhRemoveFilter', { filterName });
  }


  /**
  * This set color to a given rule argument
  * @param {String} ruleArg
  */
  colorRuleArg(ruleArg) {
    ruleArg = ruleArg.toString();
    let valuesArray = ruleArg.match(/\$\(((?!<\/span>).)*?\)(?!<\/span>)/gim);
    let coloredString = ruleArg;

    // If valuesArray is empty, means that the description doesn't have any arguments
    // In this case, then simply return the string
    // In other case, then colour the string and return
    if (valuesArray && valuesArray.length) {
      for (let i = 0, len = valuesArray.length; i < len; i++) {
        coloredString = coloredString.replace(
          /\$\(((?!<\/span>).)*?\)(?!<\/span>)/im,
          '<span style="color: ' +
          colors[i] +
          ' ">' +
          valuesArray[i] +
          '</span>'
        );
      }
    }

    return this.sce.trustAsHtml(coloredString);
  }

  /**
   * Get full data on CSV format
   */
  async downloadCsv() {
    try {
      this.errorHandler.info('Your download should begin automatically...', 'CSV');
      const currentApi = JSON.parse(AppState.getCurrentAPI()).id;
      const output = await this.csvReq.fetch(
        '/rules',
        currentApi,
        this.wzTableFilter.get()
      );
      const blob = new Blob([output], { type: 'text/csv' }); // eslint-disable-line

      FileSaver.saveAs(blob, 'rules.csv');

      return;
    } catch (error) {
      this.errorHandler.handle(error, 'Download CSV');
    }
    return;
  }

  /**
 * This function takes back to the list but adding a filter from the detail view
 * @param {String} name
 * @param {String} value
 */
  addDetailFilter(name, value) {
    // Go back to the list
    this.closeDetailView();
    this.search(`${name}:${value}`);
  }

  /**
   * Open a file
   * @param {String} file 
   * @param {String} path 
   */
  openFile(file, path) {
    if (file && path) {
      this.mctrl.switchFilesSubTab('rules', {
        parameters: {
          file: { file, path },
          path,
          viewingDetail: this.viewingDetail
        }
      });
    }
  }

  /**
   * Open an edit a rules file
   */
  async editRulesConfig() {
    this.editingFile = true;
    try {
      this.fetchedXML = await this.rulesetHandler.getRuleConfiguration(
        this.currentRule.file
      );
      this.location.search('editingFile', true);
      AppState.setNavigation({ status: true });
      this.scope.$applyAsync();
      this.scope.$broadcast('fetchedFile', { data: this.scope.fetchedXML });
    } catch (error) {
      this.fetchedXML = null;
      this.errorHandler.handle(error, 'Fetch file error');
    }
  }


  /**
   * Close the edition of the file
   */
  async closeEditingFile() {
    if (this.currentRule) {
      try {
        const ruleReloaded = await this.apiReq.request(
          'GET',
          `/rules/${this.currentRule.id}`,
          {}
        );
        const response =
          (((ruleReloaded || {}).data || {}).data || {}).items || [];
        if (response.length) {
          const result = response.filter(rule => rule.details.overwrite);
          this.currentRule = result.length ? result[0] : response[0];
        } else {
          this.currentRule = false;
          this.closeDetailView(true);
        }
        this.fetchedXML = false;
      } catch (error) {
        this.errorHandler.handle(error.message || error);
      }
    }

    this.editingFile = false;
    this.scope.$applyAsync();
    AppState.setNavigation({ status: true });
    this.scope.$broadcast('closeEditXmlFile', {});
    this.scope.$applyAsync();
  }

  /**
   * Checks if the XML is false
   */
  xmlIsValid() {
    this.xmlHasErrors = valid;
    this.scope.$applyAsync();
  }

  /**
   * This function changes to the rules list view
   */
  closeDetailView(clear) {
    this.mctrl.showingLocalRules = !this.mctrl.showingLocalRules;
    if (clear)
      this.appliedFilters = this.appliedFilters.slice(
        0,
        this.appliedFilters.length - 1
      );
    this.viewingDetail = false;
    this.currentRule = false;
    this.closeEditingFile();
    this.scope.$emit('removeCurrentRule');
    this.switchLocalRules();
    this.mctrl.showingLocalRules = !this.mctrl.showingLocalRules;
    this.scope.$applyAsync();
  }

  /**
   * Enable the save
   */
  toggleSaveConfig() {
    this.doingSaving = false;
    this.scope.$applyAsync();
  }

  /**
   * Enable the restart
   */
  toggleRestartMsg() {
    this.restartBtn = false;
    this.scope.$applyAsync();
  }

  /**
   * Cancel the save
   */
  cancelSaveAndOverwrite() {
    this.overwriteError = false;
    this.scope.$applyAsync();
  }

  /**
   * Emit the event to save the config
   */
  doSaveConfig() {
    const clusterInfo = AppState.getClusterInfo();
    const showRestartManager =
      clusterInfo.status === 'enabled' ? 'cluster' : 'manager';
    this.doingSaving = true;
    const objParam = {
      rule: this.currentRule,
      showRestartManager,
      isOverwrite: !!this.overwriteError
    }
    this.scope.$broadcast('saveXmlFile', objParam);
  }

  /**
   * Emit the event to restart
   */
  restart() {
    this.scope.$emit('performRestart', {});
  }
}

