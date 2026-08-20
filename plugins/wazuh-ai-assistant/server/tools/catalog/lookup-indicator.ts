import { ToolDefinition } from '../types';
import {
  clampLimit,
  limitProperty,
  objectSchema,
  requireNonEmptyString,
} from './common';

/**
 * IOC (indicator of compromise) lookup against the CTI indicator-enrichment feed (coverage doc
 * CV-049, workstream A1b). `wazuh-threatintel-enrichments-a` is a THIRD-PARTY threat-intel
 * catalog, not the customer's own observed traffic -- see the privacy.ts entries covering
 * `document.*` on this family for why the indicator VALUE itself is 'allow' (never anonymized): a
 * domain/hash/IP here identifies KNOWN-MALICIOUS PUBLIC INFRASTRUCTURE, not the customer's own
 * network.
 *
 * P-5 (AI/plan/a1a-review.md) is the reason this tool exists at all: the indicator VALUE lives in
 * `document.name`, not `hash.sha256` (that root-level field is the RECORD's own content hash, a
 * sibling of `document`, never the indicator). Live-verified 2026-08-19 on wazuh-aio-5
 * (257k+ docs): a terms agg on `document.type` returns `url_domain` (107,653), `connection`
 * (95,252), `url_full` (28,704), `hash_sha256` (10,734), `hash_md5` (8,167), `hash_sha1` (6,559) --
 * no dedicated "ip" type. IP indicators live under `type: "connection"`, and `document.name` for
 * those is `"<ip>:<port>"` (live sample: `"124.70.213.43:18386"`), never a bare IP -- confirmed by
 * live doc `_id: "1725606"`. A bare-IP query therefore needs a PREFIX match, not just an exact
 * `term`, to reach the connection-type records; hash/url_domain/url_full records (live samples:
 * `"e9a5fd60...4948"` for hash_sha256, `"codespring.purecode.in.net"` for url_domain) are matched
 * by the same clause's exact `term` half. No explicit `indicator_type` parameter: `document.name`
 * is searched directly regardless of the indicator's shape, so the caller never has to pre-guess
 * which of the six `document.type` values applies -- the returned `document.type` field tells the
 * model what kind of match it got.
 *
 * Known limitation (documented rather than silently accepted): a domain/hash appearing INSIDE a
 * longer `url_full` value (e.g. a path segment) is not found -- `lintDsl`'s leading-wildcard ban
 * (guardrails.ts) makes a "contains" search on a keyword field impossible here, same constraint
 * `nameFilterClause` (catalog/common.ts) already documents for the Security Analytics content
 * tools. A prefix match only ever anchors at the START of `document.name`.
 *
 * A-1 (AI/plan/a1b-review.md): an EARLIER version of this tool ran the prefix clause unanchored
 * and unconditionally (`prefix: { 'document.name': indicator }`), which live-proved a false
 * "known-malicious" verdict for benign values -- `124.70.213.4` returned 55 hits that all belonged
 * to the DIFFERENT ip `124.70.213.43`, and `google.com` returned 2 hits for
 * `google.com-x0*.sslip.io` records, a domain never in the feed. For an IOC tool that must never
 * imply "malicious" any more than it may imply "safe", an unanchored prefix is the worst possible
 * error direction. The prefix clause is now anchored to `` `${indicator}:` `` (the only shape it
 * exists to serve -- the `"<ip>:<port>"` connection records) and only added when the input parses
 * as a bare IPv4/IPv6 address; every other indicator shape (hash/url/domain) is exact-`term`-only.
 */
const BARE_IPV4_RE = /^(\d{1,3}\.){3}\d{1,3}$/;
const BARE_IPV6_RE = /^[0-9a-f:]+$/i;

function isBareIpAddress(value: string): boolean {
  return (
    BARE_IPV4_RE.test(value) ||
    (value.includes(':') && BARE_IPV6_RE.test(value))
  );
}

