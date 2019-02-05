/*
 * Wazuh app - Wazuh table with data as input parameter directive
 * Copyright (C) 2015-2019 Wazuh, Inc.
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
    controller($scope, $filter, errorHandler, $window) {
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
        try {
          if (resizing) return;
          resizing = true;
          clearTimeout(doit);
          doit = setTimeout(async () => {
            $scope.rowsPerPage = calcTableRows($window.innerHeight, rowSizes);
            $scope.itemsPerPage = $scope.rowsPerPage;
            await init();
            resizing = false;
          }, 150);
        } catch (error) {
          resizing = false;
        }
      };
      $scope.rowsPerPage = calcTableRows($window.innerHeight, rowSizes);

      /**
       * This loads data for table, that has been provided by parameter
       */
      const fetch = () => {
        try {
          $scope.filterTable();
          $scope.keys = Object.keys(items[0]);
          return;
        } catch (error) {
          errorHandler.handle(error, 'Error loading table');
        }
        return;
      };

      $scope.sortValue = '';
      $scope.sortReverse = false;
      $scope.searchTerm = '';
      $scope.sort = key => {
        if (key !== $scope.sortValue) {
          $scope.sortReverse = false;
        }
        $scope.sortValue = key;
        $scope.sortReverse = !$scope.sortReverse;
        $scope.filterTable();
      };

      /**
       * This apply filter and sorting to table data
       */
      $scope.filterTable = () => {
        items = $filter('orderBy')(
          $filter('filter')($scope.data, $scope.searchTerm),
          $scope.sortValue,
          $scope.sortReverse
        );
        $scope.totalItems = items.length;
        $scope.items = items;
        checkGap($scope, items);
        $scope.searchTable();
      };

      /**
       * On controller loads
       */
      const init = async () => {
        try {
          $scope.error = false;
          $scope.wazuh_table_loading = true;
          await fetch();
          $scope.wazuh_table_loading = false;
        } catch (error) { }; // eslint-disable-line
      };

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
