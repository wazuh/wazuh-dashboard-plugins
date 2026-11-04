/* eslint-disable camelcase -- OpenSearch query DSL */
import { schema } from '@osd/config-schema';
import { IRouter } from 'opensearch-dashboards/server';
import { routes } from '../../../common/constants';
import {
  CATALOG_FILTER_MAX_LENGTH,
  CATALOG_MAX_FROM,
  CATALOG_MAX_PAGE,
  CATALOG_PAGE_SIZE,
  CatalogBucket,
  CatalogIndicator,
  CatalogPage,
  INDICATOR_CATALOG_INDEX,
  INDICATOR_LOOKUP_MAX_HITS,
  INDICATOR_LOOKUP_MAX_LENGTH,
  INDICATOR_TYPES,
  IndicatorCatalogSummary,
  planIndicatorLookup,
} from '../../../common/cti-catalog';
import {
  catalogErrorResponse,
  CatalogSearchHit,
  getHitsTotal,
  searchCatalog,
  validateNotBlank,
  validatePage,
} from './catalog-response';

/** Months the first-seen histogram covers, the current one included. */
const HISTOGRAM_MONTHS = 18;
const SUMMARY_TERMS_SIZE = 20;
const TOP_FAMILIES_SIZE = 10;

/** Newest first; records without a first-seen date go last. */
const NEWEST_FIRST = [
  {
    'document.first_seen': {
      order: 'desc',
      missing: '_last',
      unmapped_type: 'date',
    },
  },
];

interface IndicatorSource {
  document?: {
    name?: string;
    type?: string;
    provider?: string;
    feed?: { name?: string };
    confidence?: number;
    first_seen?: string;
    last_seen?: string;
    software?: { name?: string; type?: string; alias?: string | string[] };
    tags?: string | string[];
    reference?: string;
    id?: string;
  };
}

const asStringArray = (value: unknown): string[] =>
  (Array.isArray(value) ? value : [value]).filter(
    (item): item is string => typeof item === 'string' && item.length > 0,
  );

export function toCatalogIndicator({
  _id,
  _source,
}: CatalogSearchHit<IndicatorSource>): CatalogIndicator {
  const document = _source?.document ?? {};
  const software = document.software;
  return {
    id: _id,
    name: document.name ?? '',
    type: document.type,
    provider: document.provider,
    feedName: document.feed?.name,
    confidence:
      typeof document.confidence === 'number' ? document.confidence : undefined,
    firstSeen: document.first_seen,
    lastSeen: document.last_seen,
    software: software
      ? {
          name: software.name,
          type: software.type,
          alias: asStringArray(software.alias),
        }
      : undefined,
    tags: asStringArray(document.tags),
    reference: document.reference,
    externalId: document.id,
  };
}

const toBuckets = (aggregation: unknown): CatalogBucket[] =>
  (
    (aggregation as { buckets?: Array<{ key: unknown; doc_count: number }> })
      ?.buckets ?? []
  ).map(bucket => ({ key: String(bucket.key), count: bucket.doc_count }));

const caseInsensitiveTerm = (value: string) => ({
  term: { 'document.name': { value, case_insensitive: true } },
});

export function buildIndicatorLookupQuery(value: string) {
  const { exact, connectionPrefix } = planIndicatorLookup(value);
  const should: unknown[] = exact.map(caseInsensitiveTerm);
  if (connectionPrefix) {
    should.push({
      bool: {
        filter: [
          { term: { 'document.type': 'connection' } },
          {
            prefix: {
              'document.name': {
                value: connectionPrefix,
                case_insensitive: true,
              },
            },
          },
        ],
      },
    });
  }
  return { bool: { should, minimum_should_match: 1 } };
}

export function buildIndicatorSearchQuery({
  type,
  prefix,
  provider,
  family,
  role,
}: {
  type?: string;
  prefix?: string;
  provider?: string;
  family?: string;
  role?: string;
}) {
  const filter: unknown[] = [];
  if (type) {
    filter.push({ term: { 'document.type': type } });
  }
  if (provider) {
    filter.push({ term: { 'document.provider': provider } });
  }
  if (family) {
    filter.push({ term: { 'document.software.name': family } });
  }
  if (role) {
    filter.push({ term: { 'document.software.type': role } });
  }
  if (prefix?.trim()) {
    // Anchored at the start of the value: a browse filter, not a search.
    filter.push({
      prefix: {
        'document.name': { value: prefix.trim(), case_insensitive: true },
      },
    });
  }
  return filter.length > 0 ? { bool: { filter } } : { match_all: {} };
}

const optionalFilter = () =>
  schema.maybe(
    schema.string({
      minLength: 1,
      maxLength: CATALOG_FILTER_MAX_LENGTH,
      validate: validateNotBlank,
    }),
  );

/**
 * The indicator catalog: totals and breakdowns, an exact lookup, and a
 * newest-first browse. All read as the signed-in user, from the alias.
 */
