/* eslint-disable camelcase -- keys are the stored catalog keywords */
import { i18n } from '@osd/i18n';
import type { IndicatorType } from '../../../../common/cti-catalog';

/**
 * Display labels for the stored keywords of the indicator catalog, so raw
 * values such as `url_domain` or `threat-fox` do not reach the screen. A value
 * the feed adds later falls back to a readable form of the keyword.
 */

const INDICATOR_TYPE_LABELS: Record<IndicatorType, string> = {
  url_domain: i18n.translate(
    'wazuhCheckUpdates.ctiCatalog.indicatorType.domain',
    {
      defaultMessage: 'Domains',
    },
  ),
  url_full: i18n.translate('wazuhCheckUpdates.ctiCatalog.indicatorType.url', {
    defaultMessage: 'URLs',
  }),
  connection: i18n.translate(
    'wazuhCheckUpdates.ctiCatalog.indicatorType.connection',
    { defaultMessage: 'Host:port' },
  ),
  hash_sha256: i18n.translate(
    'wazuhCheckUpdates.ctiCatalog.indicatorType.sha256',
    { defaultMessage: 'SHA-256' },
  ),
  hash_md5: i18n.translate('wazuhCheckUpdates.ctiCatalog.indicatorType.md5', {
    defaultMessage: 'MD5',
  }),
  hash_sha1: i18n.translate('wazuhCheckUpdates.ctiCatalog.indicatorType.sha1', {
    defaultMessage: 'SHA-1',
  }),
};

/** Provider names are proper nouns: not translated. */
const PROVIDER_LABELS: Record<string, string> = {
  'threat-fox': 'ThreatFox',
  'circl-osint': 'CIRCL OSINT',
  'cert-polska': 'CERT Polska',
  'tweet-feed': 'TweetFeed',
  'phish-tank': 'PhishTank',
  infoblox: 'Infoblox',
  'emerging-threats-open': 'Emerging Threats Open',
  'eset-malware-ioc': 'ESET',
  'cisco-talos': 'Cisco Talos',
  wazuh: 'Wazuh',
};

const ROLE_LABELS: Record<string, string> = {
  botnet_cc: i18n.translate('wazuhCheckUpdates.ctiCatalog.role.botnetCc', {
    defaultMessage: 'Botnet C2',
  }),
  payload_delivery: i18n.translate(
    'wazuhCheckUpdates.ctiCatalog.role.payloadDelivery',
    { defaultMessage: 'Payload delivery' },
  ),
  payload: i18n.translate('wazuhCheckUpdates.ctiCatalog.role.payload', {
    defaultMessage: 'Payload',
  }),
  cc_skimming: i18n.translate('wazuhCheckUpdates.ctiCatalog.role.skimming', {
    defaultMessage: 'Skimming',
  }),
  test: i18n.translate('wazuhCheckUpdates.ctiCatalog.role.test', {
    defaultMessage: 'Test',
  }),
};

const titleCase = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

/** `some_raw-value` as `Some raw value`. */
const humanize = (value: string) => {
  const spaced = value.replace(/[_-]+/g, ' ').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

export function getIndicatorTypeLabel(type: string | undefined): string {
  if (!type) {
    return '';
  }
  return INDICATOR_TYPE_LABELS[type as IndicatorType] ?? humanize(type);
}

export function getProviderLabel(provider: string | undefined): string {
  if (!provider) {
    return '';
  }
  return PROVIDER_LABELS[provider] ?? humanize(provider);
}

export function getRoleLabel(role: string | undefined): string {
  if (!role) {
    return '';
  }
  return ROLE_LABELS[role] ?? humanize(role);
}

/** Platform prefixes of Malpedia-style family names. */
const FAMILY_PLATFORM_PREFIX_RE = /^(win|js|elf|osx|and|py|multi)\./i;

/**
 * `win.cobalt_strike` as `Cobalt Strike`, `js.clearfake` as `Clearfake`. Names
 * that already carry capitals (`AsyncRAT`) keep them.
 */
export function getFamilyLabel(family: string | undefined): string {
  if (!family) {
    return '';
  }
  return titleCase(
    family.replace(FAMILY_PLATFORM_PREFIX_RE, '').replace(/_+/g, ' '),
  );
}

export const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: '#BD271E',
  HIGH: '#E7664C',
  MEDIUM: '#D6BF57',
  LOW: '#6092C0',
  NONE: '#98A2B3',
};
