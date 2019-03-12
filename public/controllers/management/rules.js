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

export function RulesController(
  $scope,
  $sce,
  errorHandler,
  appState,
  csvReq,
  wzTableFilter,
  $location,
  apiReq,
  wazuhConfig,
  rulesetHandler
) {
  $scope.showingLocalRules = false;
  $scope.overwriteError = false;
  $scope.switchLocalRules = () =>
    ($scope.showingLocalRules = !$scope.showingLocalRules);

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
    } else if (
      term &&
      term.startsWith('path:') &&
      term.split('path:')[1].trim()
    ) {
      $scope.custom_search = '';
      const filter = { name: 'path', value: term.split('path:')[1].trim() };
      $scope.appliedFilters = $scope.appliedFilters.filter(
        item => item.name !== 'path'
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

  const configuration = wazuhConfig.getConfig();
  $scope.adminMode = !!(configuration || {}).admin;

  /**
   * This set color to a given rule argument
   */
  $scope.colorRuleArg = ruleArg => {
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

    return $sce.trustAsHtml(coloredString);
  };

  $scope.$on('closeRuleView', () => {
    $scope.closeDetailView();
  });

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
        '/rules',
        currentApi,
        wzTableFilter.get()
      );
      const blob = new Blob([output], { type: 'text/csv' }); // eslint-disable-line

      FileSaver.saveAs(blob, 'rules.csv');

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
  $scope.$on('wazuhShowRule', (event, parameters) => {
    $scope.currentRule = parameters.rule;
    $scope.$emit('setCurrentRule', { currentRule: $scope.currentRule });
    if (!(Object.keys(($scope.currentRule || {}).details || {}) || []).length) {
      $scope.currentRule.details = false;
    }
    $scope.viewingDetail = true;
    if (!$scope.$$phase) $scope.$digest();
  });

  $scope.editRulesConfig = async () => {
    $scope.editingFile = true;
    try {
      $scope.fetchedXML = await rulesetHandler.getRuleConfiguration(
        $scope.currentRule.file
      );
      $location.search('editingFile', true);
      appState.setNavigation({ status: true });
      if (!$scope.$$phase) $scope.$digest();
      $scope.$broadcast('fetchedFile', { data: $scope.fetchedXML });
    } catch (error) {
      $scope.fetchedXML = null;
      errorHandler.handle(error, 'Fetch file error');
    }
  };

  $scope.closeEditingFile = async () => {
    if ($scope.currentRule) {
      try {
        const ruleReloaded = await apiReq.request(
          'GET',
          `/rules/${$scope.currentRule.id}`,
          {}
        );
        const response =
          (((ruleReloaded || {}).data || {}).data || {}).items || [];
        if (!response.length) {
          $scope.currentRule = null;
          $scope.showingLocalRules = true;
          $scope.closeDetailView(true);
        } else {
          $scope.currentRule = response[0];
        }
      } catch (err) {
        errorHandler.handle(err, 'Rule reload error.');
      }
    }
    $scope.editingFile = false;
    $scope.$applyAsync();
    appState.setNavigation({ status: true });
    $scope.$broadcast('closeEditXmlFile', {});
    if (!$scope.$$phase) $scope.$digest();
  };

  $scope.xmlIsValid = valid => {
    $scope.xmlHasErrors = valid;
    if (!$scope.$$phase) $scope.$digest();
  };

  /**
   * This function changes to the rules list view
   */
  $scope.closeDetailView = clear => {
    if (clear)
      $scope.appliedFilters = $scope.appliedFilters.slice(
        0,
        $scope.appliedFilters.length - 1
      );
    $scope.viewingDetail = false;
    $scope.currentRule = false;
    $scope.closeEditingFile();
    $scope.$emit('removeCurrentRule');
    if (!$scope.$$phase) $scope.$digest();
  };

  if ($location.search() && $location.search().ruleid) {
    const incomingRule = $location.search().ruleid;
    $location.search('ruleid', null);
    apiReq
      .request('get', `/rules/${incomingRule}`, {})
      .then(data => {
        $scope.currentRule = data.data.data.items[0];
        $scope.$emit('setCurrentRule', { currentRule: $scope.currentRule });
        if (
          !(Object.keys(($scope.currentRule || {}).details || {}) || []).length
        ) {
          $scope.currentRule.details = false;
        }
        $scope.viewingDetail = true;
        if (!$scope.$$phase) $scope.$digest();
      })
      .catch(() =>
        errorHandler.handle(
          `Error fetching rule: ${incomingRule} from the Wazuh API`,
          'Ruleset'
        )
      );
  }

  $scope.addNewFile = type => {
    $scope.editingFile = true;
    $scope.newFile = true;
    $scope.newFileName = '';
    $scope.selectedFileName = $scope.selectedRulesetTab;
    $scope.selectedItem = { file: 'new file' };
    $scope.fetchedXML = '<!-- Modify it at your will. -->';
    $scope.type = type;
    $scope.cancelSaveAndOverwrite();
    if (!$scope.$$phase) $scope.$digest();
    $location.search('editingFile', true);
    appState.setNavigation({ status: true });
    $scope.$emit('fetchedFile', { data: $scope.fetchedXML });
  };

  $scope.toggleSaveConfig = () => {
    $scope.doingSaving = false;
    $scope.$applyAsync();
  };

  $scope.toggleRestartMsg = () => {
    $scope.restartMsg = false;
    $scope.$applyAsync();
  };

  $scope.cancelSaveAndOverwrite = () => {
    $scope.overwriteError = false;
    $scope.$applyAsync();
  };

  $scope.doSaveConfig = (isNewFile, fileName) => {
    const clusterInfo = appState.getClusterInfo();
    const showRestartManager =
      clusterInfo.status === 'enabled' ? 'cluster' : 'manager';
    if (isNewFile && !fileName) {
      errorHandler.handle(
        'Error creating a new file. You need to specify a file name',
        ''
      );
      return false;
    } else {
      if (isNewFile) {
        const validFileName = /(.+).xml/;
        const containsBlanks = /.*[ ].*/;
        if (fileName && !validFileName.test(fileName)) {
          fileName = fileName + '.xml';
        }
        if (containsBlanks.test(fileName)) {
          errorHandler.handle(
            'Error creating a new file. The filename can not contain white spaces.',
            ''
          );
          return false;
        }
        $scope.selectedItem = { file: fileName };
      }
      $scope.doingSaving = true;
      const objParam = {
        rule: isNewFile ? $scope.selectedItem : $scope.currentRule,
        showRestartManager,
        isNewFile: !!isNewFile,
        isOverwrite: !!$scope.overwriteError
      };

      $scope.$broadcast('saveXmlFile', objParam);
    }
  };

  $scope.$on('showFileNameInput', () => {
    $scope.newFile = true;
    $scope.selectedItem = { file: 'new file' };
    $scope.$applyAsync();
  });

  $scope.restart = () => {
    $scope.$emit('performRestart', {});
  };

  $scope.$on('showRestartMsg', () => {
    $scope.restartMsg = true;
    $scope.$applyAsync();
  });

  $scope.$on('showSaveAndOverwrite', () => {
    $scope.overwriteError = true;
    $scope.$applyAsync();
  });
}
