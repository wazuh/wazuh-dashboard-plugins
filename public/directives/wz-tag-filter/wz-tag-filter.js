/*
 * Wazuh app - Wazuh search and filter by tags bar
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import template from './wz-tag-filter.html';
import { DataFactory } from '../../services/data-factory';
import { uiModules } from 'ui/modules';

const app = uiModules.get('app/wazuh', []);

app.directive('wzTagFilter', function () {
  return {
    restrict: 'E',
    scope: {
      path: '=path',
      keys: '=keys',
      callback: '&'
    },
    controller(
      $scope,
      $timeout,
      apiReq
    ) {
      const instance = new DataFactory(
        apiReq,
        $scope.path,
        {}
      );

      $scope.tagList = [];
      $scope.newTag = '';
      $scope.isAutocomplete = false;
      $scope.dataModel = [];

      $scope.addTag = (flag = false) => {
        var input = document.getElementById('wz-search-filter-bar-input');
        input.blur();
        $scope.tagList.push($scope.newTag);

        $scope.showAutocomplete(flag);
        const term = $scope.newTag.split(':');
        const filter = { name: term[0], value: term[1] };
        $scope.callback({ 'filter': filter });
        $scope.newTag = '';
      };

      $scope.addTagKey = (key) => {
        $scope.newTag = key + ':';
        $scope.showAutocomplete(true);
      };

      $scope.addTagValue = (value) => {
        $scope.newTag += value;
        $scope.addTag();
      };

      $scope.removeTag = (idx) => {
        const term = $scope.tagList[idx].split(':');
        const filter = { name: term[0], value: 'all' };
        $scope.callback({ 'filter': filter });
        $scope.tagList.splice(idx, 1);
        $scope.showAutocomplete(false);
      };

      $scope.showAutocomplete = (flag) => {
        if (flag) {
          $scope.getAutocompleteContent();
        }
        $scope.isAutocomplete = flag;
        index_autocomplete(flag);
      };

      $scope.getAutocompleteContent = () => {
        const isKey = $scope.newTag.indexOf(':') === -1;
        $scope.autocompleteContent = { 'title': '', 'isKey': isKey, 'list': [] };
        $scope.autocompleteContent.title = isKey ? 'Tag keys' : 'Values';
        if (isKey) {
          $scope.keys.forEach(function (key) {
            $scope.autocompleteContent.list.push(key);
          });
        } else {
          const model = $scope.dataModel.find(function (x) { return x.key === $scope.newTag.split(':')[0] })
          if (model) {
            $scope.autocompleteContent.list = model.list;
          }
        }
      };

      $scope.addSearchKey = (e) => {
        if (e.key === ':') {
          $scope.getAutocompleteContent();
        }
      };

      function index_autocomplete(flag = true) {
        $timeout(function () {
          var autocomplete = document.getElementById('wz-search-filter-bar-autocomplete');
          var input = document.getElementById('wz-search-filter-bar-input');
          autocomplete.style.left = input.offsetLeft + 'px';
          if (flag) {
            input.focus();
          }
        }, 100);
      }

      const load = async () => {
        try {
          const result = await instance.fetch();
          $scope.keys.forEach(function (key) {
            $scope.dataModel.push({ 'key': key, 'list': result.items.map(function (x) { return x[key] }) });
          });
          return;
        } catch (error) {
          return Promise.reject(error);
        }
      };

      load();
    },
    template
  };
});
