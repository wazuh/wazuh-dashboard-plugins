/* eslint-disable camelcase -- OpenSearch query DSL */
import {
  CTI_BREAKDOWN_SIZE,
  CTI_LOOKUP_MAX_RECORDS,
  CTI_RECENT_DAYS,
  CTI_RELATED_MAX_RECORDS,
  CVE_CNA_BASE_SCORE_FIELDS,
  CVE_SEVERITY_RANGES,
  IOC_CONFIDENCE_BANDS,
  IOC_UNKNOWN_FAMILY,
  VULNERABILITY_RECORD_TYPES,
} from '../../../common/cti-explorer/constants';
import type { LookupClassification } from '../../../common/cti-explorer/lookup';
import type {
  IocFilters,
  IocSearchRequest,
  VulnerabilitySearchRequest,
} from '../../../common/cti-explorer/types';

/**
 * Query bodies of the CTI Explorer. Field types, from the index templates:
 * - `wazuh-threatintel-enrichments`: every `document.*` string is a keyword
 *   (no normalizer, `ignore_above` 4096), `document.confidence` a short,
 *   `document.first_seen` and `document.last_seen` dates.
 * - `.wazuh-threatintel-vulnerabilities`: `type` (keyword) and `offset`
 *   (unsigned_long) are indexed; `document` is stored, not indexed, except the
 *   CNA base scores where the index maps them (`half_float`). `_id` is the
 *   record id, which supports `ids` but not `prefix`.
 */

/**
 * IOC records only: the catalog also holds one `__ioc_type_hashes__` document
 * with the checksums of each type, which has no `document`.
 */
export const IOC_RECORDS_FILTER = { exists: { field: 'document.type' } };

const LISTED_RECORD_TYPES = {
  terms: { type: [...VULNERABILITY_RECORD_TYPES] },
};

const RECENT_RANGE = {
  range: { 'document.first_seen': { gte: `now-${CTI_RECENT_DAYS}d/d` } },
};

const terms = (field: string, extra: Record<string, unknown> = {}) => ({
  terms: { field, size: CTI_BREAKDOWN_SIZE, ...extra },
});

export const buildIocSummaryBody = () => ({
  size: 0,
  track_total_hits: true,
  query: { bool: { filter: [IOC_RECORDS_FILTER] } },
  aggs: {
    recent: { filter: RECENT_RANGE },
    providers: { cardinality: { field: 'document.provider' } },
    byType: terms('document.type'),
    byProvider: terms('document.provider'),
    byRole: terms('document.software.type'),
    byFamily: terms('document.software.name', {
      exclude: [IOC_UNKNOWN_FAMILY],
    }),
    byTag: terms('document.tags'),
    byConfidence: {
      range: {
        field: 'document.confidence',
        ranges: IOC_CONFIDENCE_BANDS.map(band => ({ ...band })),
      },
    },
  },
});

const buildIocFilters = (filters: IocFilters) => {
  const clauses: Record<string, unknown>[] = [IOC_RECORDS_FILTER];
  const term = (field: string, value?: string) => {
    if (value) {
      clauses.push({ term: { [field]: value } });
    }
  };
  term('document.type', filters.type);
  term('document.provider', filters.provider);
  term('document.software.type', filters.role);
  term('document.software.name', filters.family);
  term('document.tags', filters.tag);
  const band = IOC_CONFIDENCE_BANDS.find(
    item => item.key === filters.confidence,
  );
  if (band) {
    clauses.push({
      range: {
        'document.confidence': {
          ...('from' in band ? { gte: band.from } : {}),
          ...('to' in band ? { lt: band.to } : {}),
        },
      },
    });
  }
  if (filters.recent) {
    clauses.push(RECENT_RANGE);
  }
  if (filters.prefix) {
    clauses.push({
      prefix: {
        'document.name': { value: filters.prefix, case_insensitive: true },
      },
    });
  }
  return clauses;
};

export const buildIocSearchBody = ({
  page,
  pageSize,
  sortField,
  sortDirection,
  filters,
}: IocSearchRequest) => ({
  from: page * pageSize,
  size: pageSize,
  track_total_hits: true,
  query: { bool: { filter: buildIocFilters(filters) } },
  // `_id` cannot be sorted on; `document.id` breaks ties so paging is stable.
  sort: [
    { [sortField]: { order: sortDirection, missing: '_last' } },
    { 'document.id': { order: 'asc' } },
  ],
  _source: ['document', 'offset'],
});

/**
 * Exact, case-insensitive match on `document.name` (a keyword with no
 * normalizer: `case_insensitive` does what a normalizer would). An IP address
 * also matches the host:port records it is the host of.
 */
