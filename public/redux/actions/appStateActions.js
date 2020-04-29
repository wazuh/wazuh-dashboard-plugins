/*
 * Wazuh app - App State Actions
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

/**
 * Updates CurrentAPI in the appState store
 * @param currentAPI
 */
export const updateCurrentApi = currentAPI => {
  return {
    type: 'UPDATE_CURRENT_API',
    currentAPI: currentAPI
  };
};

/**
 * Updates ShowMenu in the appState store
 * @param showMenu
 */
export const updateShowMenu = showMenu => {
  return {
    type: 'SHOW_MENU',
    showMenu: showMenu
  };
};

/**
 * Updates WazuhNotReadyYet in the appState store
 * @param wazuhNotReadyYet
 */
export const updateWazuhNotReadyYet = wazuhNotReadyYet => {
  return {
    type: 'UPDATE_WAZUH_NOT_READY_YET',
    wazuhNotReadyYet: wazuhNotReadyYet
  };
};

/**
 * Updates currentTab in the appState store
 * @param currentTab
 */
export const updateCurrentTab = currentTab => {
  return {
    type: 'UPDATE_WAZUH_CURRENT_TAB',
    currentTab: currentTab
  };
};


/**
 * Updates extensions in the appState store
 * @param extensions
 */
export const updateExtensions = (id, extensions) => {
  const tmpExtensions = {};
  tmpExtensions[id] = extensions;
  return {
    type: 'UPDATE_EXTENSIONS',
    extensions: tmpExtensions
  };
};

/**
 * Updates adminMode in the appState store
 * @param extensions
 */
export const updateAdminMode = adminMode => {
  return {
    type: 'UPDATE_ADMIN_MODE',
    adminMode
  };
};

