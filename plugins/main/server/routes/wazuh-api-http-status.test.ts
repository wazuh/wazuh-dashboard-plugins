/** @jest-environment node */
// To launch this file
// yarn test:jest --testEnvironment node --verbose server/routes/wazuh-api-http-status.test.ts
import { Router } from '../../../../src/core/server/http/router/router';
import { HttpServer } from '../../../../src/core/server/http/http_server';
import { loggingSystemMock } from '../../../../src/core/server/logging/logging_system.mock';
import { ByteSizeValue } from '@osd/config-schema';
import supertest from 'supertest';
import { WazuhApiRoutes } from './wazuh-api';
import {
  HTTP_STATUS_CODES,
  WAZUH_QUEUE_MAX_JOBS,
} from '../../common/constants';
import { addJobToQueue, queue } from '../start/queue';

const loggingService = loggingSystemMock.create();
const logger = loggingService.get();
const mockApiRequest = jest.fn();
const context = {
  wazuh: {
    security: {
      getCurrentUser: jest.fn().mockResolvedValue({ username: 'wazuh' }),
    },
    logger: {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    },
    api: {
      client: {
        asCurrentUser: {
          request: mockApiRequest,
        },
      },
    },
  },
  wazuh_core: {
    manageHosts: {
      get: jest.fn(id => {
        return {
          id,
          url: 'https://localhost',
          port: 55000,
          username: 'wazuh-wui',
          password: 'wazuh-wui',
          run_as: false,
        };
      }),
      cacheAPIUserAllowRunAs: {
        set: jest.fn(),
        API_USER_STATUS_RUN_AS: {
          UNABLE_TO_CHECK: -1,
          ALL_DISABLED: 0,
          USER_NOT_ALLOWED: 1,
          HOST_DISABLED: 2,
          ENABLED: 3,
        },
      },
    },
  },
};

const enhanceWithContext = (fn: (...args: any[]) => any) =>
  fn.bind(null, context);
let server, innerServer;

beforeAll(async () => {
  // Create server
  const config = {
    name: 'plugin_platform',
    host: '127.0.0.1',
    maxPayload: new ByteSizeValue(1024),
    port: 10002,
    ssl: { enabled: false },
    compression: { enabled: true },
    requestId: {
      allowFromAnyIp: true,
      ipAllowlist: [],
    },
  } as any;
  server = new HttpServer(loggingService, 'tests');
  const router = new Router('', logger, enhanceWithContext);
  const {
    registerRouter,
    server: innerServerTest,
    ...rest
  } = await server.setup(config);
  innerServer = innerServerTest;

  // Register routes
  WazuhApiRoutes(router);

  // Register router
  registerRouter(router);

  // start server
  await server.start();
});

afterAll(async () => {
  // Stop server
  await server.stop();

  // Clear all mocks
  jest.clearAllMocks();
});

