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

/**
 * Update the files content
 * @param {String} content
 */
export const updateFileContent = content => {
  return {
    type: 'UPDATE_FILE_CONTENT',
    content: content
  };
};

/**
 * Update the files content
 * @param {String} content
 */
export const cleanFileContent = () => {
  return {
    type: 'CLEAN_FILE_CONTENT'
  };
};

/**
 * Toggle the modal confirm of the groups table
 * @param {Boolean} showModal
 */
export const updateShowModal = showModal => {
  return {
    type: 'UPDATE_SHOW_MODAL',
    showModal: showModal
  };
};

/**
 * Update the list of items to remove
 * @param {Array} itemList
 */
export const updateListItemsForRemove = itemList => {
  return {
    type: 'UPDATE_LIST_ITEMS_FOR_REMOVE',
    itemList: itemList
  };
};

export const updateSortField = sortField => {
  return {
    type: 'UPDATE_SORT_FIELD',
    sortField: sortField
  };
};

export const updateSortFieldAgents = sortFieldAgents => {
  return {
    type: 'UPDATE_SORT_FIELD_AGENTS',
    sortFieldAgents: sortFieldAgents
  };
};

export const updateSortFieldFile = sortFieldFile => {
  return {
    type: 'UPDATE_SORT_FIELD_FILE',
    sortFieldFile: sortFieldFile
  };
};

export const updateSortDirection = sortDirection => {
  return {
    type: 'UPDATE_SORT_DIRECTION',
    sortDirection: sortDirection
  };
};

export const updateSortDirectionAgents = sortDirectionAgents => {
  return {
    type: 'UPDATE_SORT_DIRECTION_AGENTS',
    sortDirectionAgents: sortDirectionAgents
  };
};

export const updateSortDirectionFile = sortDirectionFile => {
  return {
    type: 'UPDATE_SORT_DIRECTION_FILE',
    sortDirectionFile: sortDirectionFile
  };
};

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

export const updateGroupDetail = item => {
  return {
    type: 'UPDATE_GROUP_DETAIL',
    itemDetail: item
  };
};

/**
 * Reset the group store
 */
export const resetGroup = () => {
  return {
    type: 'RESET'
  };
};

/**
 * Toggle the updating of the table
 * @param {Boolean} isProcessing
 */
export const updateIsProcessing = isProcessing => {
  return {
    type: 'UPDATE_IS_PROCESSING',
    isProcessing: isProcessing
  };
};

/**
 * Set the page index value of the table
 * @param {Number} pageIndex
 */
export const updatePageIndex = pageIndex => {
  return {
    type: 'UPDATE_PAGE_INDEX',
    pageIndex: pageIndex
  };
};

/**
 * Set the page index value of the table file
 * @param {Number} pageIndexFile
 */
export const updatePageIndexFile = pageIndexFile => {
  return {
    type: 'UPDATE_PAGE_INDEX_FILE',
    pageIndexFile: pageIndexFile
  };
};

/**
 * Set the page index value of the table agents
 * @param {Number} pageIndexAgents
 */
export const updatePageIndexAgents = pageIndexAgents => {
  return {
    type: 'UPDATE_PAGE_INDEX_AGENTS',
    pageIndexAgents: pageIndexAgents
  };
};

/**
 * Update the filters
 * @param {string} filters
 */
export const updateFilters = filters => {
  return {
    type: 'UPDATE_FILTERS',
    filters: filters
  };
};

export const cleanFilters = () => {
  return {
    type: 'CLEAN_FILTERS'
  };
};

export const cleanInfo = () => {
  return {
    type: 'CLEAN_INFO'
  };
};

export const cleanTabs = () => {
  return {
    type: 'CLEAN_TABS'
  };
};

export const updateShowAddAgents = showAddAgents => {
  return {
    type: 'UPDATE_SHOW_ADD_AGENTS',
    showAddAgents: showAddAgents
  };
};

export const updateSelectedTab = selectedTabId => {
  return {
    type: 'UPDATE_SELECTED_TAB',
    selectedTabId: selectedTabId
  };
};

export const updateReload = () => {
  return {
    type: 'GROUPS_RELOAD'
  }
}