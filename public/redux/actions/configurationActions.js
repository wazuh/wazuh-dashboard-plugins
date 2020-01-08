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

export const updateConfigurationSection = (section) => {
  return {
    type: 'UPDATE_CONFIGURATION_SECTION',
    section
  }
}

export const updateWazuhNotReadyYet = (wazuhNotReadyYet) => {
  return {
    type: 'UPDATE_WAZUH_NOT_READY_YET',
    wazuhNotReadyYet
  }
}