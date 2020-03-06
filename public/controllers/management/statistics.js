/*
 * Wazuh app - Statistics monitoring controller
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { AppState } from '../../react-services/app-state';
import { GenericRequest } from '../../react-services/generic-request';

export function StatisticsController(
    $scope,
    $rootScope,
    $timeout,
    errorHandler,
    apiReq,
    $window,
    $location,
    discoverPendingUpdates,
    WzStatistics,
    rawVisualizations,
    loadedVisualizations,
    visHandlers,
    tabVisualizations,
) {
    tabVisualizations.setTab('statistics');
    $location.search('tabView', 'statistics');
    const clusterEnabled = AppState.getClusterInfo()
      && AppState.getClusterInfo().status === 'enabled';
    $scope.isClusterEnabled = clusterEnabled;
    $scope.IsClusterRunning = true;
    $scope.tabView = 'statistics';

}
