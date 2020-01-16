/*
 * Wazuh app - Wrap EUI components with ng-react and the Wazuh app
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import './eui-loader';
import { uiModules } from 'ui/modules';
import { WzFilterBar } from './wz-filter-bar/wz-filter-bar';
import { ScaDashboard } from './agents/sca/sca-dashboard';

const app = uiModules.get('app/wazuh', []);
app.value('WzFilterBar', WzFilterBar);
app.value('ScaDashboard', ScaDashboard);
