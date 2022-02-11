/*
 * Wazuh app - React component for registering agents.
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
  addingRulesetFile: false,
  decoderInfo: false,
  error: false,
  fileContent: false,
  filters: [],
  isLoading: false,
  isProcessing: false,
  itemList: [],
  items: [],
  listInfo: false,
  pageIndex: 0,
  ruleInfo: false,
  section: '',
  showingFiles: false,
  showModal: false,
  sortDirection: 'asc',
  sortField: 'id',
  defaultItems: []
};

const rulesetReducers = (state = initialState, action) => {
  switch (action.type) {
    case 'CLEAN_CONTENT':
      return Object.assign({}, state, { fileContent: false, error: false });
    case 'CLEAN_FILTERS':
      return Object.assign({}, state, { filters: [] });
    case 'CLEAN_INFO':
      return Object.assign({}, state, {
        decoderInfo: false,
        ruleInfo: false,
        listInfo: false,
        fileContent: false,
        addingRulesetFile: false,
        error: false
      });
    case 'RESET':
      return initialState;
    case 'TOGGLE_SHOW_FILES':
      return Object.assign({}, state, {
        showingFiles: action.status,
        error: false
      });
    case 'UPDATE_ADDING_RULESET_FILE':
      return Object.assign({}, state, {
        addingRulesetFile: action.content,
        error: false
      });
    case 'UPDATE_DECODER_INFO':
      return Object.assign({}, state, {
        decoderInfo: action.info,
        ruleInfo: false,
        listInfo: false,
        error: false
      });
    case 'UPDATE_DEFAULT_ITEMS':
      return Object.assign({}, state, {
        defaultItems: action.defaultItems,
        error: false
      });
    case 'UPDATE_ERROR':
      return Object.assign({}, state, { error: action.error });
    case 'UPDATE_FILE_CONTENT':
      return Object.assign({}, state, {
        fileContent: action.content,
        decoderInfo: false,
        ruleInfo: false,
        listInfo: false,
        error: false
      });
    case 'UPDATE_RULE_FILTERS':
      return Object.assign({}, state, {
        filters: action.filters,
        isProcessing: true,
        error: false
      });
    case 'UPDATE_IS_PROCESSING':
      return Object.assign({}, state, {
        isProcessing: action.isProcessing,
        ruleInfo: false,
        listInfo: false,
        error: false
      });
    case 'UPDATE_ITEMS':
      return Object.assign({}, state, { items: action.items, error: false });
    case 'REMOVE_ITEMS':
      return Object.assign({}, state, { items: [], error: false });
    case 'UPDATE_LIST_CONTENT':
      return Object.assign({}, state, {
        fileContent: false,
        decoderInfo: false,
        ruleInfo: false,
        listInfo: action.content,
        error: false
      });
    case 'UPDATE_LIST_ITEMS_FOR_REMOVE':
      return Object.assign({}, state, {
        itemList: action.itemList,
        error: false
      });
    case 'UPDATE_LOADING_STATUS':
      return Object.assign({}, state, {
        isLoading: action.status,
        error: false
      });
    case 'UPDATE_PAGE_INDEX':
      return Object.assign({}, state, {
        pageIndex: action.pageIndex,
        ruleInfo: false,
        listInfo: false,
        error: false
      });
    case 'UPDATE_RULE_INFO':
      return Object.assign({}, state, {
        ruleInfo: action.info,
        decoderInfo: false,
        listInfo: false,
        error: false
      });
    case 'UPDATE_RULESET_SECTION':
      return Object.assign({}, state, {
        section: action.section,
        showingFiles: false,
        error: false
      });
    case 'UPDATE_SHOW_MODAL':
      return Object.assign({}, state, {
        showModal: action.showModal,
        error: false
      });
    case 'UPDATE_SORT_DIRECTION':
      return Object.assign({}, state, {
        sortDirection: action.sortDirection,
        error: false
      });
    case 'UPDATE_SORT_FIELD':
      return Object.assign({}, state, {
        sortField: action.sortField,
        error: false
      });
    default:
      return state;
  }
};

export default rulesetReducers;
