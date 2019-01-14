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
export function checkGap($scope, items) {
  const gap = items.length / $scope.itemsPerPage;
  const gapInteger = parseInt(gap);
  $scope.gap = gap - gapInteger > 0 ? gapInteger + 1 : gapInteger;
  if ($scope.gap > 5) $scope.gap = 5;
}
