/*
 * Wazuh app - Wazuh table directive helper
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export async function nextPage(currentPage, $scope, errorHandler, fetch) {
  try {
    $scope.error = false;
    if (
      !currentPage &&
      currentPage !== 0 &&
      $scope.currentPage < $scope.pagedItems.length - 1
    ) {
      $scope.currentPage++;
    }
    if ($scope.pagedItems[currentPage || $scope.currentPage] &&
      $scope.pagedItems[currentPage || $scope.currentPage].includes(null)) {
      const copy = $scope.currentPage;
      $scope.wazuh_table_loading = true;
      const currentNonNull = $scope.items.filter(item => !!item);
      await fetch({ offset: currentNonNull.length });
      $scope.wazuh_table_loading = false;
      $scope.currentPage = copy;
      $scope.$applyAsync();
    }
  } catch (error) {
    $scope.wazuh_table_loading = false;
    $scope.error = `Error paginating table - ${error.message || error}.`;
    errorHandler.handle(
      `Error paginating table due to ${error.message || error}`,
      'Data factory'
    );
  }
  return;
}

export function range(size, start, end, gap) {
  const ret = [];

  if (size < end) {
    end = size;
    start = size - gap;
  }
  for (let i = start; i < end; i++) {
    ret.push(i);
  }
  return ret;
}

export function groupToPages($scope) {
  $scope.pagedItems = [];

  for (let i = 0; i < $scope.filteredItems.length; i++) {
    if (i % $scope.itemsPerPage === 0) {
      $scope.pagedItems[Math.floor(i / $scope.itemsPerPage)] = [
        $scope.filteredItems[i]
      ];
    } else {
      $scope.pagedItems[Math.floor(i / $scope.itemsPerPage)].push(
        $scope.filteredItems[i]
      );
    }
  }
}

export function prevPage($scope) {
  if ($scope.currentPage > 0) {
    $scope.currentPage--;
  }
}

export function searchTable($scope, items) {
  $scope.filteredItems = items;
  $scope.currentPage = 0;
  // now group by pages
  $scope.groupToPages();
}
