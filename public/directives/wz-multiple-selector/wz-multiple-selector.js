/*
 * Wazuh app - Wazuh Multiple selector
 * Copyright (C) 2018 Wazuh, Inc.
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

app.directive('wzMultipleSelector', function () {
  return {
    restrict: "E",
    scope: {
      availableItems: "=",
      selectedItems: "=",
      limit: "=",
      loading: "=",
      titleSelectedItems: "@",
      titleAvailableItems: "@",
      reloadScroll: '&'
    },
    controller(
      $scope
    ) {
      $scope.moveItem = function (item, from, to) {
        if (item.length > 0) {
          item.forEach(function (elem) {
            $scope.moveItem(elem, from, to);
          });
        } else {
          var idx = from.indexOf(item);
          if (idx !== -1) {
            from.splice(idx, 1);
            to.push(item);
          }
        }
      };
      $scope.removeItem = function (item, from) {
        if (item.length > 0) {
          item.forEach(function (elem) {
            $scope.removeItem(elem, from);
          });
        } else {
          var idx = from.indexOf(item);
          if (idx !== -1) {
            from.splice(idx, 1);
          }
        }
      };
      $scope.moveAll = function (from, to) {
        from.forEach(function (item) {
          to.push(item);
        });
        from.length = 0;
      };

      $("#wzMultipleSelector select").scroll(function (ev) {
        $scope.scrollList(ev.currentTarget);
      });

      $scope.doReload = (side) => {
        $scope.reloadScroll({ 'element': side });
      }
      $scope.scrollList = (target) => {
        let pos = target.scrollTop + target.offsetHeight;
        let max = target.scrollHeight;
        if (pos >= max) {
          target.parentElement.parentElement.parentElement.className === 'wzMultipleSelectorLeft' ? $scope.doReload('left') : $scope.doReload('right');
        }
      }
    },
    template
  };
});





