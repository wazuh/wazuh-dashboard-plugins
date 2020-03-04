/*
 * Wazuh app - Load all the Overview controllers and related React components.
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { uiModules } from 'ui/modules';
import { OverviewController } from './overview';
import { WelcomeVisualizeWrapper } from './components/welcome-visualize-wrapper';
import { Stats } from './components/stats';
import { SelectAgent } from './components/select-agent';
import { RequirementCard } from './components/requirement-card';
import { AddNewExtension } from './components/extensions-directory';


const app = uiModules.get('app/wazuh', ['react']);

app
  .controller('overviewController', OverviewController)
  .value('WelcomeVisualizeWrapper', WelcomeVisualizeWrapper)
  .value('StatsOverview', Stats)
  .value('RequirementCard', RequirementCard)
  .value('AddNewExtension', AddNewExtension)
  .value('SelectAgent', SelectAgent)
  .value('RequirementCard', RequirementCard);