describe('[endpoint] POST /api/request - upstream API error status mapping', () => {
  beforeEach(() => {
    mockApiRequest.mockReset();
  });

  const requestBody = {
    method: 'GET',
    path: '/agents',
    body: {},
    id: 'default',
  };

  it.each`
    upstreamStatus | message                                            | expectedStatusCode
    ${403}         | ${'3013 - Permission denied: Resource type: *:*'}  | ${HTTP_STATUS_CODES.FORBIDDEN}
    ${401}         | ${'3000 - Invalid credentials'}                    | ${HTTP_STATUS_CODES.UNAUTHORIZED}
    ${400}         | ${"'../evil' is not a 'group_names' - 'group_id'"} | ${HTTP_STATUS_CODES.BAD_REQUEST}
    ${404}         | ${'404: Not Found'}                                | ${HTTP_STATUS_CODES.NOT_FOUND}
    ${405}         | ${'405: Method Not Allowed'}                       | ${HTTP_STATUS_CODES.METHOD_NOT_ALLOWED}
    ${409}         | ${'409: Conflict'}                                 | ${HTTP_STATUS_CODES.CONFLICT}
  `(
    'API error with upstream status $upstreamStatus responds $expectedStatusCode',
    async ({ upstreamStatus, message, expectedStatusCode }) => {
      mockApiRequest.mockRejectedValue({
        message,
        code: 'ERR_BAD_REQUEST',
        response: {
          status: upstreamStatus,
          data: { detail: message },
        },
      });

      const response = await supertest(innerServer.listener)
        .post('/api/request')
        .set('Cookie', 'wz-api=default')
        .send(requestBody)
        .expect(expectedStatusCode);

      expect(response.body.message).toBeDefined();
    },
  );

  it('unexpected error without upstream status responds 500', async () => {
    mockApiRequest.mockRejectedValue(new Error('Unexpected error'));

    await supertest(innerServer.listener)
      .post('/api/request')
      .set('Cookie', 'wz-api=default')
      .send(requestBody)
      .expect(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);
  });

  it('does not leak a Wazuh internal error code into the status line', async () => {
    // 3013 is a Wazuh code, not a status.
    mockApiRequest.mockRejectedValue({
      message: 'Unexpected error',
      code: 3013,
    });

    await supertest(innerServer.listener)
      .post('/api/request')
      .set('Cookie', 'wz-api=default')
      .send(requestBody)
      .expect(HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR);
  });

  it('keeps the axios message on a 401 so the client can refresh the token', async () => {
    // The client spots an expired session by matching "status code 401".
    mockApiRequest.mockRejectedValue({
      isAxiosError: true,
      message: 'Request failed with status code 401',
      code: 'ERR_BAD_REQUEST',
      response: { status: 401, data: { detail: 'Invalid credentials' } },
    });

    const response = await supertest(innerServer.listener)
      .post('/api/request')
      .set('Cookie', 'wz-api=default')
      .send(requestBody)
      .expect(HTTP_STATUS_CODES.UNAUTHORIZED);

    expect(response.body.message).toContain('status code 401');
  });
});

describe('[endpoint] POST /api/request - delayed requests', () => {
  beforeEach(() => {
    queue.splice(0);
    mockApiRequest.mockReset();
  });

  const restart = (body: object) =>
    supertest(innerServer.listener)
      .post('/api/request')
      .set('Cookie', 'wz-api=default')
      .send({ method: 'PUT', path: '/cluster/restart', body, id: 'default' });

  it.each([-1, 1.5, '15000', 60001, {}])(
    'rejects the delay %p with a 400 and queues nothing',
    async delay => {
      const response = await restart({ delay }).expect(
        HTTP_STATUS_CODES.BAD_REQUEST,
      );

      expect(response.body.message).toContain('3015');
      expect(queue).toHaveLength(0);
      expect(mockApiRequest).not.toHaveBeenCalled();
    },
  );

  it('queues a valid delay without calling the API and strips it from the data', async () => {
    const response = await restart({ delay: 15000, other: 'x' }).expect(
      HTTP_STATUS_CODES.OK,
    );

    expect(response.body).toEqual({ error: 0, message: 'Success' });
    expect(mockApiRequest).not.toHaveBeenCalled();
    expect(queue).toHaveLength(1);

    await queue[0].run(context);

    expect(mockApiRequest).toHaveBeenCalledTimes(1);
    expect(mockApiRequest.mock.calls[0][2]).toMatchObject({ other: 'x' });
    expect(mockApiRequest.mock.calls[0][2]).not.toHaveProperty('delay');
  });

  it('responds 429 when the queue is full', async () => {
    for (let i = 0; i < WAZUH_QUEUE_MAX_JOBS; i++) {
      addJobToQueue({
        startAt: new Date(Date.now() + 15000),
        owner: `user-${i}`,
        run: jest.fn(),
      });
    }

    const response = await restart({ delay: 15000 }).expect(
      HTTP_STATUS_CODES.TOO_MANY_REQUESTS,
    );

    expect(response.body.message).toContain('3017');
    expect(queue).toHaveLength(WAZUH_QUEUE_MAX_JOBS);
  });
});

describe('[endpoint] GET /api/check-api', () => {
  it.each`
    apiId        | statusCode
    ${'default'} | ${HTTP_STATUS_CODES.SERVICE_UNAVAILABLE}
  `(
    `Get API configuration POST /api/check-api - apiID - $statusCode`,
    async ({ apiId, statusCode }) => {
      const body = { id: apiId, forceRefresh: false };
      const response = await supertest(innerServer.listener)
        .post('/api/check-api')
        .send(body)
        .expect(statusCode);
    },
  );
});
