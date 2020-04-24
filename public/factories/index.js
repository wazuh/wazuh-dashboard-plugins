/*
 * Wazuh app - Load all the Angular.js factories.
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { RawVisualizations } from './raw-visualizations';
import { LoadedVisualizations } from './loaded-visualizations';
import { DiscoverPendingUpdates } from './discover-pending-updates';
import { VisHandlers } from './vis-handlers';
import { Vis2PNG } from './vis2png';
import { uiModules } from 'ui/modules';

const app = uiModules.get('app/wazuh', []);

app
  .service('rawVisualizations', RawVisualizations)
  .service('loadedVisualizations', LoadedVisualizations)
  .service('discoverPendingUpdates', DiscoverPendingUpdates)
  .service('visHandlers', VisHandlers)
  .service('vis2png', Vis2PNG);