export const lookupIndicatorTool: ToolDefinition = {
  spec: {
    name: 'lookup_indicator',
    description:
      'Checks whether an IP address, file hash (MD5/SHA1/SHA256), URL, or domain matches a ' +
      "known-malicious record in the threat-intel indicator (IOC) feed. Reports the feed's own " +
      'verdict (present/absent), the provider, tags, and any associated malware/software family ' +
      "-- never the customer's own environment. A match means the indicator is a KNOWN entry in " +
      'this third-party feed; the ABSENCE of a match means "not present in the CTI feed", which ' +
      'is NOT proof the indicator is safe or clean -- never phrase a no-match result as "safe". ' +
      'For a bare IP address, connection-type records store "ip:port" as the indicator name, so ' +
      'this tool also matches those records by an anchored "ip:" prefix (never a substring or ' +
      'unanchored match) in addition to the exact value; every other indicator shape (hash, URL, ' +
      'domain) matches by exact value only. Distinct from the ' +
      "vulnerability tools (CVE data) and from the customer's own observed source.ip/" +
      'destination.ip fields on findings -- this tool only reports third-party feed knowledge ' +
      'about the indicator itself.',
    parameters: objectSchema(
      {
        indicator: {
          type: 'string',
          description:
            'The IP address, hash, URL, or domain to check, exactly as given (e.g. ' +
            '"124.70.213.43", "codespring.purecode.in.net", or a SHA256 hash).',
        },
        limit: limitProperty(
          'Max number of matching feed records to return (default 10, max 50).',
        ),
      },
      ['indicator'],
    ),
  },
  target: 'indexer',
  tier: 'T1',
  buildRequest(params) {
    const indicator = requireNonEmptyString(
      params.indicator,
      'Parameter "indicator" is required and must be a non-empty string.',
    ).trim();
    const limit = clampLimit(params.limit, 10, 50);

    // A-1: the prefix arm is only ever anchored to `${indicator}:` (the "ip:port" connection-
    // record shape) and only added for a bare IP address -- every other indicator shape is
    // exact-match only, so a value can never register a false "known-malicious" verdict just for
    // sharing a leading substring with an unrelated record.
    const should: unknown[] = [
      {
        term: {
          'document.name': {
            value: indicator,
            case_insensitive: true,
          },
        },
      },
    ];
    if (isBareIpAddress(indicator)) {
      should.push({
        prefix: {
          'document.name': {
            value: `${indicator}:`,
            case_insensitive: true,
          },
        },
      });
    }

    return {
      target: 'indexer',
      index: 'wazuh-threatintel-enrichments-a',
      body: {
        query: {
          bool: {
            filter: [
              {
                bool: {
                  minimum_should_match: 1,
                  should,
                },
              },
            ],
          },
        },
        _source: [
          'document.name',
          'document.type',
          'document.provider',
          'document.tags',
          'document.feed.name',
          'document.software.name',
          'document.software.type',
          'document.software.alias',
        ],
        sort: ['_doc'],
        size: limit,
      },
    };
  },
  tableSpec: {
    columns: [
      { field: 'document.name', label: 'Indicator' },
      { field: 'document.type', label: 'Type' },
      { field: 'document.provider', label: 'Provider' },
      { field: 'document.feed.name', label: 'Feed' },
    ],
    // Row-only: tags and the related-software identity, both already reviewed 'allow' in
    // privacy.ts (third-party feed content, never the customer's own network).
    rowFields: [
      'document.tags',
      'document.software.name',
      'document.software.type',
      'document.software.alias',
    ],
  },
  digest: {
    sampleColumns: [
      'document.name',
      'document.type',
      'document.provider',
      'document.feed.name',
      'document.tags',
      'document.software.name',
      'document.software.type',
      'document.software.alias',
    ],
    // No breakdownDimensions: a lookup for one specific indicator returns 0 or a handful of rows
    // (one canonical record, or a few if the same value was reported under more than one type/
    // feed) -- there is no aggregative "which type is most common" question this tool answers.
  },
};
