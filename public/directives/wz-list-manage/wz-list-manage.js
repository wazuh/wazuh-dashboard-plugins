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
      list: '=list'
    },
    controller($scope, errorHandler, $filter, rulesetHandler, wazuhConfig) {
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
        const result = Object.keys(data || $scope.currentList.list).map(
          function(key) {
            return [key, $scope.currentList.list[key]];
          }
        );

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

      const stringToObj = string => {
        let result = {};
        const splitted = string.split('\n');
        splitted.forEach(function(element) {
          const keyValue = element.split(':');
          if (keyValue[0]) result[keyValue[0]] = keyValue[1];
        });
        return result;
      };

      $scope.$watch('currentList.list', () => {
        if ($scope.currentList.list) fetch();
      });

      const refresh = () => {
        rulesetHandler
          .getCdbList(`etc/lists/${$scope.currentList.name}`)
          .then(data => {
            $scope.currentList.list = stringToObj(data.data.data);
            fetch();
            $scope.$emit('setCurrentList', { currentList: $scope.currentList });
            $scope.viewingDetail = true;
            if (!$scope.$$phase) $scope.$digest();
          });
      };

      $scope.$on('changeCdbList', (ev, params) => {
        if (params.currentList) {
          $scope.currentList = params.currentList;
          fetch();
        }
      });

      const saveList = async () => {
        try {
          let raw = '';
          for (var key in $scope.currentList.list) {
            raw = raw.concat(`${key}:${$scope.currentList.list[key]}` + '\n');
          }
          const result = await rulesetHandler.sendCdbList(
            $scope.currentList.name,
            raw
          );
          fetch();
          errorHandler.info(result.data.data, '');
          $scope.loadingChange = false;
          if (!$scope.$$phase) $scope.$digest();
        } catch (err) {
          refresh();
          errorHandler.handle(err, 'Error updating list');
          $scope.loadingChange = false;
        }
      };

      $scope.addEntry = (key, value) => {
        if (!$scope.currentList.list[key]) {
          $scope.currentList.list[key] = value;
          saveList();
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
        $scope.editingNewValue = value;
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

      $scope.editKey = (key, newValue) => {
        $scope.loadingChange = true;
        $scope.currentList.list[key] = newValue;
        $scope.cancelEditingKey();
        saveList();
      };

      $scope.cancelRemoveEntry = () => {
        $scope.removingEntry = false;
      };

      $scope.confirmRemoveEntry = key => {
        delete $scope.currentList.list[key];
        $scope.removingEntry = false;
        saveList();
      };
    },
    template
  };
});
