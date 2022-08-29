/*
 * Wazuh app - Restart Wazuh Actions
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { ResolverAction } from '../types';

/**
 * Update unsynchronized nodes
 * @param {Array} unsynchronizedNodes
 * @returns
 */
export const updateUnsynchronizedNodes = (unsynchronizedNodes): ResolverAction => {
  return {
    type: 'UPDATE_UNSYNCHRONIZED_NODES',
    payload: unsynchronizedNodes,
  };

  /**
   * Update sync nodes status
   * @param {Array} syncNodesInfo
   * @returns
   */
};

export const updateSyncNodesInfo = (syncNodesInfo): ResolverAction => {
  return {
    type: 'UPDATE_SYNC_NODES_INFO',
    payload: syncNodesInfo,
  };
};

export const updateRestartNodesInfo = (restartNodesInfo): ResolverAction => {
  return {
    type: 'UPDATE_RESTART_NODES_INFO',
    payload: restartNodesInfo,
  };
};

/**
 * Update status of the restarting process
 * @param {string} restartStatus
 * @returns
 */
export const updateRestartStatus = (restartStatus): ResolverAction => {
  return {
    type: 'UPDATE_RESTART_STATUS',
    payload: restartStatus,
  };
};

