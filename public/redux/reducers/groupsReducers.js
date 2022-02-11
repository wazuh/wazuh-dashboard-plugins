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
  filters: {},
  isLoading: false,
  isProcessing: false,
  itemList: [],
  itemDetail: false,
  pageIndex: 0,
  pageIndexFile: 0,
  pageIndexAgents: 0,
  section: 'groups',
  showModal: false,
  sortDirection: 'asc',
  sortDirectionFile: 'asc',
  sortDirectionAgents: 'asc',
  sortField: 'name',
  sortFieldFile: 'filename',
  sortFieldAgents: 'name',
  showAddAgents: false,
  selectedTabId: 'agents',
  reload: Date.now()
};

const groupsReducers = (state = initialState, action) => {
  if (action.type === 'UPDATE_IS_PROCESSING') {
    return {
      ...state,
      isProcessing: action.isProcessing,
      isLoading: action.isProcessing
    };
  }
  if (action.type === 'UPDATE_LOADING_STATUS') {
    return {
      ...state,
      isLoading: action.status
    };
  }
  if (action.type === 'UPDATE_PAGE_INDEX') {
    return {
      ...state,
      pageIndex: action.pageIndex
    };
  }
  if (action.type === 'UPDATE_PAGE_INDEX_AGENTS') {
    return {
      ...state,
      pageIndexAgents: action.pageIndexAgents
    };
  }
  if (action.type === 'UPDATE_PAGE_INDEX_FILE') {
    return {
      ...state,
      pageIndexFile: action.pageIndexFile
    };
  }
  if (action.type === 'UPDATE_SORT_DIRECTION') {
    return {
      ...state,
      sortDirection: action.sortDirection
    };
  }
  if (action.type === 'UPDATE_SORT_DIRECTION_AGENTS') {
    return {
      ...state,
      sortDirectionAgents: action.sortDirectionAgents
    };
  }
  if (action.type === 'UPDATE_SORT_DIRECTION_FILE') {
    return {
      ...state,
      sortDirectionFile: action.sortDirectionFile
    };
  }
  if (action.type === 'UPDATE_SORT_FIELD') {
    return {
      ...state,
      sortField: action.sortField
    };
  }
  if (action.type === 'UPDATE_SORT_FIELD_AGENTS') {
    return {
      ...state,
      sortFieldAgents: action.sortFieldAgents
    };
  }
  if (action.type === 'UPDATE_SORT_FIELD_FILE') {
    return {
      ...state,
      sortFieldFile: action.sortFieldFile
    };
  }
  if (action.type === 'UPDATE_LIST_ITEMS_FOR_REMOVE') {
    return {
      ...state,
      itemList: action.itemList
    };
  }
  if (action.type === 'UPDATE_SHOW_MODAL') {
    return {
      ...state,
      showModal: action.showModal
    };
  }
  if (action.type === 'UPDATE_GROUP_DETAIL') {
    return {
      ...state,
      itemDetail: action.itemDetail
    };
  }
  if (action.type === 'CLEAN_FILTERS') {
    return {
      ...state,
      filters: {}
    };
  }
  if (action.type === 'UPDATE_FILTERS') {
    return {
      ...state,
      filters: filters
    };
  }
  if (action.type === 'CLEAN_INFO') {
    return {
      ...state,
      itemDetail: false
    };
  }
  if (action.type === 'UPDATE_SHOW_ADD_AGENTS') {
    return {
      ...state,
      showAddAgents: action.showAddAgents
    };
  }
  if (action.type === 'UPDATE_FILE_CONTENT') {
    return {
      ...state,
      fileContent: action.content
    };
  }
  if (action.type === 'CLEAN_FILE_CONTENT') {
    return {
      ...state,
      fileContent: false
    };
  }
  if (action.type === 'UPDATE_SELECTED_TAB') {
    return {
      ...state,
      selectedTabId: action.selectedTabId
    };
  }
  if (action.type === 'CLEAN_TABS') {
    return {
      ...state,
      pageIndexAgents: 0,
      pageIndexFile: 0,
      sortFieldFile: 'filename',
      sortFieldAgents: 'name',
      sortDirectionFile: 'asc',
      sortDirectionAgents: 'asc',
      selectedTabId: 'agents',
      itemDetail: false
    };
  }
  if (action.type === 'GROUPS_RELOAD') {
    return {
      ...state,
      reload: Date.now()
    };
  }
  if (action.type === 'RESET') {
    return initialState;
  }

  return state;
};

export default groupsReducers;
