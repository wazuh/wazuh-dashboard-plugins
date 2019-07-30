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
import * as FileSaver from '../../services/file-saver';

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
      appState,
      csvReq
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
      $scope.firstPage = function() {
        $scope.setPage(1);
        $scope.prevPage();
      };
      $scope.setPage = function(page = false) {
        if (page === 0 || page === -1) {
          $scope.firstPage();
        } else {
          this.n = page || this.n;
          $scope.n = this.n;
          $scope.currentPage = this.n;
          $scope.nextPage(this.n);
        }
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
        $scope.currentItems = Object.keys($scope.currentList.list);
        checkGap($scope, items);
        searchTable();
      };

      const fetch = () => {
        try {
          $scope.filterTable();
          $scope.$applyAsync();
          return;
        } catch (error) {
          errorHandler.handle(error.message || error);
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
          $scope.$applyAsync();
        } catch (error) {
          if (addingNew) {
            $scope.currentList.name = false;
          }
          $scope.doingSaving = false;
          if (
            (error.message || error || '').includes('Wazuh API error: 1905')
          ) {
            $scope.overwriteError = true;
            errorHandler.handle('File name already exists');
          } else {
            errorHandler.handle(error.message || error);
          }
          $scope.loadingChange = false;
          $scope.$applyAsync();
        }
      };

      $scope.downloadCsv = async (path, fileName, filePath) => {
        try {
          errorHandler.info(
            'Your download should begin automatically...',
            'CSV'
          );
          const filters = [{ name: 'path', value: filePath + '/' + fileName }];
          const currentApi = JSON.parse(appState.getCurrentAPI()).id;
          const output = await csvReq.fetch(path, currentApi, filters);
          const blob = new Blob([output], { type: 'text/csv' }); // eslint-disable-line

          FileSaver.saveAs(blob, fileName + '.csv');
        } catch (error) {
          errorHandler.handle(error, 'Download CSV');
        }
        return;
      };

      $scope.addEntry = (key, value) => {
        if (!$scope.currentList.list[key]) {
          $scope.currentList.list[key] = value ? value : '';
          fetch();
        } else {
          errorHandler.handle('Entry already exists');
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
        $scope.loadingChange = false;
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
        const page = $scope.currentPage;
        delete $scope.currentList.list[key];
        $scope.removingEntry = false;
        fetch();
        $scope.setPage(
          $scope.pagedItems.length - 1 < $scope.n ? page - 1 : page
        );
      };

      const showRestartMessage = async msg => {
        errorHandler.info(msg);
        $scope.restartBtn = true;
        $scope.$applyAsync();
      };

      $scope.restart = () => {
        $scope.restartBtn = false;
        $scope.$emit('performRestart', {});
      };
    },
    template
  };
});
