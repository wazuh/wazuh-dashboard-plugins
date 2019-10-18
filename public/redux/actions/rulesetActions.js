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