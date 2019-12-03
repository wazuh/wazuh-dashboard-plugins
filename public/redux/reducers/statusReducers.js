/*
 * Wazuh app - React component for registering agents.
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

const initialState = {
  adminMode: true,
  isLoading: false,
  isProcessing: false,
  listNodes: [],
  selectedNode: false,
  listDaemons: [],
  stats: false,
  nodeInfo: false,
  agentInfo: false,
};

const statusReducers = (state = initialState, action) => {
  if (action.type === 'UPDATE_IS_PROCESSING') {
    return {
      ...state,
      isProcessing: action.isProcessing,
      isLoading: action.isProcessing,
    };
  }
  if (action.type === 'UPDATE_LOADING_STATUS') {
    return {
      ...state,
      isLoading: action.status,
    };
  }
  if (action.type === 'UPDATE_ADMIN_MODE') {
    return {
      ...state,
      adminMode: action.status,
    };
  }
  if (action.type === 'UPDATE_LIST_NODES') {
    return {
      ...state,
      listNodes: action.listNodes,
    };
  }
  if (action.type === 'UPDATE_SELECTED_NODE') {
    return {
      ...state,
      selectedNode: action.selectedNode,
    };
  }
  if (action.type === 'UPDATE_LIST_DAEMONS') {
    return {
      ...state,
      listDaemons: action.listDaemons,
    };
  }
  if (action.type === 'UPDATE_STATS') {
    return {
      ...state,
      stats: action.stats,
    };
  }
  if (action.type === 'UPDATE_NODE_INFO') {
    return {
      ...state,
      nodeInfo: action.nodeInfo,
    };
  }
  if (action.type === 'UPDATE_AGENT_INFO') {
    return {
      ...state,
      agentInfo: action.agentInfo,
    };
  }
  if (action.type === 'CLEAN_INFO') {
    return {
      ...state,
      listNodes: [],
      selectedNode: false,
      listDaemons: [],
      stats: false,
      nodeInfo: false,
      agentInfo: false,
    };
  }

  return state;
};

export default statusReducers;
