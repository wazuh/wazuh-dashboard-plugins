import { CTI_LOOKUP_MAX_LENGTH } from './constants';
import type { IocLookupCategory } from './types';

/** `CVE-2024-6387`, `TID-0048`: the `_id` of a record of the vulnerabilities index. */
const RECORD_ID = /^(CVE-\d{4}-\d{4,}|TID-\d+)$/i;
const MD5 = /^[a-f0-9]{32}$/i;
const SHA1 = /^[a-f0-9]{40}$/i;
const SHA256 = /^[a-f0-9]{64}$/i;
const IPV4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const IPV6 = /^[a-f0-9:]+$/i;
const PORT = /^\d{1,5}$/;
const URL_SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i;
const DOMAIN = /^(?=.{1,253}$)([a-z0-9_](-*[a-z0-9_])*\.)+[a-z0-9-]{2,}$/i;

export type LookupClassification =
  | { kind: 'empty' }
  | { kind: 'too_long' }
  | { kind: 'vulnerability'; id: string }
  | {
      kind: 'ioc';
      category: IocLookupCategory;
      /** Exact values of `document.name` to match, case-insensitive. */
      values: string[];
      /** `<ip>:` prefix of the host:port records of an IP address. */
      hostPortPrefix?: string;
    };

/**
 * Turns a defanged value back into the real one, as shared in reports:
 * `hxxp://`, `example[.]com`, `1.2.3[.]4`, `host[:]443`.
 */
export const refang = (value: string): string =>
  value
    .trim()
    .replace(/^hxxp/i, 'http')
    .replace(/^fxp/i, 'ftp')
    .replace(/\[\.\]|\(\.\)|\{\.\}|\[dot\]/gi, '.')
    .replace(/\[:\]/g, ':')
    .replace(/\[:\/\/\]/g, '://');

/** At least three groups, so a `host:port` pair of hex characters is not taken for one. */
const isIpv6 = (value: string): boolean => {
  const groups = value.split(':').length;
  return IPV6.test(value) && groups >= 3 && groups <= 8;
};

const isIp = (value: string): boolean => IPV4.test(value) || isIpv6(value);

/** Host of a URL, without credentials, port or brackets. */
export const getUrlHost = (url: string): string | null => {
  const match =
    /^[a-z][a-z0-9+.-]*:\/\/(?:[^@/?#]*@)?(\[[^\]]+\]|[^:/?#]+)/i.exec(url);
  if (!match) {
    return null;
  }
  return match[1].replace(/^\[|\]$/g, '').toLowerCase();
};

/** `host:port` or `[ipv6]:port`, with a valid port. */
const splitHostPort = (
  value: string,
): { host: string; port: string } | null => {
  const bracketed = /^\[([^\]]+)\]:(\d+)$/.exec(value);
  if (bracketed) {
    return { host: bracketed[1], port: bracketed[2] };
  }
  const separator = value.lastIndexOf(':');
  if (separator <= 0 || value.indexOf(':') !== separator) {
    return null;
  }
  const host = value.slice(0, separator);
  const port = value.slice(separator + 1);
  return PORT.test(port) && Number(port) <= 65535 ? { host, port } : null;
};

/**
 * Says what a value typed in the lookup is and which catalog values answer it.
 * An IP address also matches its host:port records, and a URL also matches
 * the domain of its host. The match itself is exact and case-insensitive.
 */
export const classifyLookupValue = (raw: string): LookupClassification => {
  const value = refang(raw);
  if (!value) {
    return { kind: 'empty' };
  }
  if (value.length > CTI_LOOKUP_MAX_LENGTH) {
    return { kind: 'too_long' };
  }
  if (RECORD_ID.test(value)) {
    return { kind: 'vulnerability', id: value.toUpperCase() };
  }
  if (MD5.test(value)) {
    return { kind: 'ioc', category: 'hash_md5', values: [value] };
  }
  if (SHA1.test(value)) {
    return { kind: 'ioc', category: 'hash_sha1', values: [value] };
  }
  if (SHA256.test(value)) {
    return { kind: 'ioc', category: 'hash_sha256', values: [value] };
  }
  if (isIp(value)) {
    return {
      kind: 'ioc',
      category: 'ip',
      values: [value],
      hostPortPrefix: `${value}:`,
    };
  }
  if (URL_SCHEME.test(value)) {
    const host = getUrlHost(value);
    return {
      kind: 'ioc',
      category: 'url',
      values: host && host !== value ? [value, host] : [value],
    };
  }
  const hostPort = splitHostPort(value);
  if (hostPort && (isIp(hostPort.host) || DOMAIN.test(hostPort.host))) {
    return { kind: 'ioc', category: 'host_port', values: [value] };
  }
  if (DOMAIN.test(value)) {
    return { kind: 'ioc', category: 'domain', values: [value] };
  }
  return { kind: 'ioc', category: 'other', values: [value] };
};
