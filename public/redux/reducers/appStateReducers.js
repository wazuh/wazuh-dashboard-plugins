/*
 * Wazuh app - App State Reducers
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

const initialState = {
  currentAPI: '',
  showMenu: false,
  wazuhNotReadyYet: '',
  currentTab: '',
  extensions: {},
  selected_settings_section: '',
  currentPlatform: false,
  currentAgentData: {},
  showExploreAgentModal: false,
  showExploreAgentModalGlobal: false,
  userPermissions: false,
  userRoles: [],
  toastNotification: false,
  clusterStatus: {
    status: false,
    contextConfigServer: 'manager',
  },
  withUserLogged: false,
  allowedAgents: [],
  logtestToken: '',
};

const appStateReducers = (state = initialState, action) => {
  if (action.type === 'UPDATE_CURRENT_API') {
    return {
      ...state,
      currentAPI: action.currentAPI
    };
  }

  if (action.type === 'SHOW_MENU') {
    return {
      ...state,
      showMenu: action.showMenu
    };
  }

  if (action.type === 'UPDATE_WAZUH_NOT_READY_YET') {
    return {
      ...state,
      wazuhNotReadyYet: action.wazuhNotReadyYet
    };
  }

  if (action.type === 'UPDATE_WAZUH_CURRENT_TAB') {
    return {
      ...state,
      currentTab: action.currentTab
    };
  }

  if (action.type === 'UPDATE_EXTENSIONS') {
    return {
      ...state,
      extensions: action.extensions
    };
  }

  if (action.type === 'UPDATE_CURRENT_PLATFORM') {
    return {
      ...state,
      currentPlatform: action.currentPlatform
    };
  }

  if (action.type === 'UPDATE_SELECTED_AGENT_DATA') {
    return {
      ...state,
      currentAgentData: action.currentAgentData
    };
  }


  if (action.type === 'SHOW_EXPLORE_AGENT_MODAL') {
    return {
      ...state,
      showExploreAgentModal: action.showExploreAgentModal
    };
  }


  if (action.type === 'SHOW_EXPLORE_AGENT_MODAL_GLOBAL') {
    return {
      ...state,
      showExploreAgentModalGlobal: action.showExploreAgentModalGlobal
    };
  }

  if (action.type === 'UPDATE_USER_ROLES') {
    return {
      ...state,
      userRoles: action.userRoles
    };
  }

  if (action.type === 'UPDATE_USER_PERMISSIONS') {
    return {
      ...state,
      userPermissions: action.userPermissions
    };
  }

  if (action.type === 'UPDATE_SELECTED_SETTINGS_SECTION') {
    return {
      ...state,
      selected_settings_section: action.selected_settings_section
    };
  }

  if (action.type === 'UPDATE_TOAST_NOTIFICATIONS_MODAL') {
    return {
      ...state,
      toastNotification: action.toastNotification
    };
  }

  if (action.type === 'UPDATE_CLUSTER_STATUS') {
    return {
      ...state,
      clusterStatus: action.clusterStatus,
    };
  }

  if (action.type === 'UPDATE_WITH_USER_LOGGED') {
    return {
      ...state,
     withUserLogged: action.withUserLogged,
    };
  }  

  if (action.type === 'GET_ALLOWED_AGENTS') {
    return {
      ...state,
      allowedAgents: action.allowedAgents
    };
  }
  
  if (action.type === 'UPDATE_LOGTEST_TOKEN') {
    return {
      ...state,
      logtestToken: action.logtestToken
    };
  }

  return state;
};

export default appStateReducers;
