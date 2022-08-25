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
 * Update restart attempt
 * @param {Number} restartAttempt
 * @returns
 */
export const updateRestartAttempt = (restartAttempt): ResolverAction => {
  return {
    type: 'UPDATE_RESTART_ATTEMPT',
    payload: restartAttempt,
  };
};

/**
 * Update sync check attempt
 * @param {Number} syncCheckAttempt
 * @returns
 */
export const updateSyncCheckAttempt = (syncCheckAttempt) => {
  return {
    type: 'UPDATE_SYNC_CHECK_ATTEMPT',
    payload: syncCheckAttempt,
  };
};

/**
 * Update unsynchronized nodes
 * @param {Array} unsynchronizedNodes
 * @returns
 */
export const updateUnsynchronizedNodes = (unsynchronizedNodes) => {
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
export const updateSyncNodesInfo = (syncNodesInfo) => {
  return {
    type: 'UPDATE_SYNC_NODES_INFO',
    payload: syncNodesInfo,
  };
};

/**
 * Update status of the restarting process
 * @param {string} restartStatus
 * @returns
 */
export const updateRestartStatus = (restartStatus) => {
  return {
    type: 'UPDATE_RESTART_STATUS',
    payload: restartStatus,
  };
};
