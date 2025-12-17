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
 * DEFAULT_NAV_GROUPS mirrors the OpenSearch core navigation groups.
 * These are the predefined navigation groups like 'security-analytics', 'observability', etc.
 * @see https://github.com/opensearch-project/OpenSearch-Dashboards/blob/main/src/core/utils/default_nav_groups.ts
 */
const DEFAULT_NAV_GROUPS: Record<string, ChromeNavGroup> = {
  all: {
    id: 'all',
    title: 'Analytics',
    description:
      "If you aren't sure where to start with OpenSearch, or if you have needs that cut across multiple use cases.",
    order: 3000,
  },
};

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
    order: 100,
  },
  threatIntelligence: {
    id: 'wazuh-threat-intelligence',
    label: i18n.translate('wazuh.navCategory.threatIntelligence', {
      defaultMessage: 'Threat intelligence',
    }),
    order: 200,
  },
  securityOperations: {
    id: 'wazuh-security-operations',
    label: i18n.translate('wazuh.navCategory.securityOperations', {
      defaultMessage: 'Security operations',
    }),
    order: 300,
  },
  cloudSecurity: {
    id: 'wazuh-cloud-security',
    label: i18n.translate('wazuh.navCategory.cloudSecurity', {
      defaultMessage: 'Cloud security',
    }),
    order: 400,
  },
  agentsManagement: {
    id: 'wazuh-agents-management',
    label: i18n.translate('wazuh.navCategory.agentsManagement', {
      defaultMessage: 'Agents management',
    }),
    order: 500,
  },
  serverManagement: {
    id: 'wazuh-server-management',
    label: i18n.translate('wazuh.navCategory.serverManagement', {
      defaultMessage: 'Server management',
    }),
    order: 600,
  },
};

/**
 * Mapping from old Wazuh categories to new nav category configurations.
 * Maps the category ID from applications.ts to the new nav category format.
 */
export const CATEGORY_TO_NAV_CATEGORY: Record<string, typeof WZ_APP_CATEGORIES.endpointSecurity> = {
  'wz-category-endpoint-security': WZ_APP_CATEGORIES.endpointSecurity,
  'wz-category-threat-intelligence': WZ_APP_CATEGORIES.threatIntelligence,
  'wz-category-security-operations': WZ_APP_CATEGORIES.securityOperations,
  'wz-category-cloud-security': WZ_APP_CATEGORIES.cloudSecurity,
  'wz-category-agents-management': WZ_APP_CATEGORIES.agentsManagement,
  'wz-category-server-management': WZ_APP_CATEGORIES.serverManagement,
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
