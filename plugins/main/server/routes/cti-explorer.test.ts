/** @jest-environment node */
/* eslint-disable camelcase -- OpenSearch documents, responses and query DSL */
// To launch this file
// yarn test:jest --testEnvironment node --verbose server/routes/cti-explorer.test.ts
import { Router } from '../../../../src/core/server/http/router/router';
import { HttpServer } from '../../../../src/core/server/http/http_server';
import { loggingSystemMock } from '../../../../src/core/server/logging/logging_system.mock';
import { ByteSizeValue } from '@osd/config-schema';
import supertest from 'supertest';
import { CtiExplorerRoutes } from './cti-explorer';
import {
  CTI_EXPLORER_ROUTES,
  CTI_IOCS_PATTERN,
  CTI_VULNERABILITIES_PATTERN,
} from '../../common/cti-explorer/constants';

const loggingService = loggingSystemMock.create();
const logger = loggingService.get();
const mockSearch = jest.fn();
const context = {
  core: { opensearch: { client: { asCurrentUser: { search: mockSearch } } } },
};
const enhanceWithContext = (fn: (...args: unknown[]) => unknown) =>
  fn.bind(null, context);
let server: HttpServer;
let innerServer: { listener: import('http').Server };

beforeAll(async () => {
  const config = {
    name: 'plugin_platform',
    host: '127.0.0.1',
    maxPayload: new ByteSizeValue(1024 * 64),
    port: 10012,
    ssl: { enabled: false },
    compression: { enabled: true },
    requestId: { allowFromAnyIp: true, ipAllowlist: [] },
  } as unknown as Parameters<HttpServer['setup']>[0];
  server = new HttpServer(loggingService, 'tests');
  const router = new Router('', logger, enhanceWithContext);
  const { registerRouter, server: innerServerTest } = await server.setup(
    config,
  );
  innerServer = innerServerTest;
  CtiExplorerRoutes(router);
  registerRouter(router);
  await server.start();
});

afterAll(async () => {
  await server.stop();
  jest.clearAllMocks();
});

beforeEach(() => {
  mockSearch.mockReset();
});

const iocHit = {
  _id: '1893717',
  _source: {
    offset: 385365,
    document: {
      id: '1893717',
      name: 'primadomfrance.com',
      type: 'url_domain',
      provider: 'threat-fox',
      confidence: 90,
      first_seen: '2026-09-03T08:15:26.000Z',
      last_seen: '2026-09-10T20:25:28.000Z',
      reference: null,
      tags: ['compromised', 'EtherHide'],
      feed: { name: 'anonymous' },
      software: {
        alias: ['ClearFake'],
        name: 'js.clearfake',
        type: 'payload_delivery',
      },
    },
  },
};

const iocRecord = {
  id: '1893717',
  name: 'primadomfrance.com',
  type: 'url_domain',
  provider: 'threat-fox',
  confidence: 90,
  firstSeen: '2026-09-03T08:15:26.000Z',
  lastSeen: '2026-09-10T20:25:28.000Z',
  reference: null,
  tags: ['compromised', 'EtherHide'],
  feedName: 'anonymous',
  software: {
    name: 'js.clearfake',
    type: 'payload_delivery',
    alias: ['ClearFake'],
  },
  offset: 385365,
};

const searchBody = () => mockSearch.mock.calls[0][0].body;

