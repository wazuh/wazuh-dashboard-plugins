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
      filter: '&',
      query: '&'
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
      $scope.groupedTagList = [];
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
          'id': generateUID(),
          'key': obj.name,
          'value': obj,
          'type': isFilter ? 'filter' : 'search'
        };
        const idxSearch = $scope.tagList.find(function (x) { return x.type === 'search' });
        if (!isFilter && idxSearch) { $scope.removeTag(idxSearch.id) };
        if (!$scope.tagList.find(function (x) { return x.type === 'filter' && x.key === tag.key && x.value.value === tag.value.value })) {
          $scope.tagList.push(tag);
          $scope.groupedTagList = groupBy($scope.tagList, 'key');
          isFilter ? $scope.query({ 'query': buildQuery($scope.groupedTagList) }) : $scope.search({ 'search': obj.name });
        }
        $scope.showAutocomplete(flag);
        $scope.newTag = '';
      };

      function buildQuery(groups, idx1) {
        let queryString = "?search=''&q=";
        groups.forEach(function (group) {
          queryString += "("
          group.forEach(function (tag, idx2) {
            queryString += tag.key + ":" + tag.value.value;
            if (idx2 != group.length - 1) {
              queryString += ",";
            }
          });
          queryString += ")"
          if (idx1 != groups.length - 1) {
            queryString += ";";
          }
        });
        console.log(queryString);
        return queryString;
      }

      function groupBy(collection, property) {
        var i = 0, val, index,
          values = [], result = [];
        for (; i < collection.length; i++) {
          val = collection[i][property];
          index = values.indexOf(val);
          if (index > -1)
            result[index].push(collection[i]);
          else {
            values.push(val);
            result.push([collection[i]]);
          }
        }
        return result;
      }

      $scope.addTagKey = (key) => {
        $scope.newTag = key + ':';
        $scope.showAutocomplete(true);
      };

      $scope.addTagValue = (value) => {
        $scope.newTag = $scope.newTag.substring(0, $scope.newTag.indexOf(':') + 1);
        $scope.newTag += value;
        $scope.addTag();
      };

      $scope.removeTag = (id) => {
        const term = $scope.tagList.find(function (x) { return x.id === id });
        term.type === 'filter' ? $scope.filter({ 'filter': { name: term.key, value: 'all' } }) : $scope.search({ 'search': '' });
        $scope.tagList.splice($scope.tagList.findIndex(function (x) { return x.id === id }), 1);
        $scope.groupedTagList = groupBy($scope.tagList, 'key');
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
            $scope.autocompleteContent.list = [...new Set(model.list.filter(function (x) { return regex.test(x) }))];
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

      function generateUID() {
        // I generate the UID from two parts here 
        // to ensure the random number provide enough bits.
        var firstPart = (Math.random() * 46656) | 0;
        var secondPart = (Math.random() * 46656) | 0;
        firstPart = ("000" + firstPart.toString(36)).slice(-3);
        secondPart = ("000" + secondPart.toString(36)).slice(-3);
        return firstPart + secondPart;
      }

      $('#wz-search-filter-bar-input').bind('keydown', function (e) {
        //let liSelected = document.getElementById('wz-search-filter-bar-autocomplete-list li.selected');
        let liSelected = $('#wz-search-filter-bar-autocomplete-list li.selected');
        if (e.which === 40) {
          if (liSelected != 0) {
            liSelected.removeClass('selected');
            next = liSelected.next();
            if (next.length > 0) {
              liSelected = next.addClass('selected');
            } else {
              liSelected = li.eq(0).addClass('selected');
            }
          } else {
            liSelected = li.eq(0).addClass('selected');
          }
        } else if (e.which === 38) {
          if (liSelected) {
            liSelected.removeClass('selected');
            next = liSelected.prev();
            if (next.length > 0) {
              liSelected = next.addClass('selected');
            } else {
              liSelected = li.last().addClass('selected');
            }
          } else {
            liSelected = li.last().addClass('selected');
          }
        }
      });
      load();
    },
    template
  };
});
