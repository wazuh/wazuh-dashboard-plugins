/*
 * Wazuh app - Visualize Reducers
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

const initialState = {
  currentTab: "",
};

const visualizeReducers = (state = initialState, action) => {
  if (action.type === 'SWITCH_VISUALIZE_TAB') {
    console.log("aqui")
    return {
      ...state,
      currentTab: action.currentTab,
    };
  }
  return state;
};

export default visualizeReducers;