describe(`GET ${CTI_EXPLORER_ROUTES.iocsSummary}`, () => {
  it('summarizes the IOC records only', async () => {
    mockSearch.mockResolvedValue({
      body: {
        hits: { total: { value: 903933, relation: 'eq' } },
        aggregations: {
          recent: { doc_count: 29548 },
          providers: { value: 10 },
          byType: { buckets: [{ key: 'url_domain', doc_count: 574374 }] },
          byConfidence: { buckets: [{ key: '100', doc_count: 434611 }] },
        },
      },
    });

    const response = await supertest(innerServer.listener)
      .get(CTI_EXPLORER_ROUTES.iocsSummary)
      .expect(200);

    expect(mockSearch.mock.calls[0][0].index).toBe(CTI_IOCS_PATTERN);
    expect(searchBody().query.bool.filter).toEqual([
      { exists: { field: 'document.type' } },
    ]);
    expect(searchBody().aggs.byFamily.terms.exclude).toEqual(['unknown']);
    expect(response.body).toEqual({
      total: 903933,
      addedRecently: 29548,
      providers: 10,
      byType: [{ key: 'url_domain', count: 574374 }],
      byProvider: [],
      byRole: [],
      byFamily: [],
      byTag: [],
      byConfidence: [{ key: '100', count: 434611 }],
    });
  });

  it('names the index the user cannot read', async () => {
    mockSearch.mockRejectedValue({
      meta: {
        statusCode: 403,
        body: {
          error: { reason: 'no permissions for [indices:data/read/search]' },
        },
      },
    });

    const response = await supertest(innerServer.listener)
      .get(CTI_EXPLORER_ROUTES.iocsSummary)
      .expect(403);

    expect(response.body.attributes).toEqual({
      code: 'forbidden',
      index: CTI_IOCS_PATTERN,
      reason: 'no permissions for [indices:data/read/search]',
    });
  });
});