export const buildIocLookupBody = (
  classification: Extract<LookupClassification, { kind: 'ioc' }>,
) => {
  const should: Record<string, unknown>[] = classification.values.map(
    value => ({
      term: { 'document.name': { value, case_insensitive: true } },
    }),
  );
  if (classification.hostPortPrefix) {
    should.push({
      bool: {
        filter: [
          { term: { 'document.type': 'connection' } },
          {
            prefix: {
              'document.name': {
                value: classification.hostPortPrefix,
                case_insensitive: true,
              },
            },
          },
        ],
      },
    });
  }
  return {
    size: CTI_LOOKUP_MAX_RECORDS,
    track_total_hits: true,
    query: {
      bool: { filter: [IOC_RECORDS_FILTER], should, minimum_should_match: 1 },
    },
    sort: [
      { 'document.confidence': { order: 'desc', missing: '_last' } },
      { 'document.last_seen': { order: 'desc', missing: '_last' } },
    ],
    _source: ['document', 'offset'],
  };
};

export const buildIocRecordBody = (id: string) => ({
  size: 1,
  query: { bool: { filter: [IOC_RECORDS_FILTER, { ids: { values: [id] } }] } },
  _source: ['document', 'offset'],
});

/** Records that carry the same value, from other providers or of other types. */
export const buildIocRelatedBody = (name: string, excludeId: string) => ({
  size: CTI_RELATED_MAX_RECORDS,
  query: {
    bool: {
      filter: [IOC_RECORDS_FILTER, { term: { 'document.name': name } }],
      must_not: [{ ids: { values: [excludeId] } }],
    },
  },
  sort: [{ 'document.confidence': { order: 'desc', missing: '_last' } }],
  _source: ['document', 'offset'],
});

export const buildVulnerabilityExistsBody = (id: string) => ({
  size: 1,
  query: {
    bool: { filter: [LISTED_RECORD_TYPES, { ids: { values: [id] } }] },
  },
  _source: false,
});

export const buildVulnerabilitySummaryBody = () => ({
  size: 0,
  query: { bool: { filter: [LISTED_RECORD_TYPES] } },
  aggs: {
    byType: {
      terms: { field: 'type', size: VULNERABILITY_RECORD_TYPES.length },
    },
  },
});

/**
 * The stored parts a list row shows: CVE metadata and scores, the actions
 * and targets of a translation rule. The rest of a record stays on the server
 * until the record is opened.
 */
export const VULNERABILITY_LIST_SOURCE = [
  'type',
  'offset',
  'document.cveMetadata',
  'document.containers.cna.providerMetadata',
  'document.containers.cna.metrics',
  'document.containers.adp.providerMetadata',
  'document.containers.adp.metrics',
  'document.action',
  'document.target',
];

/**
 * A CVE record matches a severity when any CVSS score of its CNA container is
 * in that band, so a record scored in two versions can match two severities.
 * The ranges are fixed strings, never user input.
 */
const buildSeverityFilter = (
  severities: VulnerabilitySearchRequest['severities'],
) =>
  severities?.length
    ? [
        {
          bool: {
            should: severities.map(severity => ({
              query_string: {
                query: CVE_SEVERITY_RANGES[severity],
                fields: [CVE_CNA_BASE_SCORE_FIELDS],
              },
            })),
            minimum_should_match: 1,
          },
        },
      ]
    : [];

/**
 * Newest delivered first by default: `offset` grows with every record the feed
 * delivers. By publication date, the records without one (translation rules,
 * records of an index that does not map it) sort last, and `offset` breaks
 * ties so paging is stable.
 */
const buildVulnerabilitySort = ({
  sortField = 'offset',
  sortDirection = 'desc',
}: Pick<VulnerabilitySearchRequest, 'sortField' | 'sortDirection'>) =>
  sortField === 'offset'
    ? [{ offset: { order: sortDirection } }]
    : [
        {
          [sortField]: {
            order: sortDirection,
            missing: '_last',
            unmapped_type: 'date',
          },
        },
        { offset: { order: 'desc' } },
      ];

export const buildVulnerabilitySearchBody = ({
  type,
  severities,
  sortField,
  sortDirection,
  page,
  pageSize,
}: VulnerabilitySearchRequest) => ({
  from: page * pageSize,
  size: pageSize,
  track_total_hits: true,
  query: {
    bool: {
      filter: [
        type ? { term: { type } } : LISTED_RECORD_TYPES,
        ...buildSeverityFilter(severities),
      ],
    },
  },
  sort: buildVulnerabilitySort({ sortField, sortDirection }),
  _source: VULNERABILITY_LIST_SOURCE,
});

export const buildVulnerabilityRecordBody = (id: string) => ({
  size: 1,
  query: {
    bool: { filter: [LISTED_RECORD_TYPES, { ids: { values: [id] } }] },
  },
});
