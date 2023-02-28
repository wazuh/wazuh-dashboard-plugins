/*
 * Wazuh app - Tools Reducers
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

const initialState = { selected_tools_section: '' };

const toolsReducers = (state = initialState, action) => {
  if (action.type === 'UPDATE_SELECTED_TOOLS_SECTION') {
    return {
      ...state,
      selected_tools_section: action.selected_tools_section
    };
  }

  return state;
};

export default toolsReducers;
