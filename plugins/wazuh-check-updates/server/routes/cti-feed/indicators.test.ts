import { Router } from '../../../../../src/core/server/http/router/router';
import { HttpServer } from '../../../../../src/core/server/http/http_server';
import { loggingSystemMock } from '../../../../../src/core/server/logging/logging_system.mock';
import { ByteSizeValue } from '@osd/config-schema';
import supertest from 'supertest';
import { routes } from '../../../common/constants';
import { getCtiFeedIndicatorsRoute } from './indicators';

const serverAddress = '127.0.0.1';
const port = 11212;

const mockCount = jest.fn();
const context = {
  core: {
    opensearch: {
      client: {
        asCurrentUser: {
          count: mockCount,
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
  } as unknown as Parameters<HttpServer['setup']>[0];

  server = new HttpServer(loggingService, 'tests');
  const router = new Router('', logger, enhanceWithContext);
  const { registerRouter, server: innerServerTest } = await server.setup(
    config,
  );
  innerServer = innerServerTest;

  getCtiFeedIndicatorsRoute(router);
  registerRouter(router);
  await server.start();
});

afterAll(async () => {
  await server.stop();
  jest.clearAllMocks();
});

describe(`GET ${routes.ctiFeedIndicators}`, () => {
  beforeEach(() => {
    mockCount.mockReset();
  });

  test('returns the IOC and CVE counts', async () => {
    mockCount.mockImplementation(({ index }: { index: string }) =>
      Promise.resolve({
        body: { count: index.includes('enrichments') ? 672843 : 402878 },
      }),
    );

    const response = await supertest(innerServer.listener)
      .get(routes.ctiFeedIndicators)
      .expect(200);

    expect(response.body).toEqual({ iocs: 672843, vulnerabilities: 402878 });
    expect(mockCount).toHaveBeenCalledWith({
      index: 'wazuh-threatintel-enrichments*',
    });
    expect(mockCount).toHaveBeenCalledWith({
      index: '.wazuh-threatintel-vulnerabilities*',
      body: { query: { term: { type: 'CVE' } } },
    });
  });

  test('leaves a count null when its query fails', async () => {
    mockCount.mockImplementation(({ index }: { index: string }) =>
      index.includes('enrichments')
        ? Promise.resolve({ body: { count: 12 } })
        : Promise.reject({ statusCode: 403, message: 'security_exception' }),
    );

    const response = await supertest(innerServer.listener)
      .get(routes.ctiFeedIndicators)
      .expect(200);

    expect(response.body).toEqual({ iocs: 12, vulnerabilities: null });
  });

  test('leaves both counts null when no feed index exists', async () => {
    mockCount.mockRejectedValue({ statusCode: 404 });

    const response = await supertest(innerServer.listener)
      .get(routes.ctiFeedIndicators)
      .expect(200);

    expect(response.body).toEqual({ iocs: null, vulnerabilities: null });
  });
});
