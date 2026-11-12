/* eslint-disable camelcase -- consumer fields keep the index's snake_case names */
import { Router } from '../../../../../src/core/server/http/router/router';
import { HttpServer } from '../../../../../src/core/server/http/http_server';
import { loggingSystemMock } from '../../../../../src/core/server/logging/logging_system.mock';
import { ByteSizeValue } from '@osd/config-schema';
import supertest from 'supertest';
import { routes } from '../../../common/constants';
import { getCtiConsumersRoute } from './consumers';

const serverAddress = '127.0.0.1';
const port = 11207;

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
    maxPayload: new ByteSizeValue(1024),
    port,
    ssl: { enabled: false },
    compression: { enabled: true },
    requestId: {
      allowFromAnyIp: true,
      ipAllowlist: [],
    },
  } as any;

  server = new HttpServer(loggingService, 'tests');
  const router = new Router('', logger, enhanceWithContext);
  const { registerRouter, server: innerServerTest } = await server.setup(
    config,
  );
  innerServer = innerServerTest;

  getCtiConsumersRoute(router);
  registerRouter(router);
  await server.start();
});

afterAll(async () => {
  await server.stop();
  jest.clearAllMocks();
});

describe(`GET ${routes.ctiConsumers}`, () => {
  beforeEach(() => {
    mockSearch.mockReset();
  });

  test('returns mapped consumers on a successful query', async () => {
    mockSearch.mockResolvedValue({
      body: {
        hits: {
          hits: [
            {
              _source: {
                name: 'consumer-1',
                context: 'ctx-1',
                type: 'type-1',
                resource: 'https://example.test/resource-1',
                is_public: true,
                status: 'ok',
                local_offset: 10,
                remote_offset: 12,
              },
            },
          ],
        },
      },
    });

    const response = await supertest(innerServer.listener)
      .get(routes.ctiConsumers)
      .expect(200);

    expect(response.body).toEqual({
      data: [
        {
          name: 'consumer-1',
          context: 'ctx-1',
          type: 'type-1',
          resource: 'https://example.test/resource-1',
          is_public: true,
          status: 'ok',
          local_offset: 10,
          remote_offset: 12,
        },
      ],
    });
    expect(mockSearch).toHaveBeenCalledWith(
      expect.objectContaining({ index: '.wazuh-cti-consumers' }),
    );
  });

  test('passes the last update time through, and drops an unusable one', async () => {
    const source = {
      name: 'consumer-1',
      context: 'ctx-1',
      type: 'type-1',
      resource: '',
      is_public: true,
      status: 'ready',
      local_offset: 12,
      remote_offset: 12,
    };
    mockSearch.mockResolvedValue({
      body: {
        hits: {
          hits: [
            {
              _source: { ...source, updated_at: '2026-05-21T12:26:16.581939Z' },
            },
            { _source: { ...source, name: 'consumer-2', updated_at: 42 } },
          ],
        },
      },
    });

    const response = await supertest(innerServer.listener)
      .get(routes.ctiConsumers)
      .expect(200);

    expect(response.body.data[0].updated_at).toBe(
      '2026-05-21T12:26:16.581939Z',
    );
    expect(response.body.data[1]).not.toHaveProperty('updated_at');
  });

  test('reads the last check time from the global document, not as a feed', async () => {
    mockSearch.mockResolvedValue({
      body: {
        hits: {
          hits: [
            {
              _id: 'cti:catalog:global',
              _source: { last_checked_at: '2026-05-21T12:26:16.581939Z' },
            },
            {
              _id: 'cti:catalog:consumer:ruleset',
              _source: {
                name: 'public-ruleset-5',
                context: 'rc2-t1-ruleset-5',
                type: 'cti:catalog:consumer:ruleset',
                resource: '',
                is_public: true,
                status: 'ready',
                local_offset: 1056,
                remote_offset: 1056,
                pending_sync_phases: [],
              },
            },
          ],
        },
      },
    });

    const response = await supertest(innerServer.listener)
      .get(routes.ctiConsumers)
      .expect(200);

    expect(response.body.last_checked_at).toBe('2026-05-21T12:26:16.581939Z');
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name).toBe('public-ruleset-5');
  });

  test('passes the pending sync phases through, keeping only names', async () => {
    const source = {
      name: 'consumer-1',
      context: 'ctx-1',
      type: 'type-1',
      resource: '',
      is_public: true,
      status: 'ready',
      local_offset: 12,
      remote_offset: 12,
    };
    mockSearch.mockResolvedValue({
      body: {
        hits: {
          hits: [
            { _source: { ...source, pending_sync_phases: ['rules', 7, ''] } },
            { _source: { ...source, name: 'c-2', pending_sync_phases: [] } },
            { _source: { ...source, name: 'c-3', pending_sync_phases: 'x' } },
            { _source: { ...source, name: 'c-4' } },
          ],
        },
      },
    });

    const response = await supertest(innerServer.listener)
      .get(routes.ctiConsumers)
      .expect(200);

    const phases = response.body.data.map(
      (consumer: { pending_sync_phases?: string[] }) =>
        consumer.pending_sync_phases,
    );
    expect(phases).toEqual([['rules'], [], undefined, undefined]);
  });

  test('leaves the last check time out when the indexer does not report it', async () => {
    mockSearch.mockResolvedValue({
      body: {
        hits: {
          hits: [{ _id: 'cti:catalog:global', _source: {} }],
        },
      },
    });

    const response = await supertest(innerServer.listener)
      .get(routes.ctiConsumers)
      .expect(200);

    expect(response.body).toEqual({ data: [] });
  });

  test('returns an empty list when the index has zero documents', async () => {
    mockSearch.mockResolvedValue({
      body: { hits: { hits: [] } },
    });

    const response = await supertest(innerServer.listener)
      .get(routes.ctiConsumers)
      .expect(200);

    expect(response.body).toEqual({ data: [] });
  });

  test('returns an empty list when the index does not exist yet', async () => {
    mockSearch.mockRejectedValue({
      statusCode: 404,
      message: 'index_not_found_exception',
    });

    const response = await supertest(innerServer.listener)
      .get(routes.ctiConsumers)
      .expect(200);

    expect(response.body).toEqual({ data: [] });
  });

  test('maps unexpected errors to an explicit error response', async () => {
    mockSearch.mockRejectedValue({ statusCode: 500, message: 'boom' });

    const response = await supertest(innerServer.listener)
      .get(routes.ctiConsumers)
      .expect(500);

    expect(response.body.message).toContain('boom');
  });
});
