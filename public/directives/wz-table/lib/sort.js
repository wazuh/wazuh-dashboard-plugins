/*
 * Wazuh app - Wazuh table directive helper
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { ErrorHandler } from '../../../react-services/error-handler';

export async function sort(field, $scope, instance, fetch, errorHandler) {
  try {
    $scope.error = false;
    $scope.wazuh_table_loading = true;
    instance.addSorting(field.value || field);
    $scope.sortValue = instance.sortValue;
    $scope.sortDir = instance.sortDir;
    await fetch();
    $scope.wazuh_table_loading = false;
  } catch (error) {
    $scope.wazuh_table_loading = false;
    $scope.error = ErrorHandler.handle(error.message || error, '', { silent: true });
    ErrorHandler.handle(error.message || error);
  }
  $scope.$applyAsync();
  return;
}
