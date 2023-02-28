/*
 * Wazuh app - Wazuh Constants file for restart
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

export enum ENUM_RESTART_STATES {
  RESTART_ERROR = 'restart_error',
  SYNC_ERROR = 'sync_error',
  RESTARTING = 'restarting',
  SYNCING = 'syncing',
  RESTARTED = 'restarted',
  RESTARTED_INFO = 'restarted_info',
}

export type NodeType = {
  name: string;
  type: string;
  version: string;
  ip: string;
  connection_date: string;
};

export type UpdateReduxType = {
  updateUnsynchronizedNodes: (unsynchronizedNodes: string[]) => void;
  updateRestartStatus: (restartStatus: string) => void;
  updateSyncNodesInfo: (
    syncNodesInfo: {
      name: string;
      synced: boolean;
    }[],
  ) => void;
  updateRestartNodesInfo: (
    restartNodesInfo: {
      name: string;
      isRestarted: boolean;
    }[],
  ) => void;
};
