/*
 * Wazuh app - File for app requirements and set up
 * Copyright (C) 2015-2019 Wazuh, Inc.
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
import { WelcomeScreen } from './components/welcome';
import { Stats } from './components/stats';
import { AlertsStats } from './components/alerts-stats';
import { RequirementCard } from './components/requirement-card';

const app = uiModules.get('app/wazuh', ['react']);

app
  .controller('overviewController', OverviewController)
  .value('WelcomeScreenOverview', WelcomeScreen)
  .value('StatsOverview', Stats)
  .value('AlertsStats', AlertsStats)
  .value('RequirementCard', RequirementCard);
