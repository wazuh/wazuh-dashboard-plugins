/* eslint-disable camelcase -- OpenSearch query DSL and response fields */
import { Router } from '../../../../../src/core/server/http/router/router';
import { HttpServer } from '../../../../../src/core/server/http/http_server';
import { loggingSystemMock } from '../../../../../src/core/server/logging/logging_system.mock';
import { ByteSizeValue } from '@osd/config-schema';
import supertest from 'supertest';
import { routes } from '../../../common/constants';
import { getIndicatorCatalogRoutes } from './indicator-catalog';

const serverAddress = '127.0.0.1';
const port = 11213;

const mockSearch = jest.fn();
const context = {
  core: {
    opensearch: {
      client: {
        asCurrentUser: {
          search: mockSearch,
        },
      },
    },
  },
};
const enhanceWithContext = (fn: (...args: unknown[]) => unknown) =>
  fn.bind(null, context);

const loggingService = loggingSystemMock.create();
const logger = loggingService.get();
let server: HttpServer;
let innerServer: { listener: import('http').Server };

beforeAll(async () => {
  const config = {
    name: 'plugin_platform',
    host: serverAddress,
    maxPayload: new ByteSizeValue(1024 * 16),
    port,
    ssl: { enabled: false },
    compression: { enabled: true },
    requestId: {
      allowFromAnyIp: true,
      ipAllowlist: [],
    },
  } as unknown as Parameters<HttpServer['setup']>[0];

  server = new HttpServer(loggingService, 'tests');
  const router = new Router('', logger, enhanceWithContext);
  const { registerRouter, server: innerServerTest } = await server.setup(
    config,
  );
  innerServer = innerServerTest;

  getIndicatorCatalogRoutes(router);
  registerRouter(router);
  await server.start();
});

afterAll(async () => {
  await server.stop();
  jest.clearAllMocks();
});

const HIT = {
  _id: '1734927',
  _source: {
    document: {
      name: '124.198.132.174:8080',
      type: 'connection',
      provider: 'threat-fox',
      feed: { name: 'abuse_ch' },
      confidence: 100,
      first_seen: '2026-01-20T19:55:07.000Z',
      software: { name: 'win.asyncrat', type: 'botnet_cc', alias: 'AsyncRAT' },
      tags: ['AsyncRAT', 'RAT'],
    },
  },
};

const searchBody = () => mockSearch.mock.calls[0][0].body;

