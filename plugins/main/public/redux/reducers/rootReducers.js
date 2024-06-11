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

import { combineReducers } from 'redux';
import groupsReducers from './groupsReducers';
import statusReducers from './statusReducers';
import reportingReducers from './reportingReducers';
import configurationReducers from './configurationReducers';
import appStateReducers from './appStateReducers';
import globalBreadcrumbReducers from './globalBreadcrumbReducers';
import appConfig from './appConfigReducers';

export default combineReducers({
  groupsReducers,
  statusReducers,
  reportingReducers,
  configurationReducers,
  appStateReducers,
  globalBreadcrumbReducers,
  appConfig,
});
