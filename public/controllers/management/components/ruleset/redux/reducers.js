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

const rootReducers = (state, action) => {
  switch (action.type) {
    //Changes the ruleset section
    case 'CHANGE_RULESET_SECTION':
      state.ruleset.section = action.section;
      return Object.assign({}, state);
    default:
      return state;
  }
}

export default rootReducers;