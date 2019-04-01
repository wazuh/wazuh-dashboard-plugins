/*
 * Wazuh app - Wazuh table directive data methods
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export async function searchData(
  term,
  removeFilters,
  $scope,
  instance,
  fetch,
  wzTableFilter,
  errorHandler
) {
  try {
    $scope.error = false;
    $scope.wazuh_table_loading = true;
    if (removeFilters) instance.removeFilters();
    instance.addFilter('search', term);
    wzTableFilter.set(instance.filters);
    await fetch();
    $scope.wazuh_table_loading = false;
  } catch (error) {
    $scope.wazuh_table_loading = false;
    $scope.error = errorHandler.handle(error.message || error, 0, 0, 1);
    errorHandler.handle(error.message || error);
  }
  $scope.$applyAsync();
  return;
}

export async function filterData(
  filter,
  $scope,
  instance,
  wzTableFilter,
  fetch,
  errorHandler
) {
  try {
    $scope.error = false;
    $scope.wazuh_table_loading = true;
    if (filter.name === 'platform' && instance.path === '/agents') {
      const platform = filter.value.split(' - ')[0];
      const version = filter.value.split(' - ')[1];
      instance.addFilter('os.platform', platform);
      instance.addFilter('os.version', version);
    } else {
      instance.addFilter(filter.name, filter.value);
    }
    wzTableFilter.set(instance.filters);
    await fetch();
    $scope.wazuh_table_loading = false;
  } catch (error) {
    $scope.wazuh_table_loading = false;
    $scope.error = errorHandler.handle(error.message || error, 0, 0, 1);
    errorHandler.handle(error.message || error);
  }
  $scope.$applyAsync();
  return;
}

export async function queryData(
  query,
  term,
  instance,
  wzTableFilter,
  $scope,
  fetch,
  errorHandler
) {
  try {
    $scope.error = false;
    $scope.wazuh_table_loading = true;
    instance.removeFilters();
    if (term) {
      instance.addFilter('search', term);
    }
    if (query) {
      instance.addFilter('q', query);
    }
    wzTableFilter.set(instance.filters);
    await fetch();
    $scope.wazuh_table_loading = false;
  } catch (error) {
    $scope.wazuh_table_loading = false;
    $scope.error = errorHandler.handle(error.message || error, 0, 0, 1);
    errorHandler.handle(error.message || error);
  }
  $scope.$applyAsync();
  return;
}
