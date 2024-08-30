/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreSetup } from '../../../src/core/public';
import { ReportsDashboardsPluginSetup } from './types';
import { PLUGIN_ID } from '../common';
import { DEFAULT_NAV_GROUPS, DEFAULT_APP_CATEGORIES } from '../../../src/core/public';

export function registerAllPluginNavGroups(core: CoreSetup<ReportsDashboardsPluginSetup>) {
  core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.observability, [
    {
      id: PLUGIN_ID,
      category: DEFAULT_APP_CATEGORIES.visualizeAndReport,
      order: 300,
    },
  ]);
  core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS[`security-analytics`], [
    {
      id: PLUGIN_ID,
      category: DEFAULT_APP_CATEGORIES.visualizeAndReport,
      order: 300,
    },
  ]);
  core.chrome.navGroup.addNavLinksToGroup(DEFAULT_NAV_GROUPS.search, [
    {
      id: PLUGIN_ID,
      category: DEFAULT_APP_CATEGORIES.analyzeSearch,
      order: 300,
    },
  ]);
}