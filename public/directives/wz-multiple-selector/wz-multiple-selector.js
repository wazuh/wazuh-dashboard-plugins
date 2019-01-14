/*
 * Wazuh app - Wazuh Multiple selector
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import template from './wz-multiple-selector.html';
import { uiModules } from 'ui/modules';

const app = uiModules.get('app/wazuh', []);

app.directive('wzMultipleSelector', function() {
  return {
    restrict: 'E',
    scope: {
      availableItems: '=',
      selectedItems: '=',
      limit: '=',
      loading: '=',
      titleSelectedItems: '@',
      titleAvailableItems: '@',
      totalSelectedItems: '=',
      reloadScroll: '&'
    },
    controller($scope) {
      $scope.moveItem = (item, from, to, type) => {
        if (item.length) {
          item.forEach(elem => $scope.moveItem(elem, from, to, type));
        } else {
          const idx = from.findIndex(x => x.key === item.key);
          if (idx !== -1) {
            from.splice(idx, 1);
            item.type = !item.type ? type : '';
            to.push(item);
          }
        }
      };

      $scope.moveAll = (from, to, type) => {
        from.forEach(item => {
          item.type = !item.type ? type : '';
          to.push(item);
        });
        from.length = 0;
      };

      $scope.doCheckLimit = () => {
        if ($scope.checkLimit) {
          $scope.checkLimit();
        }
      };

      $scope.sort = a => {
        return parseInt(a.key);
      };

      $('#wzMultipleSelector select').scroll(function(ev) {
        scrollList(ev.currentTarget);
      });

      $scope.doReload = (element, searchTerm, start = false) => {
        $scope.reloadScroll({ element, searchTerm, start });
      };

      const scrollList = target => {
        const pos = target.scrollTop + target.offsetHeight;
        const max = target.scrollHeight;
        if (pos >= max) {
          target.parentElement.parentElement.parentElement.className ===
          'wzMultipleSelectorLeft'
            ? $scope.doReload('left')
            : $scope.doReload('right');
        }
      };
    },
    template
  };
});
