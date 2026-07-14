import { Router } from '../../../../../src/core/server/http/router/router';
import { HttpServer } from '../../../../../src/core/server/http/http_server';
import { loggingSystemMock } from '../../../../../src/core/server/logging/logging_system.mock';
import { ByteSizeValue } from '@osd/config-schema';
import supertest from 'supertest';
import { CtiConsumersRoutes } from './index';

const serverAddress = '127.0.0.1';
const port = 11107;

const mockSearch = jest.fn();
const context = {
  core: {
    opensearch: {
      client: {
        asInternalUser: {
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

  CtiConsumersRoutes(router);
  registerRouter(router);
  await server.start();
});

afterAll(async () => {
  await server.stop();
  jest.clearAllMocks();
});

describe('GET /api/cti-consumers', () => {
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
      .get('/api/cti-consumers')
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

  test('returns an empty list when the index has zero documents', async () => {
    mockSearch.mockResolvedValue({
      body: { hits: { hits: [] } },
    });

    const response = await supertest(innerServer.listener)
      .get('/api/cti-consumers')
      .expect(200);

    expect(response.body).toEqual({ data: [] });
  });

  test('returns an empty list when the index does not exist yet', async () => {
    mockSearch.mockRejectedValue({
      statusCode: 404,
      message: 'index_not_found_exception',
    });

    const response = await supertest(innerServer.listener)
      .get('/api/cti-consumers')
      .expect(200);

    expect(response.body).toEqual({ data: [] });
  });

  test('maps unexpected errors to an explicit error response', async () => {
    mockSearch.mockRejectedValue({ statusCode: 500, message: 'boom' });

    const response = await supertest(innerServer.listener)
      .get('/api/cti-consumers')
      .expect(500);

    expect(response.body.message).toContain('boom');
  });
});
