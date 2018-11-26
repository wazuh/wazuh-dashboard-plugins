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
      search: '&',
      filter: '&'
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
        const term = $scope.newTag.split(':');
        const obj = { name: term[0], value: term[1] };
        const isFilter = obj.value;
        const tag = {
          'value': $scope.newTag,
          'type': isFilter ? 'filter' : 'search'
        };
        const idxSearch = $scope.tagList.map(function (x) { return x.type; }).indexOf('search');
        if (!isFilter && idxSearch !== -1) { $scope.removeTag(idxSearch) };
        $scope.tagList.push(tag);
        $scope.showAutocomplete(flag);
        isFilter ? $scope.filter({ 'filter': obj }) : $scope.search({ 'search': obj.name });
        $scope.newTag = '';
      };

      $scope.addTagKey = (key) => {
        $scope.newTag = key + ':';
        $scope.showAutocomplete(true);
      };

      $scope.addTagValue = (value) => {
        $scope.newTag = $scope.newTag.substring(0, $scope.newTag.indexOf(':') + 1);
        $scope.newTag += value;
        $scope.addTag();
      };

      $scope.removeTag = (idx) => {
        const term = $scope.tagList[idx].value.split(':');
        const obj = term[1] ? { name: term[0], value: 'all' } : '';
        obj.value ? $scope.filter({ 'filter': obj }) : $scope.search({ 'search': obj.name });
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
        const term = $scope.newTag.split(':');
        const isKey = !term[1] && $scope.newTag.indexOf(':') === -1;
        $scope.autocompleteContent = { 'title': '', 'isKey': isKey, 'list': [] };
        $scope.autocompleteContent.title = isKey ? 'Filter keys' : 'Values';
        if (isKey) {
          const regex = new RegExp('^' + term[0], 'i');
          $scope.keys.forEach(function (key) {
            if (regex.test(key)) {
              $scope.autocompleteContent.list.push(key);
            }
          });
        } else {
          const regex = new RegExp('^' + term[1], 'i');
          const model = $scope.dataModel.find(function (x) { return x.key === $scope.newTag.split(':')[0] })
          if (model) {
            model.list = Array.isArray(model.list[0]) ? model.list[0] : model.list;
            $scope.autocompleteContent.list = model.list.filter(function (x) { return regex.test(x) });
          }
        }

      };

      $scope.addSearchKey = (e) => {
        $scope.getAutocompleteContent();
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
            $scope.dataModel.push({ 'key': key, 'list': result.items.map(function (x) { return key.split('.').reduce((a, b) => a ? a[b] : '', x) }) });
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
