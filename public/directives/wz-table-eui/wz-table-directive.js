/*
 * Wazuh app - Wazuh table directive
 * Copyright (C) 2015-2019 Wazuh, Inc.
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
import { sort } from './lib/sort';
import * as listeners from './lib/listeners';
import { searchData, filterData, queryData } from './lib/data';
import { initTable } from './lib/init';

const app = uiModules.get('app/wazuh', []);

app.directive('wzTableEui', function() {
  return {
    restrict: 'E',
    scope: {
      path: '=path',
      keys: '=keys'
    },
    controller($scope, apiReq, errorHandler, wzTableFilter) {
      const parseColumns = columnsArray =>
        columnsArray.map(item => ({
          name: KeyEquivalenece[item.value || item] || item.value || item,
          field: item.value || item,
          width: item.width || undefined,
          render: value => value || '-'
        }));

      $scope.basicTableProps = {
        columns: parseColumns($scope.keys),
        items: []
        //noItemsMessage: 'Change this'
      };

      const instance = new DataFactory(apiReq, $scope.path);

      $scope.wazuh_table_loading = true;
      $scope.items = [];

      $scope.$watch('items', () => {
        $scope.basicTableProps.items = [...$scope.items];
      });

      $scope.$watch('keys', () => {
        $scope.basicTableProps.columns = parseColumns($scope.keys);
      });

      const fetch = async (options = {}) => {
        try {
          if (!options.skipFetching) {
            const result = await instance.fetch(options);
            const items = options.realTime
              ? result.items.slice(0, 10)
              : result.items;
            $scope.items = items;
            $scope.$emit('wazuhFetched', { items, filters: instance.filters });
          } else {
            $scope.$emit('wazuhFetched', {
              items: $scope.items,
              filters: instance.filters
            });
          }

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
      const search = async (term, removeFilters) => {
        searchData(
          term,
          removeFilters,
          $scope,
          instance,
          fetch,
          wzTableFilter,
          errorHandler
        );
      };

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
       * On controller loads
       */
      const init = async (skipFetching = false) => {
        await initTable(
          $scope,
          fetch,
          wzTableFilter,
          instance,
          errorHandler,
          skipFetching
        );
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

      $scope.$on('wazuhSort', (event, parameters) =>
        $scope.sort(parameters.field)
      );

      $scope.$on('wazuhRemoveFilter', (event, parameters) =>
        listeners.wazuhRemoveFilter(parameters, instance, wzTableFilter, init)
      );

      $scope.$on('$destroy', () => {
        wzTableFilter.set([]);
      });

      init();
    },
    template
  };
});
