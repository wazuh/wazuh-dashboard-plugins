/*
 * Wazuh app - Wazuh table directive init function
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { FilterHandler } from '../../../utils/filter-handler';
export async function initTable(
  $scope,
  fetch,
  wzTableFilter,
  instance,
  errorHandler,
  appState,
  globalState,
  $window
) {
  try {
    if ($scope.path.includes('/rules')) {
      try {
        const filterHandler = new FilterHandler(appState.getCurrentPattern());

        const checkGlobalFilters = () => {
          if (!globalState.filters || !Array.isArray(globalState.filters)) {
            globalState.filters = [];
          }
        };

        $scope.searchRuleId = (e, ruleId) => {
          e.stopPropagation();
          checkGlobalFilters();
          const ruleIdFilter = filterHandler.ruleIdQuery(ruleId);
          if (globalState.filters.length) {
            globalState.filters = globalState.filters.filter(
              item => item && item.meta && item.meta.key !== 'rule.id'
            );
          }
          globalState.filters.push(ruleIdFilter);
          $window.location.href = '#/wazuh-discover';
        };
      } catch (error) {} // eslint-disable-line
    }
    $scope.error = false;
    $scope.wazuh_table_loading = true;
    await fetch();
    wzTableFilter.set(instance.filters);
    $scope.wazuh_table_loading = false;
  } catch (error) {
    $scope.wazuh_table_loading = false;
    $scope.error = `Error while init table - ${error.message ||
      error}.`;
    errorHandler.handle(
      `Error while init table. ${error.message || error}`,
      'Data factory'
    );
  }
  if (!$scope.$$phase) $scope.$digest();
  return;
}