export const getIndicatorCatalogRoutes = (router: IRouter) => {
  router.get(
    { path: routes.ctiCatalogIndicatorsSummary, validate: false },
    async (context, _request, response) => {
      try {
        const body = await searchCatalog<never>(
          context,
          INDICATOR_CATALOG_INDEX,
          {
            size: 0,
            track_total_hits: true,
            aggs: {
              lastThirtyDays: {
                filter: {
                  range: { 'document.first_seen': { gte: 'now-30d/d' } },
                },
              },
              providers: { cardinality: { field: 'document.provider' } },
              families: { cardinality: { field: 'document.software.name' } },
              averageConfidence: { avg: { field: 'document.confidence' } },
              byType: {
                terms: {
                  field: 'document.type',
                  size: INDICATOR_TYPES.length + 4,
                },
              },
              byProvider: {
                terms: {
                  field: 'document.provider',
                  size: SUMMARY_TERMS_SIZE,
                },
              },
              byRole: {
                terms: {
                  field: 'document.software.type',
                  size: SUMMARY_TERMS_SIZE,
                },
              },
              topFamilies: {
                terms: {
                  field: 'document.software.name',
                  size: TOP_FAMILIES_SIZE,
                },
              },
              recent: {
                filter: {
                  range: {
                    'document.first_seen': {
                      gte: `now-${HISTOGRAM_MONTHS - 1}M/M`,
                      lte: 'now',
                    },
                  },
                },
                aggs: {
                  byMonth: {
                    date_histogram: {
                      field: 'document.first_seen',
                      calendar_interval: 'month',
                      min_doc_count: 0,
                      extended_bounds: {
                        min: `now-${HISTOGRAM_MONTHS - 1}M/M`,
                        max: 'now/M',
                      },
                    },
                  },
                },
              },
            },
          },
        );

        const aggregations = body.aggregations ?? {};
        const averageConfidence = aggregations.averageConfidence?.value;

        return response.ok<IndicatorCatalogSummary>({
          body: {
            total: getHitsTotal(body.hits?.total),
            firstSeenLast30Days: aggregations.lastThirtyDays?.doc_count ?? 0,
            providers: aggregations.providers?.value ?? 0,
            families: aggregations.families?.value ?? 0,
            averageConfidence:
              typeof averageConfidence === 'number' ? averageConfidence : null,
            byType: toBuckets(aggregations.byType),
            byProvider: toBuckets(aggregations.byProvider),
            byRole: toBuckets(aggregations.byRole),
            topFamilies: toBuckets(aggregations.topFamilies),
            firstSeenByMonth: (
              (aggregations.recent?.byMonth?.buckets ?? []) as Array<{
                key: number;
                doc_count: number;
              }>
            ).map(bucket => ({ date: bucket.key, count: bucket.doc_count })),
          },
        });
      } catch (error) {
        return catalogErrorResponse(response, error, INDICATOR_CATALOG_INDEX);
      }
    },
  );

  router.post(
    {
      path: routes.ctiCatalogIndicatorsLookup,
      validate: {
        body: schema.object({
          q: schema.string({
            minLength: 1,
            maxLength: INDICATOR_LOOKUP_MAX_LENGTH,
            validate: validateNotBlank,
          }),
        }),
      },
    },
    async (context, request, response) => {
      try {
        const body = await searchCatalog<IndicatorSource>(
          context,
          INDICATOR_CATALOG_INDEX,
          {
            size: INDICATOR_LOOKUP_MAX_HITS,
            track_total_hits: true,
            query: buildIndicatorLookupQuery(request.body.q),
            sort: NEWEST_FIRST,
            _source: ['document'],
          },
        );

        return response.ok<CatalogPage<CatalogIndicator>>({
          body: {
            total: getHitsTotal(body.hits?.total),
            items: (body.hits?.hits ?? []).map(toCatalogIndicator),
          },
        });
      } catch (error) {
        return catalogErrorResponse(response, error, INDICATOR_CATALOG_INDEX);
      }
    },
  );

  router.post(
    {
      path: routes.ctiCatalogIndicatorsSearch,
      validate: {
        body: schema.object({
          page: schema.number({
            defaultValue: 0,
            validate: validatePage(CATALOG_MAX_PAGE),
          }),
          type: schema.maybe(
            schema.string({
              validate: value =>
                (INDICATOR_TYPES as readonly string[]).includes(value)
                  ? undefined
                  : 'unknown indicator type',
            }),
          ),
          prefix: optionalFilter(),
          provider: optionalFilter(),
          family: optionalFilter(),
          role: optionalFilter(),
        }),
      },
    },
    async (context, request, response) => {
      const { page, ...filters } = request.body;
      try {
        const body = await searchCatalog<IndicatorSource>(
          context,
          INDICATOR_CATALOG_INDEX,
          {
            from: Math.min(page * CATALOG_PAGE_SIZE, CATALOG_MAX_FROM),
            size: CATALOG_PAGE_SIZE,
            track_total_hits: true,
            query: buildIndicatorSearchQuery(filters),
            sort: NEWEST_FIRST,
            _source: ['document'],
          },
        );

        return response.ok<CatalogPage<CatalogIndicator>>({
          body: {
            total: getHitsTotal(body.hits?.total),
            items: (body.hits?.hits ?? []).map(toCatalogIndicator),
          },
        });
      } catch (error) {
        return catalogErrorResponse(response, error, INDICATOR_CATALOG_INDEX);
      }
    },
  );
};
