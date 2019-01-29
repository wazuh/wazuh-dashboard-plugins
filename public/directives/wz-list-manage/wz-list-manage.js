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

const app = uiModules.get('app/wazuh', []);

app.directive('wzListManage', function () {
  return {
    restrict: 'E',
    scope: {
      list: '=list'
    },
    controller($scope, errorHandler, rulesetHandler, wazuhConfig) {
      $scope.currentList = $scope.list;
      const configuration = wazuhConfig.getConfig();
      $scope.adminMode = !!(configuration || {}).admin;
      const stringToObj = (string) => {
        let result = {};
        const splitted = string.split('\n');
        splitted.forEach(function (element) {
          const keyValue = element.split(':');
          if (keyValue[0])
            result[keyValue[0]] = keyValue[1];
        });
        return result;
      }

      const refresh = () => {
        rulesetHandler.getCdbList(`etc/lists/${$scope.currentList.name}`)
          .then(data => {
            $scope.currentList.list = stringToObj(data.data.data);
            $scope.$emit('setCurrentList', { currentList: $scope.currentList });
            $scope.viewingDetail = true;
            if (!$scope.$$phase) $scope.$digest();
          });
      }

      const saveList = async () => {
        try {
          let raw = '';
          for (var key in $scope.currentList.list) {
            raw = raw.concat(`${key}:${$scope.currentList.list[key]}` + '\n');
          }
          const result = await rulesetHandler.sendCdbList($scope.currentList.name, raw);
          refresh($scope.currentList);
          errorHandler.info(result.data.data, '');
        } catch (err) {
          refresh($scope.currentList);
          errorHandler.handle(err, 'Error updating list');
        }
      }

      $scope.addEntry = (key, value) => {
        if (!$scope.currentList.list[key]) {
          $scope.currentList.list[key] = value;
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
    },
    template
  };
});
