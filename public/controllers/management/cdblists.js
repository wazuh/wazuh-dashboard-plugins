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
import { stringToObj } from '../../utils/cdblist-to-object';

export class CdbListsController {
  constructor(
    $scope,
    errorHandler,
    appState,
    csvReq,
    wzTableFilter,
    $location,
    apiReq,
    wazuhConfig,
    rulesetHandler
  ) {
    this.$scope = $scope;
    this.errorHandler = errorHandler;
    this.appState = appState;
    this.csvReq = csvReq;
    this.wzTableFilter = wzTableFilter;
    this.$location = $location;
    this.apiReq = apiReq;
    this.wazuhConfig = wazuhConfig;
    this.rulesetHandler = rulesetHandler;

    this.appliedFilters = [];
    this.searchTerm = '';
    this.viewingDetail = false;
    this.isArray = Array.isArray;
    this.newKey = '';
    this.newValue = '';
  }

  $onInit() {
    const configuration = this.wazuhConfig.getConfig();
    this.adminMode = !!(configuration || {}).admin;

    // Reloading event listener
    this.$scope.$on('rulesetIsReloaded', () => {
      this.viewingDetail = false;
      if (!this.$scope.$$phase) this.$scope.$digest();
    });

    this.$scope.$on('closeListView', () => {
      this.closeDetailView();
    });

    this.$scope.$on('wazuhShowCdbList', async (ev, parameters) => {
      this.currentList = parameters.cdblist;
      try {
        const data = await this.rulesetHandler.getCdbList(
          `${this.currentList.path}/${this.currentList.name}`
        );
        this.currentList.list = stringToObj(data.data.data);
        this.viewingDetail = true;
        this.$scope.$emit('setCurrentList', { currentList: this.currentList });
      } catch (error) {
        this.currentList.list = [];
        this.errorHandler.handle(error, '');
      }
      this.$scope.$broadcast('changeCdbList', {
        currentList: this.currentList
      });
      if (!this.$scope.$$phase) this.$scope.$digest();
    });

    const currentLocation = this.$location.search();
    if ((currentLocation || {}).listname) {
      const incomingList = this.$location.search().listname;
      this.$location.search('listname', null);
      this.apiReq
        .request('get', `/cdblists/${incomingList}`, {})
        .then(data => {
          this.currentList = data.data.data.items[0];
          this.$scope.$emit('setCurrentList', {
            currentList: this.currentList
          });
          if (
            !(Object.keys((this.currentList || {}).details || {}) || []).length
          ) {
            this.currentList.details = false;
          }
          this.viewingDetail = true;
          if (!this.$scope.$$phase) this.$scope.$digest();
        })
        .catch(() =>
          this.errorHandler.handle(
            `Error fetching list: ${incomingList} from the Wazuh API`,
            'CDB Lists'
          )
        );
    }
  }

  search(term) {
    if (term && term.startsWith('group:') && term.split('group:')[1].trim()) {
      this.custom_search = '';
      const filter = { name: 'group', value: term.split('group:')[1].trim() };
      this.appliedFilters = this.appliedFilters.filter(
        item => item.name !== 'group'
      );
      this.appliedFilters.push(filter);
      this.$scope.$broadcast('wazuhFilter', { filter });
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
      this.$scope.$broadcast('wazuhFilter', { filter });
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
      this.$scope.$broadcast('wazuhFilter', { filter });
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
      this.$scope.$broadcast('wazuhFilter', { filter });
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
      this.$scope.$broadcast('wazuhFilter', { filter });
    } else {
      this.$scope.$broadcast('wazuhSearch', { term, removeFilters: 0 });
    }
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
   * Get full data on CSV format
   */
  async downloadCsv() {
    try {
      this.errorHandler.info(
        'Your download should begin automatically...',
        'CSV'
      );
      const currentApi = JSON.parse(this.appState.getCurrentAPI()).id;
      const output = await this.csvReq.fetch(
        '/lists',
        currentApi,
        this.wzTableFilter.get()
      );
      const blob = new Blob([output], { type: 'text/csv' }); // eslint-disable-line

      FileSaver.saveAs(blob, 'cdblists.csv');
    } catch (error) {
      this.errorHandler.handle(error, 'Download CSV');
    }
    return;
  }

  /**
   * This function takes back to the list but adding a filter from the detail view
   */
  addDetailFilter(name, value) {
    this.appliedFilters.push({ name, value });
    // Clear the autocomplete component
    this.searchTerm = '';
    // Go back to the list
    this.closeDetailView();
  }

  /**
   * This function changes to the lists list view
   */
  closeDetailView(clear) {
    if (clear)
      this.appliedFilters = this.appliedFilters.slice(
        0,
        this.appliedFilters.length - 1
      );
    this.viewingDetail = false;
    this.currentList = false;
    this.addingList = false;
    this.$scope.$emit('removeCurrentList');
    if (!this.$scope.$$phase) this.$scope.$digest();
  }

  addNewList() {
    this.addingList = true;
    this.currentList = {
      name: '',
      path: 'etc/lists/',
      list: [],
      new: true
    };
    this.viewingDetail = true;
    if (!this.$scope.$$phase) this.$scope.$digest();
    this.$scope.$broadcast('changeCdbList', {
      currentList: this.currentList
    });
  }
}
