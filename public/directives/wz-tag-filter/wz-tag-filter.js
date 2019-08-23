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

import template from './wz-tag-filter.html';
//import { DataFactory } from '../../services/data-factory';
import { uiModules } from 'ui/modules';

const app = uiModules.get('app/wazuh', []);

app.directive('wzTagFilter', function() {
  return {
    restrict: 'E',
    scope: {
      path: '=path',
      queryFn: '&',
      fieldsModel: '='
    },
    controller($scope, $timeout, apiReq, $document, errorHandler) {
      //Use when api call be implemented
      /* const instance = new DataFactory(
        apiReq,
        $scope.path,
        {}
      ); */

      $scope.tagList = [];
      $scope.groupedTagList = [];
      $scope.connectors = [];
      $scope.newTag = '';
      $scope.isAutocomplete = false;
      $scope.dataModel = [];

      /**
       * This add new tag to bar
       */
      $scope.addTag = (flag = false) => {
        try {
          const input = $document[0].getElementById(
            'wz-search-filter-bar-input'
          );
          input.blur();
          const term = $scope.newTag.split(':');
          const obj = {
            name: term[0].trim(),
            value: term[1] ? term[1].trim() : ''
          };
          const isFilter = obj.value;
          if (
            (isFilter &&
              $scope.fieldsModel &&
              Object.keys($scope.fieldsModel).indexOf(obj.name) === -1) ||
            (!isFilter && (!obj.name || /^\s*$/.test(obj.name)))
          ) {
            $scope.showAutocomplete(flag);
            $scope.newTag = '';
          } else {
            const tag = {
              id: generateUID(),
              key: obj.name,
              value: obj,
              type: isFilter ? 'filter' : 'search'
            };
            const idxSearch = $scope.tagList.find(x => x.type === 'search');
            if (!isFilter && idxSearch) {
              $scope.removeTag(
                idxSearch.id,
                false,
                $scope.searchIdx,
                undefined,
                true
              );
            }
            if (
              !$scope.tagList.find(x => {
                return (
                  x.type === 'filter' &&
                  x.key === tag.key &&
                  x.value.value.toUpperCase() === tag.value.value.toUpperCase()
                );
              })
            ) {
              $scope.tagList.push(tag);
              $scope.groupedTagList = groupBy($scope.tagList, 'key');
              $scope.connectors = addConnectors($scope.groupedTagList);
              buildQuery($scope.groupedTagList);
            }
            $scope.showAutocomplete(flag);
            $scope.newTag = '';
          }
        } catch (error) {
          errorHandler.handle(error, 'Error adding filter');
        }
      };

      /**
       * This build the q string with given groups of tags for performs the q search
       * @param {Array<Objects>} groups
       */
      const buildQuery = groups => {
        try {
          const queryObj = {
            query: '',
            search: ''
          };
          groups.forEach((group, idx) => {
            const search = group.find(x => x.type === 'search');
            if (search) {
              $scope.searchIdx = idx;
              queryObj.search = search.value.name;
              if (idx === groups.length - 1)
                queryObj.query = queryObj.query.substring(
                  0,
                  queryObj.query.length - 1
                );
            } else {
              const twoOrMoreElements = group.length > 1;
              if (twoOrMoreElements) {
                queryObj.query += '(';
              }
              group
                .filter(x => x.type === 'filter')
                .forEach((tag, idx2) => {
                  queryObj.query += tag.key + '=' + tag.value.value;
                  if (idx2 != group.length - 1) {
                    queryObj.query +=
                      $scope.connectors[idx].subgroup[idx2].value;
                  }
                });
              if (twoOrMoreElements) {
                queryObj.query += ')';
              }
              if (idx !== groups.length - 1) {
                queryObj.query += $scope.connectors[idx].value;
              }
            }
          });
          $scope.queryFn({ q: queryObj.query, search: queryObj.search });
        } catch (error) {
          errorHandler.handle(error, 'Error in query request');
        }
      };

      /**
       * This group tags by type (filter or search), and for filter key
       * @param {Array<Objects>} collection
       * @param {Object} property
       */
      const groupBy = (collection, property) => {
        const values = [];
        const result = [];

        for (const item of collection) {
          const index = values.indexOf(item[property]);
          if (index > -1 && item.type === 'filter') result[index].push(item);
          else {
            values.push(item[property]);
            result.push([item]);
          }
        }
        return result;
      };

      const addConnectors = groups => {
        const result = [];
        groups.forEach((group, index) => {
          result.push({});
          const subGroup = [];
          group.forEach((tag, idx) => {
            if (idx != group.length - 1) {
              subGroup.push({
                value:
                  (
                    ((($scope.connectors || [])[index] || {}).subgroup || [])[
                      idx
                    ] || {}
                  ).value || ','
              });
            }
          });
          if (subGroup.length > 0) result[index].subgroup = subGroup;
          if (index != groups.length - 1) {
            result[index].value =
              (($scope.connectors || [])[index] || {}).value || ';';
          }
        });
        return result;
      };

      $scope.changeConnector = (parentIdx, idx) => {
        if (
          (parentIdx === $scope.searchIdx - 1 ||
            parentIdx === $scope.searchIdx) &&
          idx === undefined
        ) {
          $scope.connectors[parentIdx].value = ';';
        } else {
          if (idx !== undefined) {
            $scope.connectors[parentIdx].subgroup[idx].value = ',';
          } else {
            const value = $scope.connectors[parentIdx].value;
            $scope.connectors[parentIdx].value = value === ';' ? ',' : ';';
            buildQuery($scope.groupedTagList);
          }
        }
      };

      /**
       * Add key part of filter to search bar
       */
      $scope.addTagKey = key => {
        $scope.newTag = key + ':';
        $scope.showAutocomplete(true);
      };

      /**
       * Add value part of filter to search bar, and add complete tag
       */
      $scope.addTagValue = value => {
        $scope.newTag = $scope.newTag.substring(
          0,
          $scope.newTag.indexOf(':') + 1
        );
        $scope.newTag += value;
        $scope.addTag();
      };

      /**
       * This remove tag from search bar
       */
      $scope.removeTag = (
        id,
        deleteGroup,
        parentIdx,
        idx,
        overwrite = false
      ) => {
        if (deleteGroup) {
          $scope.tagList = $scope.tagList.filter(x => x.key !== id);
          $scope.connectors.splice(parentIdx, 1);
        } else {
          $scope.tagList.splice($scope.tagList.findIndex(x => x.id === id), 1);
          if (idx < 0) {
            idx = 0;
          }
          if (
            $scope.connectors[parentIdx] &&
            $scope.connectors[parentIdx].subgroup
          ) {
            $scope.connectors[parentIdx].subgroup.splice(idx, 1);
          } else $scope.connectors.splice(parentIdx, 1);
        }
        if ($scope.tagList.length <= 1) {
          $scope.connectors = [{}];
        }
        $scope.groupedTagList = groupBy($scope.tagList, 'key');
        const search = $scope.tagList.find(x => x.type === 'search');
        if (!search) {
          $scope.searchIdx = false;
        }
        $scope.connectors = addConnectors($scope.groupedTagList);
        if (!overwrite) buildQuery($scope.groupedTagList);
        $scope.showAutocomplete(false);
      };

      $scope.removeAll = () => {
        $scope.tagList = [];
        $scope.connectors = [];
        $scope.groupedTagList = [];
        $scope.searchIdx = false;
        buildQuery($scope.groupedTagList);
        $scope.showAutocomplete(false);
      };

      /**
       * This show us the available filters in an autocomplete
       */
      $scope.showAutocomplete = flag => {
        if (flag) {
          $scope.getAutocompleteContent();
        }
        $scope.isAutocomplete = flag;
        indexAutocomplete(flag);
      };

      /**
       * This calculate the autocpmplete content (filter keys or filter values)
       * */
      $scope.getAutocompleteContent = () => {
        const term = $scope.newTag.split(':');
        const isKey = !term[1] && $scope.newTag.indexOf(':') === -1;
        $scope.autocompleteContent = { title: '', isKey: isKey, list: [] };
        $scope.autocompleteContent.title = isKey ? 'Filter keys' : 'Values';
        if (isKey && $scope.fieldsModel) {
          for (const key in $scope.fieldsModel) {
            if (key.toUpperCase().includes(term[0].trim().toUpperCase())) {
              $scope.autocompleteContent.list.push(key);
            }
          }
        } else {
          const model = $scope.dataModel.find(
            x => x.key === $scope.newTag.split(':')[0].trim()
          );
          if (model) {
            $scope.autocompleteContent.list = [
              ...new Set(
                model.list.filter(x =>
                  x.toUpperCase().includes(term[1].trim().toUpperCase())
                )
              )
            ];
          }
        }
      };

      /**
       * This force autocomplete refresh for every key pressed in search bar
       */
      $scope.addSearchKey = () => {
        if ($scope.autocompleteEnter) {
          $scope.autocompleteEnter = false;
        }
        $scope.getAutocompleteContent();
      };

      /**
       * This apply som style to autocomplete, to be displayed exactly below the input
       * @param {Boolean} flag Indicate if after apply style the autocomplete have to be shown
       */
      const indexAutocomplete = (flag = true) => {
        $timeout(() => {
          const bar = $document[0].getElementById('wz-search-filter-bar');
          const autocomplete = $document[0].getElementById(
            'wz-search-filter-bar-autocomplete'
          );
          const input = $document[0].getElementById(
            'wz-search-filter-bar-input'
          );
          autocomplete.style.left = input.offsetLeft - bar.scrollLeft + 'px';
          if (flag) {
            input.focus();
          }
          $('#wz-search-filter-bar-autocomplete-list li').removeClass(
            'selected'
          );
        }, 100);
      };

      /**
       * When controllers load
       */
      const load = async () => {
        try {
          //Use when api call be implemented
          //const result = await instance.fetch();
          if ($scope.fieldsModel) {
            Object.keys($scope.fieldsModel).forEach(key => {
              const list = $scope.fieldsModel[key];
              $scope.dataModel.push({ key, list });
            });
          }
          return;
        } catch (error) {
          return Promise.reject(error);
        }
      };

      /**
       * Generate a random id for a tag
       */
      const generateUID = () => {
        // I generate the UID from two parts here
        // to ensure the random number provide enough bits.
        let firstPart = (Math.random() * 46656) | 0;
        let secondPart = (Math.random() * 46656) | 0;
        firstPart = ('000' + firstPart.toString(36)).slice(-3);
        secondPart = ('000' + secondPart.toString(36)).slice(-3);
        return firstPart + secondPart;
      };

      /**
       * This set to bar a keydown listener to show the autocomplete
       */
      $('#wz-search-filter-bar-input').bind('keydown', function(e) {
        let $current = $('#wz-search-filter-bar-autocomplete-list li.selected');
        if ($current.length === 0 && (e.keyCode === 38 || e.keyCode === 40)) {
          $('#wz-search-filter-bar-autocomplete-list li')
            .first()
            .addClass('selected');
          $current = $('#wz-search-filter-bar-autocomplete-list li.selected');
        } else {
          let $next;
          switch (e.keyCode) {
            case 13: // enter
              if (
                $current.text().trim() &&
                !/^\s*$/.test($current.text().trim())
              ) {
                $scope.autocompleteEnter = true;
                $scope.autocompleteContent.isKey
                  ? $scope.addTagKey($current.text().trim())
                  : $scope.addTagValue($current.text().trim());
              }
              break;
            case 38: // if the UP key is pressed
              $next = $current.prev();
              break;
            case 40: // if the DOWN key is pressed
              $next = $current.next();
              break;
          }
          if (
            $next &&
            $next.length > 0 &&
            (e.keyCode === 38 || e.keyCode === 40)
          ) {
            const input = $document[0].getElementById(
              'wz-search-filter-bar-input'
            );
            input.focus();
            $('#wz-search-filter-bar-autocomplete-list li').removeClass(
              'selected'
            );
            $next.addClass('selected');
          }
        }
      });
      $('#wz-search-filter-bar-input').attr('autocomplete', 'off');

      $scope.$on('reloadSearchFilterBar', () => {
        buildQuery($scope.groupedTagList);
        $scope.$applyAsync();
      });
      load();
    },
    template
  };
});
