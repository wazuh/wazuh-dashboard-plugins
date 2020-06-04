/*
 * Wazuh app - React component for registering agents.
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
 * Update the ruleset section
 * @param {String} section
 */
export const updateRulesetSection = section => {
  return {
    type: 'UPDATE_RULESET_SECTION',
    section
  };
};

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
 * Toggle the modal confirm of the ruleset table
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

export const updateSortDirection = sortDirection => {
  return {
    type: 'UPDATE_SORT_DIRECTION',
    sortDirection: sortDirection
  };
};

export const updateDefaultItems = defaultItems => {
  return {
    type: 'UPDATE_DEFAULT_ITEMS',
    defaultItems: defaultItems
  };
};

/**
 * Update the lists content
 * @param {String} content
 */
export const updateListContent = content => {
  return {
    type: 'UPDATE_LIST_CONTENT',
    content: content
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

/**
 * Reset the ruleset store
 */
export const resetRuleset = () => {
  return {
    type: 'RESET'
  };
};

/**
 * Toggle show files
 * @param {Boolean} status
 */
export const toggleShowFiles = status => {
  return {
    type: 'TOGGLE_SHOW_FILES',
    status: status
  };
};

/**
 * Update the rule info
 * @param {String} info
 */
export const updateRuleInfo = info => {
  return {
    type: 'UPDATE_RULE_INFO',
    info: info
  };
};

/**
 * Update the decoder info
 * @param {String} info
 */
export const updateDecoderInfo = info => {
  return {
    type: 'UPDATE_DECODER_INFO',
    info: info
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
 * Update the filters
 * @param {string} filters
 */
export const updateFilters = filters => {
  return {
    type: 'UPDATE_RULE_FILTERS',
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

export const cleanFileContent = () => {
  return {
    type: 'CLEAN_CONTENT'
  };
};

export const updteAddingRulesetFile = content => {
  return {
    type: 'UPDATE_ADDING_RULESET_FILE',
    content: content
  };
};

export const updateError = error => {
  return {
    type: 'UPDATE_ERROR',
    error: error
  };
};