describe(`POST ${CTI_EXPLORER_ROUTES.iocsSearch}`, () => {
  const request = {
    page: 2,
    pageSize: 25,
    sortField: 'document.first_seen',
    sortDirection: 'desc',
    filters: {
      type: 'connection',
      provider: 'threat-fox',
      family: 'elf.mirai',
      confidence: '75-99',
      recent: true,
      prefix: '192.',
    },
  };

  it('pages, sorts and filters on the keyword fields', async () => {
    mockSearch.mockResolvedValue({
      body: { hits: { total: { value: 1036 }, hits: [iocHit] } },
    });

    const response = await supertest(innerServer.listener)
      .post(CTI_EXPLORER_ROUTES.iocsSearch)
      .send(request)
      .expect(200);

    expect(response.body).toEqual({ total: 1036, items: [iocRecord] });
    const body = searchBody();
    expect(body.from).toBe(50);
    expect(body.size).toBe(25);
    expect(body.track_total_hits).toBe(true);
    expect(body.sort[0]).toEqual({
      'document.first_seen': { order: 'desc', missing: '_last' },
    });
    expect(body.query.bool.filter).toEqual(
      expect.arrayContaining([
        { term: { 'document.type': 'connection' } },
        { term: { 'document.provider': 'threat-fox' } },
        { term: { 'document.software.name': 'elf.mirai' } },
        { range: { 'document.confidence': { gte: 75, lt: 100 } } },
        {
          prefix: {
            'document.name': { value: '192.', case_insensitive: true },
          },
        },
      ]),
    );
  });

  it('refuses a page past the result window before querying', async () => {
    const response = await supertest(innerServer.listener)
      .post(CTI_EXPLORER_ROUTES.iocsSearch)
      .send({ ...request, page: 400 })
      .expect(400);

    expect(response.body.attributes.code).toBe('result_window');
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it.each([
    ['an unknown sort field', { sortField: 'document.tags' }],
    ['a page size over the limit', { pageSize: 1001 }],
    ['an unknown type', { filters: { type: 'email' } }],
    ['a filter value over the limit', { filters: { tag: 'x'.repeat(1025) } }],
  ])('rejects %s', async (_label, change) => {
    await supertest(innerServer.listener)
      .post(CTI_EXPLORER_ROUTES.iocsSearch)
      .send({ ...request, ...change })
      .expect(400);
    expect(mockSearch).not.toHaveBeenCalled();
  });
});

describe(`GET ${CTI_EXPLORER_ROUTES.iocRecord}/{id}`, () => {
  it('returns the record and the other records with its value', async () => {
    mockSearch
      .mockResolvedValueOnce({ body: { hits: { hits: [iocHit] } } })
      .mockResolvedValueOnce({
        body: {
          hits: {
            hits: [
              {
                ...iocHit,
                _id: 'other',
                _source: {
                  ...iocHit._source,
                  document: {
                    ...iocHit._source.document,
                    provider: 'cert-polska',
                  },
                },
              },
            ],
          },
        },
      });

    const response = await supertest(innerServer.listener)
      .get(`${CTI_EXPLORER_ROUTES.iocRecord}/1893717`)
      .expect(200);

    expect(response.body.record).toEqual(iocRecord);
    expect(response.body.related).toEqual([
      { ...iocRecord, id: 'other', provider: 'cert-polska' },
    ]);
    expect(mockSearch.mock.calls[1][0].body.query.bool).toEqual(
      expect.objectContaining({
        must_not: [{ ids: { values: ['1893717'] } }],
      }),
    );
  });

  it('answers 404 for an unknown record', async () => {
    mockSearch.mockResolvedValue({ body: { hits: { hits: [] } } });

    const response = await supertest(innerServer.listener)
      .get(`${CTI_EXPLORER_ROUTES.iocRecord}/missing`)
      .expect(404);

    expect(response.body.attributes.code).toBe('not_found');
  });
});

describe(`POST ${CTI_EXPLORER_ROUTES.lookup}`, () => {
  it('matches an IP address and its host:port records, case-insensitive', async () => {
    mockSearch.mockResolvedValue({ body: { hits: { hits: [iocHit] } } });

    const response = await supertest(innerServer.listener)
      .post(CTI_EXPLORER_ROUTES.lookup)
      .send({ value: '192.0.2[.]100' })
      .expect(200);

    expect(response.body).toEqual({
      kind: 'ioc',
      category: 'ip',
      records: [iocRecord],
    });
    expect(searchBody().query.bool.should).toEqual([
      {
        term: {
          'document.name': { value: '192.0.2.100', case_insensitive: true },
        },
      },
      {
        bool: {
          filter: [
            { term: { 'document.type': 'connection' } },
            {
              prefix: {
                'document.name': {
                  value: '192.0.2.100:',
                  case_insensitive: true,
                },
              },
            },
          ],
        },
      },
    ]);
  });

  it('looks a record id up in the vulnerabilities catalog only', async () => {
    mockSearch.mockResolvedValue({ body: { hits: { hits: [] } } });

    const response = await supertest(innerServer.listener)
      .post(CTI_EXPLORER_ROUTES.lookup)
      .send({ value: 'cve-2024-6387' })
      .expect(200);

    expect(response.body).toEqual({
      kind: 'vulnerability',
      id: 'CVE-2024-6387',
      found: false,
      record: null,
    });
    expect(mockSearch).toHaveBeenCalledTimes(1);
    expect(mockSearch.mock.calls[0][0].index).toBe(CTI_VULNERABILITIES_PATTERN);
    expect(searchBody().query.bool.filter).toContainEqual({
      ids: { values: ['CVE-2024-6387'] },
    });
  });

  it('returns a found record with the fields the lists show', async () => {
    mockSearch.mockResolvedValue({
      body: {
        hits: {
          hits: [
            {
              _id: 'TID-0048',
              _source: {
                type: 'TID',
                offset: 238178,
                document: {
                  action: ['replace_vendor'],
                  target: ['centos'],
                  source: { vendor: '', product: '^nodejs$' },
                  translation: [{ vendor: 'nodejs', product: 'node.js' }],
                },
              },
            },
          ],
        },
      },
    });

    const response = await supertest(innerServer.listener)
      .post(CTI_EXPLORER_ROUTES.lookup)
      .send({ value: 'TID-0048' })
      .expect(200);

    expect(response.body).toEqual({
      kind: 'vulnerability',
      id: 'TID-0048',
      found: true,
      record: {
        id: 'TID-0048',
        type: 'TID',
        offset: 238178,
        document: {
          action: ['replace_vendor'],
          target: ['centos'],
          source: { vendor: '', product: '^nodejs$' },
          translation: [{ vendor: 'nodejs', product: 'node.js' }],
        },
      },
    });
    expect(searchBody()._source).toEqual(
      expect.arrayContaining(['document.cveMetadata', 'document.translation']),
    );
  });

  it('refuses a value longer than the indexed limit', async () => {
    const response = await supertest(innerServer.listener)
      .post(CTI_EXPLORER_ROUTES.lookup)
      .send({ value: `https://example.com/${'a'.repeat(4096)}` })
      .expect(400);

    expect(response.body.attributes.code).toBe('value_too_long');
    expect(mockSearch).not.toHaveBeenCalled();
  });
});

describe('vulnerability routes', () => {
  it('counts the CVE and TID records, and the CVE by highest severity', async () => {
    mockSearch.mockResolvedValue({
      body: {
        aggregations: {
          byType: {
            buckets: [
              { key: 'CVE', doc_count: 416428 },
              { key: 'TID', doc_count: 212 },
            ],
          },
          byHighestSeverity: {
            buckets: {
              high: { doc_count: 1200 },
              critical: { doc_count: 300 },
            },
          },
        },
      },
    });

    const response = await supertest(innerServer.listener)
      .get(CTI_EXPLORER_ROUTES.vulnerabilitiesSummary)
      .expect(200);

    expect(response.body.byType).toEqual([
      { key: 'CVE', count: 416428 },
      { key: 'TID', count: 212 },
    ]);
    // Every band, lowest first; a missing one counts no record.
    expect(response.body.byHighestSeverity).toEqual([
      { key: 'low', count: 0 },
      { key: 'medium', count: 0 },
      { key: 'high', count: 1200 },
      { key: 'critical', count: 300 },
    ]);

    // A band holds the records with no score in a higher one.
    const queryOf = (clause: { query_string: { query: string } }) =>
      clause.query_string.query;
    const filters =
      mockSearch.mock.calls[0][0].body.aggs.byHighestSeverity.filters.filters;
    expect(queryOf(filters.medium.bool.filter[0])).toBe('[4 TO 7}');
    expect(filters.medium.bool.must_not.map(queryOf)).toEqual([
      '[7 TO 9}',
      '[9 TO 10]',
    ]);
    expect(queryOf(filters.critical)).toBe('[9 TO 10]');
  });

  it('lists the newest records of one type', async () => {
    mockSearch.mockResolvedValue({
      body: {
        hits: {
          total: { value: 212 },
          hits: [
            {
              _id: 'TID-0220',
              _source: {
                type: 'TID',
                offset: 1232180,
                document: { action: ['replace_vendor'], target: ['windows'] },
              },
            },
          ],
        },
      },
    });

    const response = await supertest(innerServer.listener)
      .post(CTI_EXPLORER_ROUTES.vulnerabilitiesSearch)
      .send({ type: 'TID', page: 0, pageSize: 25 })
      .expect(200);

    expect(response.body).toEqual({
      total: 212,
      items: [
        {
          id: 'TID-0220',
          type: 'TID',
          offset: 1232180,
          document: { action: ['replace_vendor'], target: ['windows'] },
        },
      ],
    });
    expect(searchBody().sort).toEqual([{ offset: { order: 'desc' } }]);
    expect(searchBody().query.bool.filter).toEqual([{ term: { type: 'TID' } }]);
  });

  it('filters the CVE records by the severity bands of their CNA base scores', async () => {
    mockSearch.mockResolvedValue({
      body: { hits: { total: { value: 0 }, hits: [] } },
    });

    await supertest(innerServer.listener)
      .post(CTI_EXPLORER_ROUTES.vulnerabilitiesSearch)
      .send({
        type: 'CVE',
        severities: ['low', 'critical'],
        page: 0,
        pageSize: 25,
      })
      .expect(200);

    const scoreRange = (query: string) => ({
      query_string: {
        query,
        fields: ['document.containers.cna.metrics.*.baseScore'],
      },
    });
    expect(searchBody().query.bool.filter).toEqual([
      { term: { type: 'CVE' } },
      {
        bool: {
          should: [scoreRange('{0 TO 4}'), scoreRange('[9 TO 10]')],
          minimum_should_match: 1,
        },
      },
    ]);
  });

  it('sorts by publication date, the records without one last', async () => {
    mockSearch.mockResolvedValue({
      body: { hits: { total: { value: 0 }, hits: [] } },
    });

    await supertest(innerServer.listener)
      .post(CTI_EXPLORER_ROUTES.vulnerabilitiesSearch)
      .send({
        sortField: 'document.cveMetadata.datePublished',
        sortDirection: 'asc',
        page: 0,
        pageSize: 25,
      })
      .expect(200);

    expect(searchBody().sort).toEqual([
      {
        'document.cveMetadata.datePublished': {
          order: 'asc',
          missing: '_last',
          unmapped_type: 'date',
        },
      },
      { offset: { order: 'desc' } },
    ]);
  });

  it('filters the records by their full id', async () => {
    mockSearch.mockResolvedValue({
      body: { hits: { total: { value: 0 }, hits: [] } },
    });

    await supertest(innerServer.listener)
      .post(CTI_EXPLORER_ROUTES.vulnerabilitiesSearch)
      .send({ type: 'CVE', id: 'CVE-2024-6387', page: 0, pageSize: 25 })
      .expect(200);

    expect(searchBody().query.bool.filter).toEqual([
      { term: { type: 'CVE' } },
      { ids: { values: ['CVE-2024-6387'] } },
    ]);
  });

  it('adds no severity filter for an empty selection', async () => {
    mockSearch.mockResolvedValue({
      body: { hits: { total: { value: 0 }, hits: [] } },
    });

    await supertest(innerServer.listener)
      .post(CTI_EXPLORER_ROUTES.vulnerabilitiesSearch)
      .send({ severities: [], page: 0, pageSize: 25 })
      .expect(200);

    expect(searchBody().query.bool.filter).toHaveLength(1);
  });

  it.each([
    ['an unknown severity', { severities: ['severe'] }],
    ['a severity that is not a list', { severities: 'high' }],
    ['an unknown sort field', { sortField: 'document.cveMetadata.state' }],
    ['an unknown sort direction', { sortDirection: 'up' }],
    ['a partial record id', { id: 'CVE-2024' }],
    ['a record id in lower case', { id: 'cve-2024-6387' }],
  ])('rejects %s', async (_label, change) => {
    await supertest(innerServer.listener)
      .post(CTI_EXPLORER_ROUTES.vulnerabilitiesSearch)
      .send({ page: 0, pageSize: 25, ...change })
      .expect(400);
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it('opens a record by its id', async () => {
    mockSearch.mockResolvedValue({
      body: {
        hits: {
          hits: [
            {
              _id: 'CVE-2024-6387',
              _source: {
                type: 'CVE',
                offset: 1117259,
                document: { cveMetadata: { cveId: 'CVE-2024-6387' } },
              },
            },
          ],
        },
      },
    });

    const response = await supertest(innerServer.listener)
      .get(`${CTI_EXPLORER_ROUTES.vulnerabilityRecord}/CVE-2024-6387`)
      .expect(200);

    expect(response.body.document).toEqual({
      cveMetadata: { cveId: 'CVE-2024-6387' },
    });
  });

  it.each(['FEED-GLOBAL', 'cve-2024-6387', 'CVE-2024'])(
    'rejects %s as a record id',
    async id => {
      await supertest(innerServer.listener)
        .get(`${CTI_EXPLORER_ROUTES.vulnerabilityRecord}/${id}`)
        .expect(400);
      expect(mockSearch).not.toHaveBeenCalled();
    },
  );
});
