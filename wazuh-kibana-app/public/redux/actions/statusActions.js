/*
 * Wazuh app - React component for status.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

/**
 * Update the loading status
 * @param {Boolean} loading
 */
export const updateLoadingStatus = loading => {
  return {
    type: 'UPDATE_LOADING_STATUS',
    status: loading
  };
};

export const updateListNodes = listNodes => {
  return {
    type: 'UPDATE_LIST_NODES',
    listNodes: listNodes
  };
};

export const updateSelectedNode = selectedNode => {
  return {
    type: 'UPDATE_SELECTED_NODE',
    selectedNode: selectedNode
  };
};

export const updateListDaemons = listDaemons => {
  return {
    type: 'UPDATE_LIST_DAEMONS',
    listDaemons: listDaemons
  };
};

export const updateStats = stats => {
  return {
    type: 'UPDATE_STATS',
    stats: stats
  };
};

export const updateNodeInfo = nodeInfo => {
  return {
    type: 'UPDATE_NODE_INFO',
    nodeInfo: nodeInfo
  };
};

export const updateAgentInfo = agentInfo => {
  return {
    type: 'UPDATE_AGENT_INFO',
    agentInfo: agentInfo
  };
};

export const updateClusterEnabled = status => {
  return {
    type: 'UPDATE_CLUSTER_ENABLED',
    clusterEnabled: status
  };
};

export const cleanInfo = () => {
  return {
    type: 'CLEAN_INFO'
  };
};
