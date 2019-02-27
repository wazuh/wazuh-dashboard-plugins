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

export class FilesController {
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
    this.filesSubTab = 'rules';
  }


  switchFilesSubTab(tab) {
    this.filesSubTab = tab;
  }

  search(term) {
    this.$scope.$broadcast('wazuhSearch', { term, removeFilters: 0 });
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
        '/cdblists',
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
   * This function changes to the lists list view
   */
  closeDetailView() {

  }

  deleteFile() {

  }
}
