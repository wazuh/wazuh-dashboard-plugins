/* eslint-disable camelcase -- the keys are catalog values: document.type and document.software.type */
import { i18n } from '@osd/i18n';
import type { IocLookupCategory } from '../../../../common/cti-explorer/types';

/** `document.type` → label. An unknown type shows as stored. */
const IOC_TYPE_LABELS: Record<string, string> = {
  url_domain: i18n.translate('wazuh.ctiExplorer.iocType.urlDomain', {
    defaultMessage: 'Domain',
  }),
  url_full: i18n.translate('wazuh.ctiExplorer.iocType.urlFull', {
    defaultMessage: 'URL',
  }),
  connection: i18n.translate('wazuh.ctiExplorer.iocType.connection', {
    defaultMessage: 'Host:port',
  }),
  hash_sha256: i18n.translate('wazuh.ctiExplorer.iocType.hashSha256', {
    defaultMessage: 'SHA-256',
  }),
  hash_md5: i18n.translate('wazuh.ctiExplorer.iocType.hashMd5', {
    defaultMessage: 'MD5',
  }),
  hash_sha1: i18n.translate('wazuh.ctiExplorer.iocType.hashSha1', {
    defaultMessage: 'SHA-1',
  }),
};

export const getIocTypeLabel = (type: string): string =>
  IOC_TYPE_LABELS[type] ?? type;

/** `document.software.type` → label. */
const ROLE_LABELS: Record<string, string> = {
  botnet_cc: i18n.translate('wazuh.ctiExplorer.malwareRole.botnetCc', {
    defaultMessage: 'Botnet C2',
  }),
  payload_delivery: i18n.translate(
    'wazuh.ctiExplorer.malwareRole.payloadDelivery',
    { defaultMessage: 'Payload delivery' },
  ),
  payload: i18n.translate('wazuh.ctiExplorer.malwareRole.payload', {
    defaultMessage: 'Payload',
  }),
  cc_skimming: i18n.translate('wazuh.ctiExplorer.malwareRole.ccSkimming', {
    defaultMessage: 'Card skimming',
  }),
  test: i18n.translate('wazuh.ctiExplorer.malwareRole.test', {
    defaultMessage: 'Test sample',
  }),
};

export const getMalwareRoleLabel = (role: string): string =>
  ROLE_LABELS[role] ?? role;

/**
 * `document.provider` → the provider's name. Proper names, not translated; an
 * unknown provider shows as stored.
 */
const PROVIDER_NAMES: Record<string, string> = {
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

export const getProviderName = (provider: string | null): string =>
  provider ? PROVIDER_NAMES[provider] ?? provider : '-';

const CONFIDENCE_LABELS: Record<string, string> = {
  '100': i18n.translate('wazuh.ctiExplorer.confidence.full', {
    defaultMessage: '100',
  }),
  '75-99': i18n.translate('wazuh.ctiExplorer.confidence.high', {
    defaultMessage: '75 to 99',
  }),
  '50-74': i18n.translate('wazuh.ctiExplorer.confidence.medium', {
    defaultMessage: '50 to 74',
  }),
  '0-49': i18n.translate('wazuh.ctiExplorer.confidence.low', {
    defaultMessage: 'Under 50',
  }),
};

export const getConfidenceBandLabel = (band: string): string =>
  CONFIDENCE_LABELS[band] ?? band;

const LOOKUP_CATEGORY_LABELS: Record<IocLookupCategory, string> = {
  hash_md5: IOC_TYPE_LABELS.hash_md5,
  hash_sha1: IOC_TYPE_LABELS.hash_sha1,
  hash_sha256: IOC_TYPE_LABELS.hash_sha256,
  ip: i18n.translate('wazuh.ctiExplorer.lookupCategory.ip', {
    defaultMessage: 'IP address',
  }),
  host_port: IOC_TYPE_LABELS.connection,
  url: IOC_TYPE_LABELS.url_full,
  domain: IOC_TYPE_LABELS.url_domain,
  other: i18n.translate('wazuh.ctiExplorer.lookupCategory.other', {
    defaultMessage: 'Value',
  }),
};

export const getLookupCategoryLabel = (category: IocLookupCategory): string =>
  LOOKUP_CATEGORY_LABELS[category];

const numberFormat = new Intl.NumberFormat();
export const formatNumber = (value: number): string =>
  numberFormat.format(value);

/** Dates of the catalog are UTC; shown with the browser's locale, in UTC. */
const dateFormat = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC',
  timeZoneName: 'short',
});
const dayFormat = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: '2-digit',
  timeZone: 'UTC',
});

export const formatDateTime = (value: string | null): string => {
  const time = value ? Date.parse(value) : NaN;
  return Number.isNaN(time) ? '-' : dateFormat.format(time);
};

export const formatDate = (value: string | null): string => {
  const time = value ? Date.parse(value) : NaN;
  return Number.isNaN(time) ? '-' : dayFormat.format(time);
};

/** Long hashes are cut in the middle in lists; the full value is in the tooltip. */
export const shortenValue = (value: string, type: string): string =>
  type.startsWith('hash_') && value.length > 30
    ? `${value.slice(0, 14)}…${value.slice(-10)}`
    : value;