describe(`POST ${routes.ctiCatalogIndicatorsLookup}`, () => {
  beforeEach(() => {
    mockSearch.mockReset();
    mockSearch.mockResolvedValue({
      body: { hits: { total: { value: 1 }, hits: [HIT] } },
    });
  });

  test('matches a bare IP exactly and by its anchored host:port prefix', async () => {
    const response = await supertest(innerServer.listener)
      .post(routes.ctiCatalogIndicatorsLookup)
      .send({ q: '124.198.132.174' })
      .expect(200);

    expect(mockSearch.mock.calls[0][0].index).toBe(
      'wazuh-threatintel-enrichments',
    );
    expect(searchBody().query).toEqual({
      bool: {
        minimum_should_match: 1,
        should: [
          {
            term: {
              'document.name': {
                value: '124.198.132.174',
                case_insensitive: true,
              },
            },
          },
          {
            bool: {
              filter: [
                { term: { 'document.type': 'connection' } },
                {
                  prefix: {
                    'document.name': {
                      value: '124.198.132.174:',
                      case_insensitive: true,
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    });
    expect(response.body).toEqual({
      total: 1,
      items: [
        expect.objectContaining({
          id: '1734927',
          name: '124.198.132.174:8080',
          feedName: 'abuse_ch',
          firstSeen: '2026-01-20T19:55:07.000Z',
          software: {
            name: 'win.asyncrat',
            type: 'botnet_cc',
            alias: ['AsyncRAT'],
          },
        }),
      ],
    });
  });

  test('matches a domain exactly, with no prefix or wildcard', async () => {
    await supertest(innerServer.listener)
      .post(routes.ctiCatalogIndicatorsLookup)
      .send({ q: 'google.com' })
      .expect(200);

    const serialized = JSON.stringify(searchBody().query);
    expect(serialized).not.toMatch(/prefix|wildcard|query_string/);
    expect(searchBody().query.bool.should).toHaveLength(1);
  });

  test('looks a hash up in document.name, not in the record hash', async () => {
    const hash = 'ABCDEF'.padEnd(64, '0');
    await supertest(innerServer.listener)
      .post(routes.ctiCatalogIndicatorsLookup)
      .send({ q: hash })
      .expect(200);

    expect(searchBody().query.bool.should).toEqual([
      {
        term: { 'document.name': { value: hash, case_insensitive: true } },
      },
    ]);
  });

  test.each([{}, { q: '' }, { q: '   ' }, { q: 'x'.repeat(4097) }])(
    'rejects the body %p',
    async body => {
      await supertest(innerServer.listener)
        .post(routes.ctiCatalogIndicatorsLookup)
        .send(body)
        .expect(400);
      expect(mockSearch).not.toHaveBeenCalled();
    },
  );

  test('names the index when the user cannot read it', async () => {
    mockSearch.mockRejectedValue({
      meta: {
        statusCode: 403,
        body: {
          error: {
            type: 'security_exception',
            reason: 'no permissions for [indices:data/read/search]',
          },
        },
      },
    });

    const response = await supertest(innerServer.listener)
      .post(routes.ctiCatalogIndicatorsLookup)
      .send({ q: 'evil.example' })
      .expect(403);

    expect(response.body.message).toBe(
      'Could not read wazuh-threatintel-enrichments: no permissions for [indices:data/read/search]',
    );
    expect(response.body.attributes).toEqual({
      index: 'wazuh-threatintel-enrichments',
      reason: 'security_exception',
    });
  });
});

describe(`POST ${routes.ctiCatalogIndicatorsSearch}`, () => {
  beforeEach(() => {
    mockSearch.mockReset();
    mockSearch.mockResolvedValue({
      body: { hits: { total: { value: 50107 }, hits: [HIT] } },
    });
  });

  test('lists the newest records, 20 per page', async () => {
    const response = await supertest(innerServer.listener)
      .post(routes.ctiCatalogIndicatorsSearch)
      .send({ page: 2 })
      .expect(200);

    expect(searchBody()).toEqual(
      expect.objectContaining({
        from: 40,
        size: 20,
        query: { match_all: {} },
        sort: [
          {
            'document.first_seen': expect.objectContaining({ order: 'desc' }),
          },
        ],
      }),
    );
    expect(response.body.total).toBe(50107);
  });

  test('filters by type, provider, family, role and an anchored prefix', async () => {
    await supertest(innerServer.listener)
      .post(routes.ctiCatalogIndicatorsSearch)
      .send({
        page: 0,
        type: 'hash_sha256',
        provider: 'threat-fox',
        family: 'win.remcos',
        role: 'botnet_cc',
        prefix: ' 70ff ',
      })
      .expect(200);

    expect(searchBody().query).toEqual({
      bool: {
        filter: [
          { term: { 'document.type': 'hash_sha256' } },
          { term: { 'document.provider': 'threat-fox' } },
          { term: { 'document.software.name': 'win.remcos' } },
          { term: { 'document.software.type': 'botnet_cc' } },
          {
            prefix: {
              'document.name': { value: '70ff', case_insensitive: true },
            },
          },
        ],
      },
    });
  });

  test.each([
    { page: 51 },
    { page: -1 },
    { page: 1.5 },
    { type: 'ip' },
    { prefix: '   ' },
    { provider: 'x'.repeat(257) },
  ])('rejects the body %p', async body => {
    await supertest(innerServer.listener)
      .post(routes.ctiCatalogIndicatorsSearch)
      .send(body)
      .expect(400);
    expect(mockSearch).not.toHaveBeenCalled();
  });
});

describe(`GET ${routes.ctiCatalogIndicatorsSummary}`, () => {
  beforeEach(() => mockSearch.mockReset());

  test('maps the aggregations', async () => {
    mockSearch.mockResolvedValue({
      body: {
        hits: { total: { value: 891664 } },
        aggregations: {
          lastThirtyDays: { doc_count: 49403 },
          providers: { value: 10 },
          families: { value: 670 },
          averageConfidence: { value: 87.5 },
          byType: { buckets: [{ key: 'url_domain', doc_count: 554849 }] },
          byProvider: { buckets: [{ key: 'threat-fox', doc_count: 395325 }] },
          byRole: { buckets: [{ key: 'botnet_cc', doc_count: 193965 }] },
          topFamilies: { buckets: [{ key: 'js.clearfake', doc_count: 77438 }] },
          recent: {
            byMonth: { buckets: [{ key: 1746057600000, doc_count: 963 }] },
          },
        },
      },
    });

    const response = await supertest(innerServer.listener)
      .get(routes.ctiCatalogIndicatorsSummary)
      .expect(200);

    expect(response.body).toEqual({
      total: 891664,
      firstSeenLast30Days: 49403,
      providers: 10,
      families: 670,
      averageConfidence: 87.5,
      byType: [{ key: 'url_domain', count: 554849 }],
      byProvider: [{ key: 'threat-fox', count: 395325 }],
      byRole: [{ key: 'botnet_cc', count: 193965 }],
      topFamilies: [{ key: 'js.clearfake', count: 77438 }],
      firstSeenByMonth: [{ date: 1746057600000, count: 963 }],
    });
    expect(searchBody().track_total_hits).toBe(true);
    expect(searchBody().size).toBe(0);
  });

  test('reports a missing index as not found', async () => {
    mockSearch.mockRejectedValue({
      statusCode: 404,
      message: 'index_not_found_exception',
    });

    const response = await supertest(innerServer.listener)
      .get(routes.ctiCatalogIndicatorsSummary)
      .expect(404);

    expect(response.body.attributes.index).toBe(
      'wazuh-threatintel-enrichments',
    );
  });
});
