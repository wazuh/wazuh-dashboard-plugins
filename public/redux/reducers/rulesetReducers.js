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
  section: 'rules',
  isLoading: false,
  showingFiles: false,
  columns: [],
  items: [],
  filters: [],
  ruleInfo: false,
  decoderInfo: false,
  listInfo: false,
  fileContent: false
}

const rulesetReducers = (state = initialState, action) => {
  switch (action.type) {
    case 'UPDATE_RULESET_SECTION':
      return Object.assign({}, state, { section: action.section });
    case 'UPDATE_LOADING_STATUS':
      return Object.assign({}, state, { isLoading: action.status });
    case 'UPDATE_COLUMNS':
        return Object.assign({}, state, { columns: action.columns });
    case 'UPDATE_ITEMS':
      return Object.assign({}, state, { items: action.items });
    case 'TOGGLE_SHOW_FILES':
      return Object.assign({}, state, { showingFiles: action.status });
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export default rulesetReducers;