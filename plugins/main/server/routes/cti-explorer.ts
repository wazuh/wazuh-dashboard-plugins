/*
 * Wazuh app - CTI Explorer routes
 * Copyright (C) 2015-2026 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { IRouter } from 'opensearch_dashboards/server';
import { schema } from '@osd/config-schema';
import {
  CTI_EXPLORER_ROUTES,
  CTI_FILTER_MAX_LENGTH,
  CTI_IOCS_PATTERN,
  CTI_LOOKUP_MAX_LENGTH,
  CTI_MAX_PAGE_SIZE,
  CTI_MAX_RESULT_WINDOW,
  CTI_RECORD_ID_MAX_LENGTH,
  CVE_SEVERITY_FILTERS,
  IOC_CONFIDENCE_BANDS,
  IOC_SORT_FIELDS,
  IOC_TYPES,
  VULNERABILITY_RECORD_TYPES,
  VULNERABILITY_SORT_FIELDS,
} from '../../common/cti-explorer/constants';
import { classifyLookupValue } from '../../common/cti-explorer/lookup';
import {
  CatalogSearchClient,
  CtiExplorerError,
  getIocRecord,
  getIocSummary,
  getVulnerabilityRecord,
  getVulnerabilitySummary,
  lookupValue,
  searchIocs,
  searchVulnerabilities,
} from '../lib/cti-explorer/catalog';
import type {
  IocSearchRequest,
  VulnerabilitySearchRequest,
} from '../../common/cti-explorer/types';

const literals = <T extends string>(values: readonly T[]) =>
  schema.oneOf(
    values.map(value => schema.literal(value)) as [
      ReturnType<typeof schema.literal>,
    ],
  );

const filterValue = () =>
  schema.maybe(
    schema.string({ minLength: 1, maxLength: CTI_FILTER_MAX_LENGTH }),
  );

const pagination = {
  page: schema.number({ min: 0, max: CTI_MAX_RESULT_WINDOW - 1 }),
  pageSize: schema.number({ min: 1, max: CTI_MAX_PAGE_SIZE }),
};

/** `CVE-YYYY-NNNN…` or `TID-NNNN`, the `_id` of a listed record. */
const RECORD_ID = /^(CVE-\d{4}-\d{4,}|TID-\d+)$/;

/**
 * Lookup values arrive defanged (`hxxp://evil[.]example`), so the raw value may
 * be longer than the value it stands for: the limit applies after refanging.
 */
const LOOKUP_RAW_MAX_LENGTH = CTI_LOOKUP_MAX_LENGTH * 2;

/**
 * Reads the CTI catalogs as the signed-in user: the indexer applies the user's
 * index permissions, and a failure names the index it happened on.
 */
export function CtiExplorerRoutes(router: IRouter) {
  const handler =
    <P, Q, B>(
      read: (
        client: CatalogSearchClient,
        request: { params: P; query: Q; body: B },
      ) => Promise<unknown>,
    ) =>
    async (context, request, response) => {
      try {
        const body = await read(
          context.core.opensearch.client.asCurrentUser,
          request,
        );
        return response.ok({ body });
      } catch (error) {
        const failure =
          error instanceof CtiExplorerError
            ? error
            : new CtiExplorerError(500, {
                code: 'search_failed',
                index: '',
                reason: (error as Error)?.message,
              });
        return response.customError({
          statusCode: failure.statusCode,
          body: { message: failure.message, attributes: failure.attributes },
        });
      }
    };

  router.get(
    { path: CTI_EXPLORER_ROUTES.iocsSummary, validate: false },
    handler(client => getIocSummary(client)),
  );

  router.post(
    {
      path: CTI_EXPLORER_ROUTES.iocsSearch,
      validate: {
        body: schema.object({
          ...pagination,
          sortField: literals(IOC_SORT_FIELDS),
          sortDirection: literals(['asc', 'desc'] as const),
          filters: schema.object(
            {
              type: schema.maybe(literals(IOC_TYPES)),
              provider: filterValue(),
              role: filterValue(),
              family: filterValue(),
              tag: filterValue(),
              confidence: schema.maybe(
                literals(IOC_CONFIDENCE_BANDS.map(band => band.key)),
              ),
              recent: schema.maybe(schema.boolean()),
              prefix: schema.maybe(
                schema.string({
                  minLength: 1,
                  maxLength: CTI_LOOKUP_MAX_LENGTH,
                }),
              ),
            },
            { defaultValue: {} },
          ),
        }),
      },
    },
    handler((client, { body }: { body: IocSearchRequest }) =>
      searchIocs(client, body),
    ),
  );

  router.get(
    {
      path: `${CTI_EXPLORER_ROUTES.iocRecord}/{id}`,
      validate: {
        params: schema.object({
          id: schema.string({ minLength: 1, maxLength: CTI_FILTER_MAX_LENGTH }),
        }),
      },
    },
    handler((client, { params }: { params: { id: string } }) =>
      getIocRecord(client, params.id),
    ),
  );

  router.post(
    {
      path: CTI_EXPLORER_ROUTES.lookup,
      validate: {
        body: schema.object({
          value: schema.string({
            minLength: 1,
            maxLength: LOOKUP_RAW_MAX_LENGTH,
          }),
        }),
      },
    },
    handler((client, { body }: { body: { value: string } }) => {
      const classification = classifyLookupValue(body.value);
      if (classification.kind === 'empty') {
        throw new CtiExplorerError(400, {
          code: 'search_failed',
          index: CTI_IOCS_PATTERN,
          reason: 'The value is empty',
        });
      }
      if (classification.kind === 'too_long') {
        throw new CtiExplorerError(400, {
          code: 'value_too_long',
          index: CTI_IOCS_PATTERN,
          reason: `Values longer than ${CTI_LOOKUP_MAX_LENGTH} characters are not indexed`,
        });
      }
      return lookupValue(client, classification);
    }),
  );

  router.get(
    { path: CTI_EXPLORER_ROUTES.vulnerabilitiesSummary, validate: false },
    handler(client => getVulnerabilitySummary(client)),
  );

  router.post(
    {
      path: CTI_EXPLORER_ROUTES.vulnerabilitiesSearch,
      validate: {
        body: schema.object({
          ...pagination,
          type: schema.maybe(literals(VULNERABILITY_RECORD_TYPES)),
          severities: schema.maybe(
            schema.arrayOf(literals(CVE_SEVERITY_FILTERS), {
              maxSize: CVE_SEVERITY_FILTERS.length,
            }),
          ),
          sortField: schema.maybe(literals(VULNERABILITY_SORT_FIELDS)),
          sortDirection: schema.maybe(literals(['asc', 'desc'] as const)),
        }),
      },
    },
    handler((client, { body }: { body: VulnerabilitySearchRequest }) =>
      searchVulnerabilities(client, body),
    ),
  );

  router.get(
    {
      path: `${CTI_EXPLORER_ROUTES.vulnerabilityRecord}/{id}`,
      validate: {
        params: schema.object({
          id: schema.string({
            minLength: 1,
            maxLength: CTI_RECORD_ID_MAX_LENGTH,
            validate: value =>
              RECORD_ID.test(value)
                ? undefined
                : 'must be a CVE or TID record id',
          }),
        }),
      },
    },
    handler((client, { params }: { params: { id: string } }) =>
      getVulnerabilityRecord(client, params.id),
    ),
  );
}
