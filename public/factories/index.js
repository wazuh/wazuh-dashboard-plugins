/*
 * Wazuh app - File for app requirements and set up
 * Copyright (C) 2018 Wazuh, Inc.
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
import { TabVisualizations } from './tab-visualizations';
import { DiscoverPendingUpdates } from './discover-pending-updates';
import { VisHandlers } from './vis-handlers';
import { Vis2PNG } from './vis2png';
import { ShareAgent } from './share-agent';
import { WzMisc } from './misc';
import { WazuhConfig } from './wazuh-config';
import { uiModules } from 'ui/modules';

const app = uiModules.get('app/wazuh', []);

app
  .service('rawVisualizations', RawVisualizations)
  .service('loadedVisualizations', LoadedVisualizations)
  .service('tabVisualizations', TabVisualizations)
  .service('discoverPendingUpdates', DiscoverPendingUpdates)
  .service('visHandlers', VisHandlers)
  .service('vis2png', Vis2PNG)
  .service('shareAgent', ShareAgent)
  .service('wzMisc', WzMisc)
  .service('wazuhConfig', WazuhConfig);
