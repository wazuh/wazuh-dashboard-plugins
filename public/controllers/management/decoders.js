/*
 * Wazuh app - Ruleset controllers
 * Copyright (C) 2015-2019 Wazuh, Inc.
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

export class DecodersController {
  /**
   * Class Constructor
   * @param {*} $scope
   * @param {*} $sce
   * @param {*} errorHandler
   * @param {*} appState
   * @param {*} csvReq
   * @param {*} wzTableFilter
   */
  constructor(
    $scope,
    $sce,
    $location,
    errorHandler,
    appState,
    apiReq,
    csvReq,
    wzTableFilter,
    wazuhConfig,
    rulesetHandler
  ) {
    this.$scope = $scope;
    this.$sce = $sce;
    this.errorHandler = errorHandler;
    this.$location = $location;
    this.appState = appState;
    this.apiReq = apiReq;
    this.csvReq = csvReq;
    this.wzTableFilter = wzTableFilter;
    this.wazuhConfig = wazuhConfig;
    this.rulesetHandler = rulesetHandler;
    this.showingLocalDecoders = false;
  }

  /**
   * When controller loads
   */
  $onInit() {
    this.appliedFilters = [];

    //Initialization
    this.searchTerm = '';
    this.viewingDetail = false;
    this.typeFilter = 'all';
    this.isArray = Array.isArray;
    this.overwriteError = false;

    const configuration = this.wazuhConfig.getConfig();
    this.$scope.adminMode = !!(configuration || {}).admin;

    // Reloading event listener
    this.$scope.$on('rulesetIsReloaded', () => {
      this.viewingDetail = false;
      this.$scope.$applyAsync();
    });

    this.$scope.$on('closeDecoderView', () => {
      this.closeDetailView();
    });

    this.$scope.$on('wazuhShowDecoder', (event, parameters) => {
      this.currentDecoder = parameters.decoder;
      this.$scope.$emit('setCurrentDecoder', {
        currentDecoder: this.currentDecoder
      });
      this.viewingDetail = true;
      this.$scope.$applyAsync();
    });

    this.$scope.$on('showSaveAndOverwrite', () => {
      this.overwriteError = true;
      this.$scope.$applyAsync();
    });

    this.$scope.$on('showRestart', () => {
      this.$scope.restartBtn = true;
      this.$scope.$applyAsync();
    });

    this.$scope.$on('applyFilter', (event, parameters) => {
      this.search(parameters.filter, true);
    });

    this.$scope.$on('viewFileOnlyTable', (event, parameters) => {
      this.$scope.mctrl.switchFilesSubTab('decoders', { parameters });
    });
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
    return filtered.length ? filtered[0].value : '';
  }

  /**
   * This a the filter given its name
   * @param {String} filterName
   */
  removeFilter(filterName) {
    this.appliedFilters = this.appliedFilters.filter(
      item => item.name !== filterName
    );
    return this.$scope.$broadcast('wazuhRemoveFilter', { filterName });
  }

  /**
   * This set a color to a given regex
   * @param {String} regex
   */
  colorRegex(regex) {
    regex = regex.toString();
    let valuesArray = regex.match(/\(((?!<\/span>).)*?\)(?!<\/span>)/gim);
    let coloredString = regex;
    for (let i = 0, len = valuesArray.length; i < len; i++) {
      coloredString = coloredString.replace(
        /\(((?!<\/span>).)*?\)(?!<\/span>)/im,
        '<span style="color: ' + colors[i] + ' ">' + valuesArray[i] + '</span>'
      );
    }
    return this.$sce.trustAsHtml(coloredString);
  }

  /**
   * This set a color to a given order
   * @param {String} order
   */
  colorOrder(order) {
    order = order.toString();
    let valuesArray = order.split(',');
    let coloredString = order;
    for (let i = 0, len = valuesArray.length; i < len; i++) {
      coloredString = coloredString.replace(
        valuesArray[i],
        '<span style="color: ' + colors[i] + ' ">' + valuesArray[i] + '</span>'
      );
    }
    return this.$sce.trustAsHtml(coloredString);
  }

  switchLocalDecoders() {
    this.removeFilter('path');
    if (!this.showingLocalDecoders) {
      this.appliedFilters.push({ name: 'path', value: 'etc/decoders' });
    }
  }

  /**
   * This perfoms a search by a given term
   * @param {String} term
   */
  search(term, fromClick = false) {
    this.clearInput = true;
    if (term && term.startsWith('path:') && term.split('path:')[1].trim()) {
      if (!this.showingLocalDecoders) {
        const filter = { name: 'path', value: term.split('path:')[1].trim() };
        this.appliedFilters = this.appliedFilters.filter(
          item => item.name !== 'path'
        );
        this.appliedFilters.push(filter);
        this.$scope.$broadcast('wazuhFilter', { filter });
      }
    } else if (
      term &&
      term.startsWith('file:') &&
      term.split('file:')[1].trim()
    ) {
      const filter = { name: 'file', value: term.split('file:')[1].trim() };
      this.appliedFilters = this.appliedFilters.filter(
        item => item.name !== 'file'
      );
      this.appliedFilters.push(filter);
      this.$scope.$broadcast('wazuhFilter', { filter });
    } else {
      this.clearInput = false;
      this.$scope.$broadcast('wazuhSearch', { term, removeFilters: 0 });
    }
    if (this.clearInput && !fromClick) {
      this.custom_search = '';
    }
  }

  /**
   * Return only the parents decoder if type is distinct to all
   * @param {String} typeFilter
   */
  onlyParents(typeFilter) {
    this.appliedFilters = [];
    if (typeFilter === 'all')
      this.$scope.$broadcast('wazuhUpdateInstancePath', { path: '/decoders' });
    else
      this.$scope.$broadcast('wazuhUpdateInstancePath', {
        path: '/decoders/parents'
      });
  }

  /**
   * Get full decoders data on CSV format
   */
  async downloadCsv() {
    try {
      const path =
        this.typeFilter === 'parents' ? '/decoders/parents' : '/decoders';
      const currentApi = JSON.parse(this.appState.getCurrentAPI()).id;
      const output = await this.csvReq.fetch(
        path,
        currentApi,
        this.wzTableFilter.get()
      );
      const blob = new Blob([output], { type: 'text/csv' }); // eslint-disable-line

      FileSaver.saveAs(blob, 'decoders.csv');

      return;
    } catch (error) {
      this.errorHandler.handle(error, 'Download CSV');
    }
    return;
  }

  async editDecodersConfig() {
    this.editingFile = true;
    try {
      this.fetchedXML = await this.rulesetHandler.getDecoderConfiguration(
        this.currentDecoder.file
      );
      this.$location.search('editingFile', true);
      this.appState.setNavigation({ status: true });
      this.$scope.$applyAsync();
      this.$scope.$broadcast('fetchedFile', { data: this.fetchedXML });
    } catch (error) {
      this.fetchedXML = null;
      this.errorHandler.handle(error, 'Fetch file error');
    }
  }

  async closeEditingFile() {
    if (this.currentDecoder) {
      try {
        const decoderReload = await this.apiReq.request(
          'GET',
          `/decoders/${this.currentDecoder.name}`,
          {}
        );
        const response =
          (((decoderReload || {}).data || {}).data || {}).items || [];
        if (!response.length) {
          this.currentDecoder = null;
          this.closeDetailView(true);
        } else {
          this.currentDecoder = response[0];
        }
      } catch (err) {
        this.errorHandler.handle(err, 'Decoder reload error.');
      }
    }
    this.editingFile = false;
    this.$scope.$applyAsync();
    this.appState.setNavigation({ status: true });
    this.$scope.$broadcast('closeEditXmlFile', {});
  }

  xmlIsValid(valid) {
    this.xmlHasErrors = valid;
    this.$scope.$applyAsync();
  }

  /**
   * This function takes back to the list but adding a filter from the detail view
   */
  addDetailFilter(name, value) {
    // Go back to the list
    this.closeDetailView();
    this.search(`${name}:${value}`);
  }

  openFile(file, path) {
    if (file && path) {
      this.$scope.mctrl.switchFilesSubTab('rules', {
        parameters: { file: { file, path }, path }
      });
    }
  }

  /**
   * This function changes to the decoders list view
   */
  closeDetailView(clear) {
    if (clear)
      this.appliedFilters = this.appliedFilters.slice(
        0,
        this.appliedFilters.length - 1
      );
    this.viewingDetail = false;
    this.currentDecoder = false;
    this.closeEditingFile();
    this.$scope.$emit('removeCurrentDecoder');
    this.$scope.$applyAsync();
  }

  toggleSaveConfig = () => {
    this.doingSaving = false;
    this.$scope.$applyAsync();
  };

  cancelSaveAndOverwrite = () => {
    this.overwriteError = false;
    this.$scope.$applyAsync();
  };

  doSaveConfig() {
    const clusterInfo = this.appState.getClusterInfo();
    const showRestartManager =
      clusterInfo.status === 'enabled' ? 'cluster' : 'manager';
    this.doingSaving = true;
    const objParam = {
      decoder: this.currentDecoder,
      showRestartManager,
      isOverwrite: !!this.overwriteError
    };
    this.$scope.$broadcast('saveXmlFile', objParam);
  }

  restart = () => {
    this.$scope.$emit('performRestart', {});
  };
}
