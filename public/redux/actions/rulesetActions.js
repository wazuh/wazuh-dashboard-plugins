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

/**
 * Update the ruleset section
 * @param {String} section 
 */
export const updateRulesetSection = (section) => {
  return {
    type: 'UPDATE_RULESET_SECTION',
    section: section
  }
}

/**
 * Update the items, they could be rules, decoders or lists, also, could be files
 * @param {Array} rules 
 */
export const updateItems = (items) => {
  return {
    type: 'UPDATE_ITEMS',
    items: items
  }
}

/**
 * Update the files content
 * @param {String} content 
 */
export const updateFileContent = (content) => {
  return {
    type: 'UPDATE_FILE_CONTENT',
    content: content
  }
}

/**
 * Update the lists content
 * @param {String} content 
 */
export const updateListContent = (content) => {
  return {
    type: 'UPDATE_LIST_CONTENT',
    content: content
  }
}

/**
 * Update the loading status
 * @param {Boolean} loading 
 */
export const updateLoadingStatus = (loading) => {
  return {
    type: 'UPDATE_LOADING_STATUS',
    status: loading
  }
}

/**
 * Reset the ruleset store
 */
export const resetRuleset = () => {
  return {
    type: 'RESET'
  }
}

/**
 * Toggle show files 
 * @param {Boolean} status 
 */
export const toggleShowFiles = (status) => {
  return {
    type: 'TOGGLE_SHOW_FILES',
    status: status
  }
}

export const updateRuleInfo = (info) => {
  return {
    type: 'UPDATE_RULE_INFO',
    info: info
  }
}

export const updateDecoderInfo = (info) => {
  return {
    type: 'UPDATE_DECODER_INFO',
    info: info
  }  
}

export const updateIsProcessing = (isProcessing) => {
  return {
    type: 'UPDATE_IS_PROCESSING',
    isProcessing: isProcessing
  }
}

export const updatePageIndex = (pageIndex) => {
  return {
    type: 'UPDATE_PAGE_INDEX',
    pageIndex: pageIndex
  }
}

export const updateFilters = (filters) => {
  return {
    type: 'UPDATE_FILTERS',
    filters: filters
  }
}

export const cleanFilters = () => {
  return {
    type: 'CLEAN_FILTERS'
  }
}

export const cleanInfo = () => {
  return {
    type: 'CLEAN_INFO'
  }
}

export const cleanFileContent = () => {
  return {
    type: 'CLEAN_CONTENT'
  }
}

export const updateAdminMode = status => {
  return {
    type: 'UPDATE_ADMIN_MODE',
    status: status
  }
}

export const updteAddingRulesetFile = content => {
  return {
    type: 'UPDATE_ADDING_RULESET_FILE',
    content: content
  }
}

export const updateError = error => {
  return {
    type: 'UPDATE_ERROR',
    error: error
  }
}