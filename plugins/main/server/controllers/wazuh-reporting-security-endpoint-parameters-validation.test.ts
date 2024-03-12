import { Router } from '../../../../src/core/server/http/router/router';
import { HttpServer } from '../../../../src/core/server/http/http_server';
import { loggingSystemMock } from '../../../../src/core/server/logging/logging_system.mock';
import { ByteSizeValue } from '@osd/config-schema';
import supertest from 'supertest';
import { WazuhReportingRoutes } from '../routes/wazuh-reporting';
import md5 from 'md5';

const loggingService = loggingSystemMock.create();
const logger = loggingService.get();
const context = {
  wazuh: {
    security: {
      getCurrentUser: request => {
        // x-test-username header doesn't exist when the platform or plugin are running.
        // It is used to generate the output of this method so we can simulate the user
        // that does the request to the endpoint and is expected by the endpoint handlers
        // of the plugin.
        const username = request.headers['x-test-username'];
        return { username, hashUsername: md5(username) };
      },
    },
    logger: {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
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
  WazuhReportingRoutes(router);

  // Register router
  registerRouter(router);

  // start server
  await server.start();
});

afterAll(async () => {
  // Stop server
  await server.stop();
});

describe('[endpoint][security] POST /reports/modules/{moduleID} - Parameters validation', () => {
  it.each`
    testTitle                | username   | moduleID          | agents      | responseStatusCode | responseBodyMessage
    ${'Invalid paramenters'} | ${'admin'} | ${'..general'}    | ${false}    | ${400}             | ${/\[request params.moduleID\]: types that failed validation:/}
    ${'Route not found'}     | ${'admin'} | ${'../general'}   | ${false}    | ${404}             | ${/Not Found/}
    ${'Route not found'}     | ${'admin'} | ${'../general'}   | ${'001'}    | ${404}             | ${/Not Found/}
    ${'Invalid paramenters'} | ${'admin'} | ${'..%2fgeneral'} | ${'../001'} | ${400}             | ${/\[request params.moduleID\]: types that failed validation:/}
    ${'Invalid paramenters'} | ${'admin'} | ${'..%2fgeneral'} | ${'001'}    | ${400}             | ${/\[request params.moduleID\]: types that failed validation:/}
    ${'Invalid paramenters'} | ${'admin'} | ${'general'}      | ${'..001'}  | ${400}             | ${/\[request body.agents\]: types that failed validation:/}
    ${'Invalid paramenters'} | ${'admin'} | ${'general'}      | ${'../001'} | ${400}             | ${/\[request body.agents\]: types that failed validation:/}
  `(
    `$testTitle: GET /reports/modules/$moduleID - responseStatusCode: $responseStatusCode
        username: $username
        agents: $agents
        responseBodyMessage: $responseBodyMessage`,
    async ({
      username,
      moduleID,
      agents,
      responseStatusCode,
      responseBodyMessage,
    }) => {
      const response = await supertest(innerServer.listener)
        .post(`/reports/modules/${moduleID}`)
        .set('x-test-username', username)
        .send({
          array: [],
          agents: agents,
          browserTimezone: '',
          searchBar: '',
          filters: [],
          time: {
            from: '',
            to: '',
          },
          tables: [],
          section: 'overview',
          indexPatternTitle: 'wazuh-alerts-*',
          apiId: 'default',
        })
        .expect(responseStatusCode);
      if (responseBodyMessage) {
        expect(response.body.message).toMatch(responseBodyMessage);
      }
    },
  );
});

describe('[endpoint][security] POST /reports/groups/{groupID} - Parameters validation', () => {
  it.each`
    testTitle               | username       | groupID           | responseStatusCode | responseBodyMessage
    ${'Invalid parameters'} | ${'admin'}     | ${'..%2fdefault'} | ${400}             | ${'[request params.groupID]: must be A-z, 0-9, _, . are allowed. It must not be ., .. or all.'}
    ${'Route not found'}    | ${'admin'}     | ${'../default'}   | ${404}             | ${/Not Found/}
    ${'Invalid parameters'} | ${'../../etc'} | ${'..%2fdefault'} | ${400}             | ${'[request params.groupID]: must be A-z, 0-9, _, . are allowed. It must not be ., .. or all.'}
    ${'Route not found'}    | ${'../../etc'} | ${'../default'}   | ${404}             | ${/Not Found/}
  `(
    `$testTitle: POST /reports/groups/$groupID - $responseStatusCode
        username: $username
        responseBodyMessage: $responseBodyMessage`,
    async ({ username, groupID, responseStatusCode, responseBodyMessage }) => {
      const response = await supertest(innerServer.listener)
        .post(`/reports/groups/${groupID}`)
        .set('x-test-username', username)
        .send({
          browserTimezone: '',
          components: { '1': true },
          section: '',
          apiId: 'default',
        })
        .expect(responseStatusCode);
      if (responseBodyMessage) {
        expect(response.body.message).toMatch(responseBodyMessage);
      }
    },
  );
});

describe('[endpoint][security] POST /reports/agents/{agentID} - Parameters validation', () => {
  it.each`
    testTitle               | username       | agentID       | responseStatusCode | responseBodyMessage
    ${'Invalid parameters'} | ${'admin'}     | ${'..001'}    | ${400}             | ${/\[request params.agentID\]: must be 0-9 are allowed/}
    ${'Route not found'}    | ${'admin'}     | ${'../001'}   | ${404}             | ${/Not Found/}
    ${'Invalid parameters'} | ${'admin'}     | ${'..%2f001'} | ${400}             | ${/\[request params.agentID\]: must be 0-9 are allowed/}
    ${'Invalid parameters'} | ${'admin'}     | ${'1'}        | ${400}             | ${/\[request params.agentID\]: value has length \[1\] but it must have a minimum length of \[3\]./}
    ${'Invalid parameters'} | ${'../../etc'} | ${'..001'}    | ${400}             | ${/\[request params.agentID\]: must be 0-9 are allowed/}
    ${'Route not found'}    | ${'../../etc'} | ${'../001'}   | ${404}             | ${/Not Found/}
    ${'Invalid parameters'} | ${'../../etc'} | ${'..%2f001'} | ${400}             | ${/\[request params.agentID\]: must be 0-9 are allowed/}
    ${'Invalid parameters'} | ${'../../etc'} | ${'1'}        | ${400}             | ${/\[request params.agentID\]: value has length \[1\] but it must have a minimum length of \[3\]./}
  `(
    `$testTitle: POST /reports/agents/$agentID - $responseStatusCode
        username: $username
        responseBodyMessage: $responseBodyMessage`,
    async ({ username, agentID, responseStatusCode, responseBodyMessage }) => {
      const response = await supertest(innerServer.listener)
        .post(`/reports/agents/${agentID}`)
        .set('x-test-username', username)
        .send({
          array: [],
          agents: agentID,
          browserTimezone: '',
          searchBar: '',
          filters: [],
          time: {
            from: '',
            to: '',
          },
          tables: [],
          section: 'overview',
          indexPatternTitle: 'wazuh-alerts-*',
          apiId: 'default',
        })
        .expect(responseStatusCode);
      if (responseBodyMessage) {
        expect(response.body.message).toMatch(responseBodyMessage);
      }
    },
  );
});

describe('[endpoint][security] POST /reports/agents/{agentID}/inventory - Parameters validation', () => {
  it.each`
    testTitle               | username       | agentID       | responseStatusCode | responseBodyMessage
    ${'Invalid parameters'} | ${'admin'}     | ${'..001'}    | ${400}             | ${/\[request params.agentID\]: must be 0-9 are allowed/}
    ${'Route not found'}    | ${'admin'}     | ${'../001'}   | ${404}             | ${/Not Found/}
    ${'Invalid parameters'} | ${'admin'}     | ${'..%2f001'} | ${400}             | ${/\[request params.agentID\]: must be 0-9 are allowed/}
    ${'Invalid parameters'} | ${'admin'}     | ${'1'}        | ${400}             | ${/\[request params.agentID\]: value has length \[1\] but it must have a minimum length of \[3\]./}
    ${'Invalid parameters'} | ${'../../etc'} | ${'..001'}    | ${400}             | ${/\[request params.agentID\]: must be 0-9 are allowed/}
    ${'Route not found'}    | ${'../../etc'} | ${'../001'}   | ${404}             | ${/Not Found/}
    ${'Invalid parameters'} | ${'../../etc'} | ${'..%2f001'} | ${400}             | ${/\[request params.agentID\]: must be 0-9 are allowed/}
    ${'Invalid parameters'} | ${'../../etc'} | ${'1'}        | ${400}             | ${/\[request params.agentID\]: value has length \[1\] but it must have a minimum length of \[3\]./}
  `(
    `$testTitle: GET /reports/agents/$agentID/inventory - $responseStatusCode
        username: $username
        responseBodyMessage: $responseBodyMessage`,
    async ({ username, agentID, responseStatusCode, responseBodyMessage }) => {
      const response = await supertest(innerServer.listener)
        .post(`/reports/agents/${agentID}/inventory`)
        .set('x-test-username', username)
        .send({
          browserTimezone: '',
          components: { '1': true },
          section: '',
          apiId: 'default',
        })
        .expect(responseStatusCode);
      if (responseBodyMessage) {
        expect(response.body.message).toMatch(responseBodyMessage);
      }
    },
  );
});
