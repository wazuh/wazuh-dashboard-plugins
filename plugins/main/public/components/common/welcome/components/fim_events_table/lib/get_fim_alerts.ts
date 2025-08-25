/*
 * Wazuh app - React component building the welcome screen of an agent.
 * version, OS, registration date, last keep alive.
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { AppState } from '../../../../../../react-services/app-state';

export function getWazuhFilter() {
  const clusterInfo = AppState.getClusterInfo();
  const wazuhFilter = {
    name: clusterInfo.status === 'enabled' ? 'cluster.name' : 'manager.name',
    value:
      clusterInfo.status === 'enabled'
        ? clusterInfo.cluster
        : clusterInfo.manager,
  };
  return wazuhFilter;
}
