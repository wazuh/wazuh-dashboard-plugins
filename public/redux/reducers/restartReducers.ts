/*
 * Wazuh app - Restar Wazuh Reducer
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { Reducer } from 'redux';
import { RestartWazuhState, ResolverAction } from '../types';

const initialState: RestartWazuhState = {
  restartAttempt: 0,
  syncCheckAttempt: 0,
  unsynchronizedNodes: [],
  syncNodesInfo: [{ name: '', synced: false }],
  restartStatus: 'restarted',
};

const restartWazuhReducer: Reducer<RestartWazuhState, ResolverAction> = (
  state = initialState,
  action
) => {
  switch (action.type) {
    case 'UPDATE_RESTART_ATTEMPT': {
      return {
        ...state,
        restartAttempt: action.payload,
      };
    }

    case 'UPDATE_SYNC_CHECK_ATTEMPT': {
      return {
        ...state,
        syncCheckAttempt: action.payload,
      };
    }

    case 'UPDATE_UNSYNCHRONIZED_NODES': {
      return {
        ...state,
        unsynchronizedNodes: action.payload,
      };
    }

    case 'UPDATE_SYNC_NODES_INFO': {
      return {
        ...state,
        syncNodesInfo: action.payload,
      };
    }

    case 'UPDATE_RESTART_STATUS': {
      return {
        ...state,
        restartStatus: action.payload,
      };
    }
    default:
      return state;
  }
};

export default restartWazuhReducer;
