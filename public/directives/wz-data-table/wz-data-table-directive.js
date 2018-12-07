/*
 * Wazuh app - Wazuh table directive
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import template from './wz-data-table.html';
import { uiModules } from 'ui/modules';
import { KeyEquivalenece } from '../../../util/csv-key-equivalence';
import { calcTableRows } from '../wz-table/lib/rows';
import * as pagination from '../wz-table/lib/pagination';
import { checkGap } from '../wz-table/lib/check-gap';

const app = uiModules.get('app/wazuh', []);

app.directive('wzDataTable', function () {
  return {
    restrict: 'E',
    scope: {
      rowSizes: '=rowSizes',
      data: '='
    },
    controller(
      $scope,
      errorHandler,
      $window,
    ) {
      /**
       * Init variables
       */
      $scope.keyEquivalence = KeyEquivalenece;
      $scope.totalItems = 0;
      $scope.wazuh_table_loading = true;
      $scope.items = [];

      /**
       * Resizing. Calculate number of table rows depending on the screen height
       */
      const rowSizes = $scope.rowSizes || [15, 13, 11];
      let doit;
      let resizing = false;
      $window.onresize = () => {
        if (resizing) return;
        resizing = true;
        clearTimeout(doit);
        doit = setTimeout(() => {
          $scope.rowsPerPage = calcTableRows($window.innerHeight, rowSizes);
          $scope.itemsPerPage = $scope.rowsPerPage;
          init().then(() => resizing = false).catch(() => resizing = false);
        }, 150);
      };
      $scope.rowsPerPage = calcTableRows($window.innerHeight, rowSizes);

      /**
       * Common functions
       */
      /*       $scope.clickAction = (item, openAction = false) =>
              clickAction(item, openAction, instance, shareAgent, $location, $scope);
      */
      const fetch = async (options = {}) => {
        try {
          items = $scope.data;
          $scope.totalItems = items.length;
          $scope.items = items;
          $scope.keys = Object.keys(items[0]);
          checkGap($scope, items);
          $scope.searchTable();
          return;
        } catch (error) {
          if (
            error &&
            !error.data &&
            error.status === -1 &&
            error.xhrStatus === 'abort'
          ) {
            return Promise.reject('Request took too long, aborted');
          }
          return Promise.reject(error);
        }
      };

      $scope.sortValue = ''; // set the default sort type
      $scope.sortReverse = false;  // set the default sort order
      $scope.searchTerm = '';     // set the default search term
      $scope.sort = key => {
        $scope.sortValue = key;
        $scope.sortReverse = !$scope.sortReverse;
      }

      const init = async () => {
        $scope.error = false;
        $scope.wazuh_table_loading = true;
        await fetch();
        $scope.wazuh_table_loading = false;
      }

      /**
       * Pagination variables and functions
       */
      $scope.itemsPerPage = $scope.rowsPerPage || 10;
      $scope.pagedItems = [];
      $scope.currentPage = 0;
      let items = [];
      $scope.gap = 0;
      $scope.searchTable = () => pagination.searchTable($scope, items);
      $scope.groupToPages = () => pagination.groupToPages($scope);
      $scope.range = (size, start, end) =>
        pagination.range(size, start, end, $scope.gap);
      $scope.prevPage = () => pagination.prevPage($scope);
      $scope.nextPage = async currentPage =>
        pagination.nextPage(currentPage, $scope, errorHandler, fetch);
      $scope.setPage = function () {
        $scope.currentPage = this.n;
        $scope.nextPage(this.n);
      };

      /**
       * Event listeners
       */
      $scope.$on('$destroy', () => {
        $window.onresize = null;
      });

      init();
    },
    template
  };
});
