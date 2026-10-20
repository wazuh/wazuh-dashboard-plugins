import { i18n } from '@osd/i18n';

/** Application id of the CTI feed app. */
export const CTI_FEED_APP_ID = 'cti-feed';

/**
 * Location state the CTI feed app reads on mount: `openRegistration` opens the
 * registration modal, so other entry points (the upsell bar) land on the
 * registration flow instead of the bare page.
 */
export interface CtiFeedLocationState {
  openRegistration?: boolean;
}

/**
 * Classic-navigation category the app joins. Must equal the main plugin's
 * `Categories` entry with the same id (`plugins/main/public/utils/applications.ts`):
 * agreeing on the id is what merges both plugins' apps into one sidebar group.
 * Duplicated rather than imported because the main plugin depends on this one,
 * not the other way around.
 */
export const THREAT_INTELLIGENCE_APP_CATEGORY = {
  id: 'wz-category-threat-intelligence',
  get label(): string {
    return i18n.translate('wazuhCheckUpdates.navCategory.threatIntelligence', {
      defaultMessage: 'Threat intelligence',
    });
  },
  order: 300,
  euiIconType: 'lensApp' as const,
};

/**
 * New-navigation category the app joins. Must equal the main plugin's
 * `WZ_APP_CATEGORIES.threatIntelligence` (`plugins/main/public/utils/nav-groups.ts`).
 */
export const THREAT_INTELLIGENCE_NAV_CATEGORY = {
  id: 'wazuh-threat-intelligence',
  get label(): string {
    return THREAT_INTELLIGENCE_APP_CATEGORY.label;
  },
  order: 400,
};

/** Placed after the main plugin's apps in the same category (orders 300-303). */
export const CTI_FEED_APP_ORDER = 304;

/** Feed content counts served by `routes.ctiFeedIndicators`. */
export interface CtiFeedIndicatorsResponse {
  /** Indicators of compromise in the threat intelligence enrichments index. */
  iocs: number | null;
  /** CVE records in the vulnerabilities feed index. */
  vulnerabilities: number | null;
}
