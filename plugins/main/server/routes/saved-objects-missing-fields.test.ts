/** @jest-environment node */
/* eslint-disable camelcase -- saved objects API responses */
import { Router } from '../../../../src/core/server/http/router/router';
import { HttpServer } from '../../../../src/core/server/http/http_server';
import { loggingSystemMock } from '../../../../src/core/server/logging/logging_system.mock';
import { ByteSizeValue } from '@osd/config-schema';
import supertest from 'supertest';
import { SAVED_OBJECTS_MISSING_FIELDS_ROUTE } from '../../common/saved-objects-missing-fields';
import { SavedObjectsMissingFieldsRoutes } from './saved-objects-missing-fields';

const loggingService = loggingSystemMock.create();
const savedObjectsClient = {
  bulkGet: jest.fn(),
  get: jest.fn(),
};
const logger = { error: jest.fn() };
const context = {
  core: { savedObjects: { client: savedObjectsClient } },
  wazuh: { logger },
};
let server: HttpServer;
let innerServer: { listener: import('http').Server };

beforeAll(async () => {
  const config = {
    name: 'plugin_platform',
    host: '127.0.0.1',
    maxPayload: new ByteSizeValue(1024 * 64),
    port: 10013,
    ssl: { enabled: false },
    compression: { enabled: true },
    requestId: { allowFromAnyIp: true, ipAllowlist: [] },
  } as unknown as Parameters<HttpServer['setup']>[0];
  server = new HttpServer(loggingService, 'tests');
  const router = new Router('', loggingService.get(), fn =>
    fn.bind(null, context),
  );
  const { registerRouter, server: innerServerTest } = await server.setup(
    config,
  );
  innerServer = innerServerTest;
  SavedObjectsMissingFieldsRoutes(router);
  registerRouter(router);
  await server.start();
});

afterAll(async () => {
  await server.stop();
});

describe(`POST ${SAVED_OBJECTS_MISSING_FIELDS_ROUTE}`, () => {
  it('reports the requested objects that use missing fields', async () => {
    savedObjectsClient.bulkGet.mockResolvedValue({
      saved_objects: [
        {
          id: 'legacy',
          type: 'visualization',
          attributes: {
            title: 'Legacy',
            visState: JSON.stringify({
              aggs: [{ params: { field: 'rule.level' } }],
            }),
            kibanaSavedObjectMeta: {
              searchSourceJSON: '{"indexRefName":"ref"}',
            },
          },
          references: [{ name: 'ref', type: 'index-pattern', id: 'findings' }],
        },
        { id: 'legacy', type: 'search', error: { statusCode: 404 } },
      ],
    });
    savedObjectsClient.get.mockResolvedValue({
      attributes: {
        title: 'wazuh-findings-v5*',
        fields: '[{"name":"agent.name"}]',
      },
    });

    const response = await supertest(innerServer.listener)
      .post(SAVED_OBJECTS_MISSING_FIELDS_ROUTE)
      .send({ ids: ['legacy'] })
      .expect(200);

    expect(savedObjectsClient.bulkGet).toHaveBeenCalledWith([
      { id: 'legacy', type: 'visualization' },
      { id: 'legacy', type: 'search' },
    ]);
    expect(response.body.reports).toEqual([
      expect.objectContaining({
        id: 'legacy',
        missing: [{ field: 'rule.level', usedIn: ['aggregation'] }],
      }),
    ]);
  });

  it('logs and returns the error when the saved objects cannot be read', async () => {
    savedObjectsClient.bulkGet.mockRejectedValue(
      Object.assign(new Error('Forbidden'), { statusCode: 403 }),
    );

    const response = await supertest(innerServer.listener)
      .post(SAVED_OBJECTS_MISSING_FIELDS_ROUTE)
      .send({ ids: ['legacy'] })
      .expect(403);

    expect(response.body.message).toBe(
      'Error checking the fields used by saved objects: Forbidden',
    );
    expect(logger.error).toHaveBeenCalledWith(response.body.message);
  });

  it.each([[{}], [{ ids: [] }], [{ ids: [''] }]])(
    'rejects the body %j',
    async body => {
      await supertest(innerServer.listener)
        .post(SAVED_OBJECTS_MISSING_FIELDS_ROUTE)
        .send(body)
        .expect(400);
    },
  );
});
