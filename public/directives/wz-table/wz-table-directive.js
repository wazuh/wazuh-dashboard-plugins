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

import template from './wz-table.html';
import { uiModules } from 'ui/modules';
import { DataFactory } from '../../services/data-factory';
import { KeyEquivalenece } from '../../../util/csv-key-equivalence';
import { calcTableRows } from './lib/rows';
import { parseValue } from './lib/parse-value';
import * as pagination from './lib/pagination';
import { sort } from './lib/sort';
import * as listeners from './lib/listeners';
import { searchData, filterData, queryData } from './lib/data';
import { clickAction } from './lib/click-action';
import { initTable } from './lib/init';
import { checkGap } from './lib/check-gap';

const app = uiModules.get('app/wazuh', []);

app.directive('wzTable', function() {
  return {
    restrict: 'E',
    scope: {
      path: '=path',
      keys: '=keys',
      allowClick: '=allowClick',
      implicitFilter: '=implicitFilter',
      rowSizes: '=rowSizes',
      extraLimit: '=extraLimit'
    },
    controller(
      $scope,
      apiReq,
      $timeout,
      shareAgent,
      $location,
      errorHandler,
      wzTableFilter,
      $window,
      appState,
      globalState,
      $mdDialog,
      groupHandler
    ) {
      /**
       * Init variables
       */
      let realTime = false;
      const instance = new DataFactory(
        apiReq,
        $scope.path,
        $scope.implicitFilter
      );
      $scope.keyEquivalence = KeyEquivalenece;
      $scope.totalItems = 0;
      $scope.wazuh_table_loading = true;
      $scope.items = [];

      /**
       * Resizing. Calculate number of table rows depending on the screen height
       */
      const rowSizes = $scope.rowSizes || [15, 13, 11];
      let doit;
      // Prevents duplicated rows when resizing
      let resizing = false;
      $window.onresize = () => {
        if (resizing) return;
        resizing = true;
        clearTimeout(doit);
        doit = setTimeout(() => {
          $scope.rowsPerPage = calcTableRows($window.innerHeight, rowSizes);
          $scope.itemsPerPage = $scope.rowsPerPage;
          init()
            .then(() => (resizing = false))
            .catch(() => (resizing = false));
        }, 150);
      };
      $scope.rowsPerPage = calcTableRows($window.innerHeight, rowSizes);

      /**
       * Common functions
       */
      $scope.clickAction = (item, openAction = false) =>
        clickAction(item, openAction, instance, shareAgent, $location, $scope);

      const fetch = async (options = {}) => {
        try {
          const result = await instance.fetch(options);
          items = options.realTime ? result.items.slice(0, 10) : result.items;
          $scope.time = result.time;
          $scope.totalItems = items.length;
          $scope.items = items;
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

      /**
       * This sort data for a given filed
       */
      $scope.sort = async field =>
        sort(field, $scope, instance, fetch, errorHandler);

      /**
       * This search in table data with a given term
       */
      const search = async (term, removeFilters) =>
        searchData(
          term,
          removeFilters,
          $scope,
          instance,
          fetch,
          wzTableFilter,
          errorHandler
        );

      /**
       * This filter table with a given filter
       * @param {Object} filter
       */
      const filter = async filter =>
        filterData(
          filter,
          $scope,
          instance,
          wzTableFilter,
          fetch,
          errorHandler
        );

      /**
       * This filter table with using a q search
       * @param {Object} filter
       */
      const query = async (query, search) =>
        queryData(
          query,
          search,
          instance,
          wzTableFilter,
          $scope,
          fetch,
          errorHandler
        );

      /**
       * This refresh data every second
       */
      const realTimeFunction = async () => {
        try {
          $scope.error = false;
          while (realTime) {
            await fetch({ realTime: true, limit: 10 });
            if (!$scope.$$phase) $scope.$digest();
            await $timeout(1000);
          }
        } catch (error) {
          realTime = false;
          $scope.error = `Real time feature aborted - ${error.message ||
            error}.`;
          errorHandler.handle(
            `Real time feature aborted. ${error.message || error}`,
            'Data factory'
          );
        }
        return;
      };

      $scope.parseValue = (key, item) => parseValue(key, item, instance.path);

      /**
       * On controller loads
       */
      const init = async () =>
        initTable(
          $scope,
          fetch,
          wzTableFilter,
          instance,
          errorHandler,
          appState,
          globalState,
          $window
        );

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
      $scope.setPage = function() {
        $scope.currentPage = this.n;
        $scope.nextPage(this.n);
      };

      /**
       * Event listeners
       */
      $scope.$on('wazuhUpdateInstancePath', (event, parameters) =>
        listeners.wazuhUpdateInstancePath(parameters, instance, init)
      );

      $scope.$on('wazuhFilter', (event, parameters) =>
        listeners.wazuhFilter(parameters, filter)
      );

      $scope.$on('wazuhSearch', (event, parameters) =>
        listeners.wazuhSearch(parameters, instance, search)
      );

      $scope.$on('wazuhQuery', (event, parameters) =>
        listeners.wazuhQuery(parameters, query)
      );

      $scope.$on('wazuhRemoveFilter', (event, parameters) =>
        listeners.wazuhRemoveFilter(parameters, instance, wzTableFilter, init)
      );

      $scope.$on('wazuhPlayRealTime', () => {
        realTime = true;
        return realTimeFunction();
      });

      $scope.$on('wazuhStopRealTime', () => {
        realTime = false;
        return init();
      });

      $scope.$on('$destroy', () => {
        $window.onresize = null;
        realTime = null;
        wzTableFilter.set([]);
      });

      init();

      $scope.isLookingGroup = () => {
        try {
          const regexp = new RegExp(/^\/agents\/groups\/[a-zA-Z0-9_\-.]*$/);
          return regexp.test(instance.path);
        } catch (error) {
          return false;
        }
      };

      $scope.editGroupAgentConfig = (ev, group) => {
        $scope.$broadcast('editXmlFile', { target: group });
      };

      $scope.showConfirm = function(ev, agent) {
        const group = instance.path.split('/').pop();

        const confirm = $mdDialog
          .confirm()
          .title('Remove agent from group?')
          .textContent(
            `The agent '${agent.id}' will be removed from group '${group}'.`
          )
          .targetEvent(ev)
          .clickOutsideToClose(false)
          .escapeToClose(false)
          .ok('Agree')
          .cancel('Cancel');

        $mdDialog.show(confirm).then(
          () => {
            groupHandler
              .removeAgentFromGroup(group, agent.id)
              .then(() => init())
              .then(() => $scope.$emit('updateGroupInformation', { group }))
              .catch(error =>
                errorHandler.handle(
                  error.message || error,
                  'Error removing agent from group'
                )
              );
          },
          () => {}
        );
      };
    },
    template
  };
});
