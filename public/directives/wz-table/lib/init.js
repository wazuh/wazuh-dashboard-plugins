/*
 * Wazuh app - Wazuh table directive init function
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export async function initTable(
  $scope,
  fetch,
  wzTableFilter,
  instance,
  errorHandler
) {
  try {
    $scope.error = false;
    $scope.wazuh_table_loading = true;
    await fetch();
    wzTableFilter.set(instance.filters);
    $scope.wazuh_table_loading = false;
  } catch (error) {
    $scope.wazuh_table_loading = false;
    $scope.error = `Error while init table - ${error.message || error}.`;
    errorHandler.handle(
      `Error while init table. ${error.message || error}`,
      'Data factory'
    );
  }
  $scope.$applyAsync();
  return;
}
