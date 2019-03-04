/*
 * Wazuh app - Wazuh search and filter by tags bar
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import template from './wz-list-manage.html';
import { uiModules } from 'ui/modules';
import * as pagination from '../wz-table/lib/pagination';
import { checkGap } from '../wz-table/lib/check-gap';

const app = uiModules.get('app/wazuh', []);

app.directive('wzListManage', function() {
  return {
    restrict: 'E',
    scope: {
      list: '=list',
      closeFn: '&',
      hideClose: '='
    },
    controller(
      $scope,
      errorHandler,
      $filter,
      rulesetHandler,
      wazuhConfig,
      appState
    ) {
      const clusterInfo = appState.getClusterInfo();

      /**
       * Pagination variables and functions
       */
      $scope.itemsPerPage = $scope.rowsPerPage || 10;
      $scope.pagedItems = [];
      $scope.currentPage = 0;
      let items = [];
      $scope.gap = 0;
      const searchTable = () => pagination.searchTable($scope, items);
      $scope.groupToPages = () => pagination.groupToPages($scope);
      $scope.range = (size, start, end) =>
        pagination.range(size, start, end, $scope.gap);
      $scope.prevPage = () => pagination.prevPage($scope);
      $scope.nextPage = async currentPage =>
        pagination.nextPage(currentPage, $scope, errorHandler, null);
      $scope.setPage = function() {
        $scope.currentPage = this.n;
        $scope.nextPage(this.n);
      };

      /**
       * This apply filter and sorting to table data
       */
      $scope.filterTable = data => {
        const result = Object.keys(data || $scope.currentList.list).map(key => {
          return [key, $scope.currentList.list[key]];
        });

        items = $filter('filter')(result, $scope.searchTerm);
        $scope.totalItems = items.length;
        $scope.items = items;
        checkGap($scope, items);
        searchTable();
      };

      const fetch = () => {
        try {
          $scope.filterTable();
          return;
        } catch (error) {
          errorHandler.handle(error, 'Error loading table');
        }
        return;
      };

      $scope.currentList = $scope.list;
      if ($scope.currentList.list) fetch();
      const configuration = wazuhConfig.getConfig();
      $scope.adminMode = !!(configuration || {}).admin;

      $scope.sortValue = '';
      $scope.sortReverse = false;
      $scope.searchTerm = '';

      $scope.$on('changeCdbList', (ev, params) => {
        if (params.currentList) {
          $scope.currentList = params.currentList;
          fetch();
        }
      });

      $scope.saveList = async () => {
        $scope.doingSaving = true;
        let addingNew = false;
        try {
          if ($scope.currentList.new && !$scope.currentList.newName) {
            $scope.currentList.list = [];
            throw new Error('New list name is needed');
          } else if ($scope.currentList.new && $scope.currentList.newName) {
            addingNew = true;
            $scope.currentList.name = $scope.currentList.newName;
          }
          const containsBlanks = /.*[ ].*/;
          if (containsBlanks.test($scope.currentList.name)) {
            throw new Error(
              'Error creating a new file. The filename can not contain white spaces.'
            );
          }
          let raw = '';
          for (var key in $scope.currentList.list) {
            raw = raw.concat(`${key}:${$scope.currentList.list[key]}` + '\n');
          }
          await rulesetHandler.sendCdbList(
            $scope.currentList.name,
            raw,
            addingNew ? !$scope.overwriteError : false
          );
          const msg = 'Success. CDB list has been updated';
          showRestartMessage(
            msg,
            clusterInfo.status === 'enabled' ? 'cluster' : 'manager'
          );
          fetch();
          $scope.doingSaving = false;
          $scope.loadingChange = false;
          if (!$scope.$$phase) $scope.$digest();
        } catch (err) {
          if (addingNew) {
            $scope.currentList.name = false;
            $scope.$applyAsync();
          }
          $scope.doingSaving = false;
          if ((err || '').includes('Wazuh API error: 1905')) {
            $scope.overwriteError = true;
            errorHandler.handle('File name already exists');
          } else {
            errorHandler.handle(err, 'Error updating list');
          }
          $scope.loadingChange = false;
        }
      };

      $scope.addEntry = (key, value) => {
        if (!$scope.currentList.list[key]) {
          $scope.currentList.list[key] = value ? value : '';
          fetch();
        } else {
          errorHandler.handle('Entry already exists', '');
        }
      };

      /**
       * Enable edition for a given key
       * @param {String} key Entry key
       */
      $scope.setEditingKey = (key, value) => {
        $scope.editingKey = key;
        $scope.currentList.editingNewValue = value;
      };
      /**
       * Cancel edition of an entry
       */
      $scope.cancelEditingKey = () => {
        $scope.editingKey = false;
        $scope.editingNewValue = '';
      };

      $scope.showConfirmRemoveEntry = (ev, key) => {
        $scope.removingEntry = key;
      };

      $scope.editKey = key => {
        $scope.loadingChange = true;
        $scope.currentList.list[key] = $scope.currentList.editingNewValue;
        $scope.currentList.editingNewValue = '';
        $scope.cancelEditingKey();
        fetch();
      };

      $scope.cancelRemoveEntry = () => {
        $scope.removingEntry = false;
      };

      $scope.confirmRemoveEntry = key => {
        delete $scope.currentList.list[key];
        $scope.removingEntry = false;
        fetch();
      };

      const showRestartMessage = async msg => {
        errorHandler.info(msg);
        $scope.restartMsg = true;
        $scope.$applyAsync();
      };

      $scope.restart = () => {
        $scope.$emit('performRestart', {});
      };
    },
    template
  };
});
