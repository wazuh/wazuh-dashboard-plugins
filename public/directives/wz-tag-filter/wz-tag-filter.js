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
      queryFn: '&',
      fieldsModel: '='
    },
    controller(
      $scope,
      $timeout,
      apiReq,
      $document,
      errorHandler
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
        try {
          const input = $document[0].getElementById('wz-search-filter-bar-input');
          input.blur();
          const term = $scope.newTag.split(':');
          const obj = { name: term[0], value: term[1] };
          const onlyCharsNums = /[^A-Za-z0-9]+/;
          const isFilter = obj.value;
          if ((isFilter && Object.keys($scope.fieldsModel).indexOf(obj.name) === -1) ||
            (isFilter && onlyCharsNums.test(obj.value)) ||
            (!isFilter && onlyCharsNums.test(obj.name))) {
            $scope.showAutocomplete(flag);
            $scope.newTag = '';
          } else {
            const tag = {
              'id': generateUID(),
              'key': obj.name,
              'value': obj,
              'type': isFilter ? 'filter' : 'search'
            };
            const idxSearch = $scope.tagList.find(function (x) { return x.type === 'search' });
            if (!isFilter && idxSearch) { $scope.removeTag(idxSearch.id, false) };
            if (!$scope.tagList.find(function (x) { return x.type === 'filter' && x.key === tag.key && x.value.value === tag.value.value })) {
              $scope.tagList.push(tag);
              $scope.groupedTagList = groupBy($scope.tagList, 'key');
              buildQuery($scope.groupedTagList);
            }
            $scope.showAutocomplete(flag);
            $scope.newTag = '';
          }
        } catch (error) {
          errorHandler.handle(error, 'Add filter');
        }
      };

      const buildQuery = groups => {
        try {
          let queryObj = {
            'query': '',
            'search': ''
          };
          let first = true;
          groups.forEach(function (group, idx1) {
            const search = group.find(function (x) { return x.type === 'search' });
            if (search) {
              queryObj.search = search.value.name;
            }
            else {
              if (!first) {
                queryObj.query += ';';
              }
              const twoOrMoreElements = group.length > 1;
              if (twoOrMoreElements) {
                queryObj.query += '('
              }
              group.filter(function (x) { return x.type === 'filter' }).forEach(function (tag, idx2) {
                queryObj.query += tag.key + '=' + tag.value.value;
                if (idx2 != group.length - 1) {
                  queryObj.query += ',';
                }
              });
              if (twoOrMoreElements) {
                queryObj.query += ')'
              }
              first = false;
            }
          });
          $scope.queryFn({ 'q': queryObj.query, 'search': queryObj.search });
        } catch (error) {
          errorHandler.handle(error, 'Query filter request');
        }
      }

      const groupBy = (collection, property) => {
        let i = 0, val, index,
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

      $scope.removeTag = (id, deleteGroup) => {
        if (deleteGroup) {
          $scope.tagList = $scope.tagList.filter(function (x) { return x.key !== id });
        } else {
          $scope.tagList.splice($scope.tagList.findIndex(function (x) { return x.id === id }), 1);
        }
        $scope.groupedTagList = groupBy($scope.tagList, 'key');
        buildQuery($scope.groupedTagList);
        $scope.showAutocomplete(false);
      };

      $scope.showAutocomplete = (flag) => {
        if (flag) {
          $scope.getAutocompleteContent();
        }
        $scope.isAutocomplete = flag;
        indexAutocomplete(flag);
      };

      $scope.getAutocompleteContent = () => {
        const term = $scope.newTag.split(':');
        const isKey = !term[1] && $scope.newTag.indexOf(':') === -1;
        $scope.autocompleteContent = { 'title': '', 'isKey': isKey, 'list': [] };
        $scope.autocompleteContent.title = isKey ? 'Filter keys' : 'Values';
        if (isKey) {
          for (let key in $scope.fieldsModel) {
            if (key.toUpperCase().includes(term[0].toUpperCase())) {
              $scope.autocompleteContent.list.push(key);
            }
          }
        } else {
          const model = $scope.dataModel.find(function (x) { return x.key === $scope.newTag.split(':')[0] })
          if (model) {
            $scope.autocompleteContent.list = [...new Set(model.list.filter(function (x) { return x.toUpperCase().includes(term[1].toUpperCase()); }))];
          }
        }
      };

      $scope.addSearchKey = (e) => {
        if ($scope.autocompleteEnter) {
          $scope.autocompleteEnter = false;
        }
        $scope.getAutocompleteContent();
      };

      const indexAutocomplete = (flag = true) => {
        $timeout(function () {
          const bar = $document[0].getElementById('wz-search-filter-bar');
          const autocomplete = $document[0].getElementById('wz-search-filter-bar-autocomplete');
          const input = $document[0].getElementById('wz-search-filter-bar-input');
          autocomplete.style.left = input.offsetLeft - bar.scrollLeft + 'px';
          if (flag) {
            input.focus();
          }
          $('#wz-search-filter-bar-autocomplete-list li').removeClass('selected');
        }, 100);
      }

      const load = async () => {
        try {
          const result = await instance.fetch();
          Object.keys($scope.fieldsModel).forEach(function (key) {
            $scope.dataModel.push({ 'key': key, 'list': $scope.fieldsModel[key] });
          });
          return;
        } catch (error) {
          return Promise.reject(error);
        }
      };

      const generateUID = () => {
        // I generate the UID from two parts here 
        // to ensure the random number provide enough bits.
        let firstPart = (Math.random() * 46656) | 0;
        let secondPart = (Math.random() * 46656) | 0;
        firstPart = ('000' + firstPart.toString(36)).slice(-3);
        secondPart = ('000' + secondPart.toString(36)).slice(-3);
        return firstPart + secondPart;
      }

      $('#wz-search-filter-bar-input').bind('keydown', function (e) {
        let $current = $('#wz-search-filter-bar-autocomplete-list li.selected');
        if ($current.length === 0) {
          $('#wz-search-filter-bar-autocomplete-list li').first().addClass('selected');
          $current = $('#wz-search-filter-bar-autocomplete-list li.selected');
        } else {
          let $next;
          switch (e.keyCode) {
            case 13: // enter
              $scope.autocompleteEnter = true;
              $scope.autocompleteContent.isKey ? $scope.addTagKey($current.text().trim()) : $scope.addTagValue($current.text().trim());
              break;
            case 38: // if the UP key is pressed
              $next = $current.prev();
              break;
            case 40: // if the DOWN key is pressed
              $next = $current.next();
              break;
          }
          if ($next && $next.length > 0 && (e.keyCode === 38 || e.keyCode === 40)) {
            const input = $document[0].getElementById('wz-search-filter-bar-input');
            input.focus();
            $('#wz-search-filter-bar-autocomplete-list li').removeClass('selected');
            $next.addClass('selected');
          }
        }
      });
      load();
    },
    template
  };
});
