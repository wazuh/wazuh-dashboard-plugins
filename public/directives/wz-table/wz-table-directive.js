/*
 * Wazuh app - Wazuh table directive
 * Copyright (C) 2015-2020 Wazuh, Inc.
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
import { KeyEquivalence } from '../../../util/csv-key-equivalence';
import { calcTableRows } from './lib/rows';
import { parseValue } from './lib/parse-value';
import * as pagination from './lib/pagination';
import { sort } from './lib/sort';
import * as listeners from './lib/listeners';
import { searchData, filterData, queryData } from './lib/data';
import { clickAction } from './lib/click-action';
import { initTable } from './lib/init';
import { checkGap } from './lib/check-gap';
import { WazuhConfig } from '../../react-services/wazuh-config';
import { ApiRequest } from '../../react-services/api-request';
import { ShareAgent } from '../../factories/share-agent';
import { TimeService } from '../../react-services/time-service';
import RulesetHandler from '../../controllers/management/components/management/ruleset/utils/ruleset-handler';

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
      emptyResults: '=emptyResults',
      customColumns: '=customColumns',
      implicitSort: '=implicitSort',
      lens: '=lens'
    },
    controller(
      $scope,
      $timeout,
      $location,
      errorHandler,
      wzTableFilter,
      $window,
      $sce
    ) {
      const rulesetHandler = RulesetHandler;
      const timeService = TimeService;
      const shareAgent = new ShareAgent();
      const wazuhConfig = new WazuhConfig();
      $scope.showColumns = false;
      $scope.scapepath = $scope.path.split('/').join('');
      $scope.originalkeys = $scope.keys.map((key, idx) => ({ key, idx }));
      $scope.updateColumns = key => {
        if (!$scope.isLastKey(key)) {
          const str = key.key.value || key.key;
          const cleanArray = $scope.keys.map(item => item.value || item);
          if (cleanArray.includes(str)) {
            const idx = cleanArray.indexOf(str);
            if (idx > -1) {
              $scope.keys.splice(idx, 1);
            }
          } else {
            const originalIdx = $scope.originalkeys.findIndex(
              item =>
                (item.key.value || item.key) === (key.key.value || key.key)
            );
            if (originalIdx >= 0) {
              $scope.keys.splice(originalIdx, 0, key.key);
            } else {
              $scope.keys.push(key.key);
            }
          }
          init(true);
        }
      };
      $scope.exists = key => {
        const str = key.key.value || key.key;
        for (const k of $scope.keys) if ((k.value || k) === str) return true;
        return false;
      };

      /**
       * This sort data for a given filed
       */
      $scope.sort = async field =>
        sort(field, $scope, instance, fetch, errorHandler);

      /**
       * Init variables
       */
      let realTime = false;
      const instance = new DataFactory(
        ApiRequest,
        $scope.path,
        $scope.implicitFilter,
        $scope.implicitSort
      );
      if ($scope.implicitSort && $scope.implicitSort !== 'timestamp') {
        $scope.sort($scope.implicitSort);
      }
      $scope.keyEquivalence = KeyEquivalence;
      $scope.totalItems = 0;
      $scope.wazuh_table_loading = true;
      $scope.items = [];

      const configuration = wazuhConfig.getConfig();
      $scope.adminMode = !!(configuration || {}).admin;

      /**
       * Resizing. Calculate number of table rows depending on the screen height
       */
      const rowSizes = $scope.rowSizes || [15, 13, 11];
      let doit;
      // Prevents duplicated rows when resizing
      let resizing = false;
      $window.onresize = () => {
        if (resizing || $scope.resizingColumns) return;
        resizing = true;
        clearTimeout(doit);
        doit = setTimeout(() => {
          $scope.rowsPerPage = calcTableRows($window.innerHeight, rowSizes);
          $scope.itemsPerPage = $scope.rowsPerPage;
          init(true)
            .then(() => {
              $scope.setColResizable();
              resizing = false;
            })
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
          if ((instance.filters || []).length) {
            $scope.customEmptyResults = 'No results match your search criteria';
          } else {
            $scope.customEmptyResults =
              $scope.emptyResults || 'Empty results for this table.';
          }

          if (!options.skipFetching) {
            const result = await instance.fetch(options);
            items = options.realTime ? result.items.slice(0, 10) : result.items;
            $scope.time = result.time;
            $scope.totalItems = items.length;
            $scope.items = items;
            checkGap($scope, items);
            $scope.searchTable();
            $scope.$emit('wazuhFetched', { items, filters: instance.filters });
          } else {
            // Resize
            checkGap($scope, $scope.items);
            $scope.searchTable();
            $scope.$emit('wazuhFetched', {
              items: $scope.items,
              filters: instance.filters
            });
          }
          filterableColumns();
          if ($scope.customColumns) {
            setTimeout(() => {
              $scope.setColResizable();
            }, 100);
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
       * This refresh data every second
       */
      const realTimeFunction = async (limit = false) => {
        try {
          $scope.error = false;
          while (realTime) {
            try {
              await fetch({
                realTime: !limit ? true : false,
                limit: limit || 10
              });
            } catch (error) {
              const handledError =
                typeof error === 'string' &&
                (error.includes('ERROR3099') ||
                  (error.includes('1017') && error.includes('restarting')));
              if (!handledError) {
                throw new Error(error.message || error);
              }
            }
            $scope.$applyAsync();
            await $timeout(1000);
          }
        } catch (error) {
          realTime = false;
          $scope.error = errorHandler.handle(error.message || error, 0, 0, 1);
          errorHandler.handle(error.message || error);
        }
        return;
      };

      $scope.parseValue = (key, item) =>
        parseValue(key, item, instance.path, $sce, timeService);

      $scope.parseKey = key => {
        return key ? key.value || key : key;
      };

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
       * Pagination variables and functions
       */
      $scope.itemsPerPage = $scope.rowsPerPage || 10;
      $scope.pagedItems = [];
      $scope.currentPage = 0;
      $scope.currentOffset = 0;
      let items = [];
      $scope.gap = 0;

      $scope.searchTable = () => pagination.searchTable($scope, items);

      $scope.groupToPages = () => pagination.groupToPages($scope);

      $scope.range = (size, start, end) =>
        pagination.range(size, start, end, $scope.gap);

      $scope.prevPage = () => pagination.prevPage($scope);

      $scope.nextPage = async (currentPage, last = false) =>
        pagination.nextPage(currentPage, $scope, errorHandler, fetch, last);

      $scope.firstPage = function() {
        $scope.setPage(1);
        $scope.prevPage();
      };

      $scope.setPage = function(page = false, logs = false, last = false) {
        this.n = page || this.n;
        $scope.currentPage = this.n;
        $scope.nextPage(this.n, last).then(() => {
          if (logs) {
            $scope.$emit('scrollBottom', {
              line: parseInt(page * $scope.itemsPerPage)
            });
          }
        });
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

      $scope.$on('wazuhPlayRealTime', (ev, parameters) => {
        realTime = true;
        return realTimeFunction(parameters.limit);
      });

      $scope.$on('wazuhStopRealTime', () => {
        realTime = false;
        return init();
      });

      $scope.$on('increaseLogs', (event, parameters) => {
        $scope.setPage(parseInt(parameters.lines / $scope.itemsPerPage), true);
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
          $scope.isLookingDefaultGroup =
            instance.path.split('/').pop() === 'default';
          return regexp.test(instance.path);
        } catch (error) {
          return false;
        }
      };

      $scope.showConfirmRemoveGroup = (ev, group) => {
        $scope.removingGroup =
          $scope.removingGroup === group.name ? null : group.name;
      };

      $scope.showConfirmRemoveAgentFromGroup = (ev, agent) => {
        $scope.removingAgent =
          $scope.removingAgent === agent.id ? null : agent.id;
      };

      $scope.showConfirmRemoveFile = (ev, file, path) => {
        if (path !== '/lists/files') {
          $scope.removingFile =
            $scope.removingFile === file.file ? null : file.file;
        } else {
          $scope.removingFile =
            $scope.removingFile === file.name ? null : file.name;
        }
      };

      $scope.cancelRemoveAgent = () => {
        $scope.removingAgent = null;
      };

      $scope.cancelRemoveGroup = () => {
        $scope.removingGroup = null;
      };

      $scope.cancelRemoveFile = () => {
        $scope.removingFile = null;
      };

      $scope.confirmRemoveAgent = async agent => {
        try {
          const group = instance.path.split('/').pop();
          const data = await GroupHandler.removeAgentFromGroup(group, agent);
          errorHandler.info(((data || {}).data || {}).data);
        } catch (error) {
          errorHandler.handle(error.message || error);
        }
        $scope.removingAgent = null;
        return init();
      };

      $scope.confirmRemoveGroup = async group => {
        try {
          await groupHandler.removeGroup(group);
          errorHandler.info(`Group ${group} has been removed`);
        } catch (error) {
          errorHandler.handle(error.message || error);
        }
        $scope.removingGroup = null;
        return init();
      };

      $scope.confirmRemoveFile = async (file, type) => {
        try {
          await rulesetHandler.deleteFile(file, type);
          errorHandler.info(`File ${file.file || file.name} has been deleted`);
        } catch (error) {
          errorHandler.handle(error.message || error);
        }
        $scope.removingFile = null;
        return init();
      };

      $scope.editGroup = group => {
        if (
          $location.search() &&
          $location.search().tab &&
          $location.search().tab === 'configuration'
        ) {
          $scope.clickAction(group);
        } else {
          $scope.$emit('openGroupFromList', { group });
        }
      };

      $scope.editFile = (file, path) => {
        $scope.$emit('editFile', { file, path });
      };

      $scope.viewFileOnly = (file, path) => {
        $scope.$emit('viewFileOnly', { file, path });
      };

      $scope.isPolicyMonitoring = () => {
        return (
          instance.path.includes('sca') && instance.path.includes('/checks')
        );
      };

      $scope.isSyscheck = () => {
        return instance.path.includes('/syscheck');
      };

      const isWindows = () => {
        const agent = $scope.$parent.$parent.$parent.$parent.agent;
        return (agent.os || {}).platform === 'windows';
      };

      $scope.expandTableRow = item => {
        if (item.expanded) item.expanded = false;
        else {
          $scope.pagedItems[$scope.currentPage].map(
            item => (item.expanded = false)
          );
          item.expanded = true;
        }
      };

      $scope.showTooltip = (id1, id2, item) => {
        const $element = $(
          '#td-' + id1 + '-' + id2 + ' div span.wz-text-truncatable'
        );
        if ($element[0].offsetWidth < $element[0].scrollWidth) {
          if (!item.showTooltip) {
            item.showTooltip = [];
          }
          item.showTooltip[id2] = true;
        }
      };

      const filterableColumns = () => {
        $scope.filterableColumns = [];
        $scope.keys.forEach(k => {
          const key = $scope.parseKey(k);
          const canFilterInRules =
            $scope.path === '/rules' &&
            (key === 'level' || (key === 'path' && !$scope.lens));
          const canFilterInDecoders =
            $scope.path === '/decoders' && key === 'path' && !$scope.lens;
          $scope.filterableColumns[key] = !!(
            canFilterInRules || canFilterInDecoders
          );
        });
      };

      $scope.handleClick = (key, item, ev) => {
        const value = $scope.parseValue(key, item);
        let keyTmp = $scope.parseKey(key);
        const valueTmp = typeof value !== 'string' ? value.toString() : value;
        if ($scope.filterableColumns[keyTmp] || keyTmp === 'file') {
          if (value !== '-' && keyTmp !== 'file') {
            const filter = `${keyTmp}:${valueTmp}`;
            $scope.$emit('applyFilter', { filter });
          } else if (keyTmp === 'file') {
            $scope.$emit('viewFileOnlyTable', { file: item, path: item.path });
          }
          ev.stopPropagation();
        }
      };

      $scope.isLastKey = key => {
        const exists = $scope.exists(key);
        const keysLength = $scope.keys.length === 1;
        const keyValue = key.key.value || key.key;
        const lastKeyValue = $scope.keys[0].value || $scope.keys[0];
        return exists && keysLength && keyValue && lastKeyValue;
      };
      $scope.setColResizable = () => {
        $(`#table${$scope.scapepath} th`).resizable({
          handles: 'e',
          minWidth: 75,
          start: () => {
            $scope.resizingColumns = true;
          },
          end: () => {
            $scope.resizingColumns = false;
          }
        });
        $scope.$applyAsync();
      };

      $scope.getSyscheckRowProps = item => {
        const excluded = ['$$hashKey', 'expanded', 'showTooltip'];
        isWindows()
          ? excluded.push(...['inode', 'gid', 'gname'])
          : excluded.push('attributes');
        const isRegistry = (item || {}).type === 'registry';
        isRegistry &&
          excluded.push(...['size', 'uname', 'sha256', 'uid', 'inode']);
        const items = [];
        for (const key in item) {
          !excluded.includes(key) &&
            items.push({ key: KeyEquivalence[key] || key, value: item[key] });
        }
        const props = {
          items,
          columns: [
            { field: 'key', name: 'Field', width: '10%' },
            { field: 'value', name: 'Value' }
          ]
        };
        return props;
      };
    },
    template
  };
});
