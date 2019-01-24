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

export function CdbListsController(
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
  $scope.isObject = item => typeof item === 'object';

  $scope.appliedFilters = [];
  /**
   * This performs a search with a given term
   */
  $scope.search = term => {
    if (term && term.startsWith('group:') && term.split('group:')[1].trim()) {
      $scope.custom_search = '';
      const filter = { name: 'group', value: term.split('group:')[1].trim() };
      $scope.appliedFilters = $scope.appliedFilters.filter(
        item => item.name !== 'group'
      );
      $scope.appliedFilters.push(filter);
      $scope.$broadcast('wazuhFilter', { filter });
    } else if (
      term &&
      term.startsWith('level:') &&
      term.split('level:')[1].trim()
    ) {
      $scope.custom_search = '';
      const filter = { name: 'level', value: term.split('level:')[1].trim() };
      $scope.appliedFilters = $scope.appliedFilters.filter(
        item => item.name !== 'level'
      );
      $scope.appliedFilters.push(filter);
      $scope.$broadcast('wazuhFilter', { filter });
    } else if (
      term &&
      term.startsWith('pci:') &&
      term.split('pci:')[1].trim()
    ) {
      $scope.custom_search = '';
      const filter = { name: 'pci', value: term.split('pci:')[1].trim() };
      $scope.appliedFilters = $scope.appliedFilters.filter(
        item => item.name !== 'pci'
      );
      $scope.appliedFilters.push(filter);
      $scope.$broadcast('wazuhFilter', { filter });
    } else if (
      term &&
      term.startsWith('gdpr:') &&
      term.split('gdpr:')[1].trim()
    ) {
      $scope.custom_search = '';
      const filter = { name: 'gdpr', value: term.split('gdpr:')[1].trim() };
      $scope.appliedFilters = $scope.appliedFilters.filter(
        item => item.name !== 'gdpr'
      );
      $scope.appliedFilters.push(filter);
      $scope.$broadcast('wazuhFilter', { filter });
    } else if (
      term &&
      term.startsWith('file:') &&
      term.split('file:')[1].trim()
    ) {
      $scope.custom_search = '';
      const filter = { name: 'file', value: term.split('file:')[1].trim() };
      $scope.appliedFilters = $scope.appliedFilters.filter(
        item => item.name !== 'file'
      );
      $scope.appliedFilters.push(filter);
      $scope.$broadcast('wazuhFilter', { filter });
    } else {
      $scope.$broadcast('wazuhSearch', { term, removeFilters: 0 });
    }
  };

  /**
   * This show us if new filter is already included in filters
   * @param {String} filterName
   */
  $scope.includesFilter = filterName =>
    $scope.appliedFilters.map(item => item.name).includes(filterName);

  /**
   * Get a filter given its name
   * @param {String} filterName
   */
  $scope.getFilter = filterName => {
    const filtered = $scope.appliedFilters.filter(
      item => item.name === filterName
    );
    return filtered.length ? filtered[0].value : '';
  };

  /**
   * This a the filter given its name
   * @param {String} filterName
   */
  $scope.removeFilter = filterName => {
    $scope.appliedFilters = $scope.appliedFilters.filter(
      item => item.name !== filterName
    );
    return $scope.$broadcast('wazuhRemoveFilter', { filterName });
  };

  //Initialization
  $scope.searchTerm = '';
  $scope.viewingDetail = false;
  $scope.isArray = Array.isArray;
  $scope.newKey = '';
  $scope.newValue = '';

  const configuration = wazuhConfig.getConfig();
  $scope.adminMode = !!(configuration || {}).admin;

  // Reloading event listener
  $scope.$on('rulesetIsReloaded', () => {
    $scope.viewingDetail = false;
    if (!$scope.$$phase) $scope.$digest();
  });

  /**
   * Get full data on CSV format
   */
  $scope.downloadCsv = async () => {
    try {
      errorHandler.info('Your download should begin automatically...', 'CSV');
      const currentApi = JSON.parse(appState.getCurrentAPI()).id;
      const output = await csvReq.fetch(
        '/cdblists',
        currentApi,
        wzTableFilter.get()
      );
      const blob = new Blob([output], { type: 'text/csv' }); // eslint-disable-line

      FileSaver.saveAs(blob, 'cdblists.csv');

      return;
    } catch (error) {
      errorHandler.handle(error, 'Download CSV');
    }
    return;
  };

  /**
   * This function takes back to the list but adding a filter from the detail view
   */
  $scope.addDetailFilter = (name, value) => {
    $scope.appliedFilters.push({ name, value });
    // Clear the autocomplete component
    $scope.searchTerm = '';
    // Go back to the list
    $scope.closeDetailView();
  };

  //listeners
  $scope.$on('wazuhShowCdbList', (event, parameters) => {
    //$scope.currentList = parameters.cdblist;
    $scope.currentList = {};
    rulesetHandler.getCdbList('/etc/lists/audit-keys')
      .then(data => {
        $scope.currentList.list = data.data.data;
        $scope.$emit('setCurrentList', { currentList: $scope.currentList });
        $scope.viewingDetail = true;
        if (!$scope.$$phase) $scope.$digest();
      });
  });

  const saveList = () => {
    try {
      rulesetHandler.sendCdbList('audit-key', $scope.currentList.list);
    } catch (err) {
      errorHandler.handle(err, 'Error updating list');
    }
  }

  $scope.addEntry = (key, value) => {
    if (!$scope.currentList.list[key]) {
      $scope.currentList.list[key] = value;
      $scope.newKey = '';
      $scope.newValue = '';
      saveList();
    } else {
      errorHandler.handle('Entry already exists', '');
    }
  }

  /**
 * Enable edition for a given key
 * @param {String} key Entry key
 */
  $scope.setEditingKey = (key, value) => {
    $scope.editingKey = key;
    $scope.editingNewValue = value;
  }
  /**
   * Cancel edition of an entry
   */
  $scope.cancelEditingKey = () => {
    $scope.editingKey = false;
    $scope.editingNewValue = '';
  }

  $scope.showConfirmRemoveEntry = (ev, key) => {
    $scope.removingEntry = key;
  };

  $scope.editKey = (key, newValue) => {
    $scope.loadingChange = true;
    $scope.currentList.list[key] = newValue;
    $scope.cancelEditingKey();
    $scope.loadingChange = false;
    saveList();
  }

  $scope.cancelRemoveEntry = () => {
    $scope.removingEntry = false;
  };

  $scope.confirmRemoveEntry = (key) => {
    delete $scope.currentList.list[key];
    $scope.removingEntry = false;
    saveList();
  };

  /**
   * This function changes to the lists list view
   */
  $scope.closeDetailView = clear => {
    if (clear)
      $scope.appliedFilters = $scope.appliedFilters.slice(
        0,
        $scope.appliedFilters.length - 1
      );
    $scope.viewingDetail = false;
    $scope.currentList = false;
    $scope.$emit('removeCurrentList');
    if (!$scope.$$phase) $scope.$digest();
  };

  if ($location.search() && $location.search().listname) {
    const incomingList = $location.search().listname;
    $location.search('listname', null);
    apiReq
      .request('get', `/cdblists/${incomingList}`, {})
      .then(data => {
        $scope.currentList = data.data.data.items[0];
        $scope.$emit('setCurrentList', { currentList: $scope.currentList });
        if (
          !(Object.keys(($scope.currentList || {}).details || {}) || []).length
        ) {
          $scope.currentList.details = false;
        }
        $scope.viewingDetail = true;
        if (!$scope.$$phase) $scope.$digest();
      })
      .catch(() =>
        errorHandler.handle(
          `Error fetching list: ${incomingList} from the Wazuh API`,
          'CDB Lists'
        )
      );
  }
}
