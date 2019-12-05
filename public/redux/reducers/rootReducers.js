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

import { combineReducers } from 'redux';
import rulesetReducers from './rulesetReducers';
import groupsReducers from './groupsReducers';
import statusReducers from './statusReducers';
import reportingReducers from './reportingReducers';
import managementReducers from './managementReducers';

export default combineReducers({
  rulesetReducers,
  groupsReducers,
  statusReducers,
  reportingReducers,
  managementReducers,
});
