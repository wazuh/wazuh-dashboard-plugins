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
  items: [],
  filters: {},
  ruleInfo: false,
  decoderInfo: false,
  listInfo: false,
  fileContent: false,
  adminMode: true
}

const rulesetReducers = (state = initialState, action) => {
  switch (action.type) {
    case 'UPDATE_RULESET_SECTION':
      return Object.assign({}, state, { section: action.section });
    case 'UPDATE_LOADING_STATUS':
      return Object.assign({}, state, { isLoading: action.status });
    case 'UPDATE_ITEMS':
      return Object.assign({}, state, { items: action.items });
    case 'UPDATE_RULE_INFO':
      return Object.assign({}, state, { ruleInfo: action.info, decoderInfo: false, listInfo: false });
    case 'UPDATE_DECODER_INFO':
      return Object.assign({}, state, { decoderInfo: action.info, ruleInfo: false, listInfo: false });
    case 'UPDATE_FILE_CONTENT':
      return Object.assign({}, state, { fileContent: action.content, decoderInfo: false, ruleInfo: false, listInfo: false });
    case 'UPDATE_FILTERS':
      return Object.assign({}, state, { filters: action.filters });
    case 'UPDATE_ADMIN_MODE':
      return Object.assign({}, state, { adminMode: action.status });
    case 'TOGGLE_SHOW_FILES':
      return Object.assign({}, state, { showingFiles: action.status });
    case 'CLEAN_INFO':
      return Object.assign({}, state, { decoderInfo: false, ruleInfo: false, listInfo: false, fileContent: false });
    case 'CLEAN_CONTENT':
      return Object.assign({}, state, { fileContent: false });
    case 'CLEAN_FILTERS':
      return Object.assign({}, state, { filters: {} });
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export default rulesetReducers;