/*
 * Wazuh app - Visualizations, Discover, filters
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { npStart } from 'ui/new_platform';
import './kibana-discover';
import './saved_visualizations';
import { loadWzTopNavDirectives } from './wz-top-nav';
loadWzTopNavDirectives(npStart.plugins.navigation.ui);