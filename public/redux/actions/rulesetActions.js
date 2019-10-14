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
    type: "UPDATE_RULESET_SECTION",
    section: section
  }
}


/**
 * Update the rules
 * @param {Array} rules 
 */
export const updateRules = (rules) => {
  return {
    type: "UPDATE_RULES",
    data: rules
  }
}

/**
 * Update the decoders
 * @param {Array} decoders 
 */
export const updateDecoders = (decoders) => {
  return {
    type: "UPDATE_DECODERS",
    data: decoders
  }
}

/**
 * Update the lists
 * @param {Array} lists 
 */
export const updateLists = (lists) => {
  return {
    type: "UPDATE_LISTS",
    data: lists
  }
}

/**
 * Update the loading status
 * @param {Boolean} loading 
 */
export const updateLoadingStatus = (loading) => {
  return {
    type: "UPDATE_LOADING_STATUS",
    status: loading
  }
}