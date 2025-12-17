/*
 * Wazuh app - Navigation Groups for the new OpenSearch 3.x menu
 * Copyright (C) 2015-2024 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { i18n } from '@osd/i18n';
import { DEFAULT_NAV_GROUPS, DEFAULT_APP_CATEGORIES } from '../../../../src/core/public';
import { Applications } from './applications';

/**
 * Interface for ChromeNavGroup compatible with OpenSearch Dashboards.
 * This mirrors the structure from opensearch_dashboards/public.
 */
interface ChromeNavGroup {
  id: string;
  title: string;
  description: string;
  order?: number;
}

/**
 * Interface for navigation link configuration.
 */
export interface WazuhNavLinkConfig {
  id: string;
  title?: string;
  order?: number;
  category?: {
    id: string;
    label: string;
    order?: number;
  };
}

/**
 * Wazuh custom nav groups for the new home page navigation.
 * These nav groups organize Wazuh applications in the left sidebar menu
 * when `home:useNewHomePage` is enabled.
 */

// Application Category mappings for the new nav
export const WZ_APP_CATEGORIES = {
  endpointSecurity: {
    id: 'wazuh-endpoint-security',
    label: i18n.translate('wazuh.navCategory.endpointSecurity', {
      defaultMessage: 'Endpoint security',
    }),
    order: 300,
  },
  threatIntelligence: {
    id: 'wazuh-threat-intelligence',
    label: i18n.translate('wazuh.navCategory.threatIntelligence', {
      defaultMessage: 'Threat intelligence',
    }),
    order: 400,
  },
  securityOperations: {
    id: 'wazuh-security-operations',
    label: i18n.translate('wazuh.navCategory.securityOperations', {
      defaultMessage: 'Security operations',
    }),
    order: 500,
  },
  cloudSecurity: {
    id: 'wazuh-cloud-security',
    label: i18n.translate('wazuh.navCategory.cloudSecurity', {
      defaultMessage: 'Cloud security',
    }),
    order: 600,
  },
  agentsManagement: {
    id: 'wazuh-agents-management',
    label: i18n.translate('wazuh.navCategory.agentsManagement', {
      defaultMessage: 'Agents management',
    }),
    order: 700,
  },
  serverManagement: {
    id: 'wazuh-server-management',
    label: i18n.translate('wazuh.navCategory.serverManagement', {
      defaultMessage: 'Server management',
    }),
    order: 800,
  },
};

/**
 * Mapping from old Wazuh categories to new nav category configurations.
 * Maps the category ID from applications.ts to the new nav category format.
 */
type NavCategory = { id: string; label: string; order?: number };
export const CATEGORY_TO_NAV_CATEGORY: Record<string, NavCategory> = {
  'wz-category-endpoint-security': WZ_APP_CATEGORIES.endpointSecurity,
  'wz-category-threat-intelligence': WZ_APP_CATEGORIES.threatIntelligence,
  'wz-category-security-operations': WZ_APP_CATEGORIES.securityOperations,
  'wz-category-cloud-security': WZ_APP_CATEGORIES.cloudSecurity,
  'wz-category-agents-management': WZ_APP_CATEGORIES.agentsManagement,
  'wz-category-server-management': WZ_APP_CATEGORIES.serverManagement,
  'wz-category-dashboard-management': DEFAULT_APP_CATEGORIES.dashboardManagement,
  'management': DEFAULT_APP_CATEGORIES.management,
};

/**
 * Get the nav link registration for a Wazuh application.
 * Returns an object compatible with chrome.navGroup.addNavLinksToGroup()
 */
export interface WazuhNavLinkConfig {
  id: string;
  title?: string;
  order?: number;
  category?: {
    id: string;
    label: string;
    order?: number;
  };
}

/**
 * Helper to create nav link configs from Wazuh applications
 */
function createNavLinksFromApplications(
  apps: typeof Applications,
): WazuhNavLinkConfig[] {
  return apps.map(app => {
    const navCategory = CATEGORY_TO_NAV_CATEGORY[app.category];

    return {
      id: app.id,
      title: app.title,
      order: app.order,
      ...(navCategory && { category: navCategory }),
    };
  });
}

/**
 * Register Wazuh applications in OpenSearch nav groups.
 * This integrates Wazuh apps into the Security Analytics use case.
 */
export function registerWazuhNavLinks(
  addNavLinksToGroup: (navGroup: ChromeNavGroup, navLinks: WazuhNavLinkConfig[]) => void,
  navGroupEnabled: boolean,
): void {
  if (!navGroupEnabled) {
    return;
  }

  // Get all nav link configurations from applications
  const navLinks = createNavLinksFromApplications(Applications);

  // Also register in "All" (Analytics) use case for visibility
  addNavLinksToGroup(DEFAULT_NAV_GROUPS.all, navLinks.map(link => ({
    ...link,
    // In "All" use case, we group by the Wazuh category
    category: link.category,
  })));
}
