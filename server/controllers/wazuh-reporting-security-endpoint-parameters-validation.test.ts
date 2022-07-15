import { Router } from '../../../../src/core/server/http/router/router';
import { HttpServer } from '../../../../src/core/server/http/http_server';
import { loggingSystemMock } from '../../../../src/core/server/logging/logging_system.mock';
import { ByteSizeValue } from '@kbn/config-schema';
import supertest from 'supertest';
import { WazuhReportingRoutes } from '../routes/wazuh-reporting';
import md5 from 'md5';
import { createDataDirectoryIfNotExists, createDirectoryIfNotExists } from '../lib/filesystem';
import { WAZUH_DATA_ABSOLUTE_PATH, WAZUH_DATA_DOWNLOADS_DIRECTORY_PATH, WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH } from '../../common/constants';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const loggingService = loggingSystemMock.create();
const logger = loggingService.get();
const context = {
  wazuh: {
    security: {
      getCurrentUser: (request) => {
        // x-test-username header doesn't exist when the platform or plugin are running.
        // It is used to generate the output of this method so we can simulate the user
        // that does the request to the endpoint and is expected by the endpoint handlers
        // of the plugin.
        const username = request.headers['x-test-username'];
        return { username, hashUsername: md5(username) }
      }
    }
  }
};
const enhanceWithContext = (fn: (...args: any[]) => any) => fn.bind(null, context);
let server, innerServer;

beforeAll(async () => {
  // Create <PLUGIN_PLATFORM_PATH>/data/wazuh directory.
  createDataDirectoryIfNotExists();
  // Create <PLUGIN_PLATFORM_PATH>/data/wazuh/downloads directory.
  createDirectoryIfNotExists(WAZUH_DATA_DOWNLOADS_DIRECTORY_PATH);
  // Create <PLUGIN_PLATFORM_PATH>/data/wazuh/downloads/reports directory.
  createDirectoryIfNotExists(WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH);
  // Create report files
  [
    { name: md5('admin'), files: ['wazuh-module-overview-general-1234.pdf'] },
    { name: md5('../../etc'), files: ['wazuh-module-overview-general-1234.pdf'] }
  ].forEach(({ name, files }) => {
    createDirectoryIfNotExists(path.join(WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH, name));

    if (files) {
      files.forEach(filename => fs.closeSync(fs.openSync(path.join(WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH, name, filename), 'w')));
    };
  });

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
  const { registerRouter, server: innerServerTest, ...rest } = await server.setup(config);
  innerServer = innerServerTest;

  // Register routes
  WazuhReportingRoutes(router);

  // Register router
  registerRouter(router);

  // start server
  await server.start();
});

afterAll(async () => {
  // Remove <PLUGIN_PLATFORM_PATH>/data/wazuh directory.
  execSync(`rm -rf ${WAZUH_DATA_ABSOLUTE_PATH}`);

  // Stop server
  await server.stop();
});

describe('[endpoint] GET /reports', () => {
  it.each`
        username
        ${'admin'}
        ${'../../etc'}
    `(`Get reports of user GET /reports - 200
        username: $username`, async ({ username }) => {
    const response = await supertest(innerServer.listener)
      .get('/reports')
      .set('x-test-username', username)
      .expect(200);

    expect(response.body.reports).toBeDefined();
  });
});

describe('[endpoint][security] GET /reports/{name} - Parameters validation', () => {
  it.each`
        testTitle                   | username       | filename                                                  | responseStatusCode | responseBodyMessage
        ${'Get report by filename'} | ${'admin'}     | ${'wazuh-module-overview-general-1234.pdf'}               | ${200}             | ${null}
        ${'Invalid parameters'}     | ${'admin'}     | ${'..%2fwazuh-module-overview-general-1234.pdf'}          | ${400}             | ${'[request params.name]: must be A-z, 0-9, _, ., and - are allowed. It must end with .pdf.'}
        ${'Invalid parameters'}     | ${'admin'}     | ${'custom..%2fwazuh-module-overview-general-1234.pdf'}    | ${400}             | ${'[request params.name]: must be A-z, 0-9, _, ., and - are allowed. It must end with .pdf.'}
        ${'Route not found'}        | ${'admin'}     | ${'../custom..%2fwazuh-module-overview-general-1234.pdf'} | ${404}             | ${/Not Found/}
        ${'Get report by filename'} | ${'../../etc'} | ${'wazuh-module-overview-general-1234.pdf'}               | ${200}             | ${null}
        ${'Invalid parameters'}     | ${'../../etc'} | ${'..%2fwazuh-module-overview-general-1234.pdf'}          | ${400}             | ${'[request params.name]: must be A-z, 0-9, _, ., and - are allowed. It must end with .pdf.'}
        ${'Invalid parameters'}     | ${'../../etc'} | ${'custom..%2fwazuh-module-overview-general-1234.pdf'}    | ${400}             | ${'[request params.name]: must be A-z, 0-9, _, ., and - are allowed. It must end with .pdf.'}
        ${'Route not found'}        | ${'../../etc'} | ${'../custom..%2fwazuh-module-overview-general-1234.pdf'} | ${404}             | ${/Not Found/}
    `(`$testTitle: GET /reports/$filename - responseStatusCode: $responseStatusCode
        username: $username
        responseBodyMessage: $responseBodyMessage`, async ({ username, filename, responseStatusCode, responseBodyMessage }) => {
    const response = await supertest(innerServer.listener)
      .get(`/reports/${filename}`)
      .set('x-test-username', username)
      .expect(responseStatusCode);
    if (responseStatusCode === 200) {
      expect(response.header['content-type']).toMatch(/application\/pdf/);
      expect(response.body instanceof Buffer).toBe(true);
    };
    if (responseBodyMessage) {
      expect(response.body.message).toMatch(responseBodyMessage);
    };
  });
});

describe('[endpoint][security] POST /reports/modules/{moduleID} - Parameters validation', () => {
  it.each`
        testTitle                | username     |  moduleID         | agents      | responseStatusCode | responseBodyMessage
        ${'Invalid paramenters'} | ${'admin'}   | ${'..general'}    | ${false}    | ${400}             | ${/\[request params.moduleID\]: types that failed validation:/}
        ${'Route not found'}     | ${'admin'}   | ${'../general'}   | ${false}    | ${404}             | ${/Not Found/}
        ${'Route not found'}     | ${'admin'}   | ${'../general'}   | ${'001'}    | ${404}             | ${/Not Found/}
        ${'Invalid paramenters'} | ${'admin'}   | ${'..%2fgeneral'} | ${'../001'} | ${400}             | ${/\[request params.moduleID\]: types that failed validation:/}
        ${'Invalid paramenters'} | ${'admin'}   | ${'..%2fgeneral'} | ${'001'}    | ${400}             | ${/\[request params.moduleID\]: types that failed validation:/}
        ${'Invalid paramenters'} | ${'admin'}   | ${'general'}      | ${'..001'}  | ${400}             | ${/\[request body.agents\]: types that failed validation:/}
        ${'Invalid paramenters'} | ${'admin'}   | ${'general'}      | ${'../001'} | ${400}             | ${/\[request body.agents\]: types that failed validation:/}
    `(`$testTitle: GET /reports/modules/$moduleID - responseStatusCode: $responseStatusCode
        username: $username
        agents: $agents
        responseBodyMessage: $responseBodyMessage`, async ({ username, moduleID, agents, responseStatusCode, responseBodyMessage }) => {
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
          to: ''
        },
        tables: [],
        section: 'overview',
        indexPatternTitle: 'wazuh-alerts-*',
        apiId: 'default'
      })
      .expect(responseStatusCode);
    if (responseBodyMessage) {
      expect(response.body.message).toMatch(responseBodyMessage);
    };
  });
});

describe('[endpoint][security] POST /reports/groups/{groupID} - Parameters validation', () => {
  it.each`
        testTitle               | username       | groupID           | responseStatusCode | responseBodyMessage
        ${'Invalid parameters'} | ${'admin'}     | ${'..%2fdefault'} | ${400}             | ${'[request params.groupID]: must be A-z, 0-9, _, . are allowed. It must not be ., .. or all.'}
        ${'Route not found'}    | ${'admin'}     | ${'../default'}   | ${404}             | ${/Not Found/}
        ${'Invalid parameters'} | ${'../../etc'} | ${'..%2fdefault'} | ${400}             | ${'[request params.groupID]: must be A-z, 0-9, _, . are allowed. It must not be ., .. or all.'}
        ${'Route not found'}    | ${'../../etc'} | ${'../default'}   | ${404}             | ${/Not Found/}
    `(`$testTitle: GET /reports/groups/$groupID - $responseStatusCode
        username: $username
        responseBodyMessage: $responseBodyMessage`, async ({ username, groupID, responseStatusCode, responseBodyMessage }) => {
    const response = await supertest(innerServer.listener)
      .post(`/reports/groups/${groupID}`)
      .set('x-test-username', username)
      .send({
        browserTimezone: '',
        components: { '1': true },
        section: '',
        apiId: 'default'
      })
      .expect(responseStatusCode);
    if (responseBodyMessage) {
      expect(response.body.message).toMatch(responseBodyMessage);
    };
  });
});

describe('[endpoint][security] POST /reports/agents/{agentID} - Parameters validation', () => {
  it.each`
        testTitle               |username        | agentID       | responseStatusCode | responseBodyMessage
        ${'Invalid parameters'} | ${'admin'}     | ${'..001'}    | ${400}             | ${/\[request params.agentID\]: must be 0-9 are allowed/}
        ${'Route not found'}    | ${'admin'}     | ${'../001'}   | ${404}             | ${/Not Found/}
        ${'Invalid parameters'} | ${'admin'}     | ${'..%2f001'} | ${400}             | ${/\[request params.agentID\]: must be 0-9 are allowed/}
        ${'Invalid parameters'} | ${'admin'}     | ${'1'}        | ${400}             | ${/\[request params.agentID\]: value has length \[1\] but it must have a minimum length of \[3\]./}
        ${'Invalid parameters'} | ${'../../etc'} | ${'..001'}    | ${400}             | ${/\[request params.agentID\]: must be 0-9 are allowed/}
        ${'Route not found'}    | ${'../../etc'} | ${'../001'}   | ${404}             | ${/Not Found/}
        ${'Invalid parameters'} | ${'../../etc'} | ${'..%2f001'} | ${400}             | ${/\[request params.agentID\]: must be 0-9 are allowed/}
        ${'Invalid parameters'} | ${'../../etc'} | ${'1'}        | ${400}             | ${/\[request params.agentID\]: value has length \[1\] but it must have a minimum length of \[3\]./}
    `(`$testTitle: GET /reports/agents/$agentID - $responseStatusCode
        username: $username
        responseBodyMessage: $responseBodyMessage`, async ({ username, agentID, responseStatusCode, responseBodyMessage }) => {
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
          to: ''
        },
        tables: [],
        section: 'overview',
        indexPatternTitle: 'wazuh-alerts-*',
        apiId: 'default'
      })
      .expect(responseStatusCode);
    if (responseBodyMessage) {
      expect(response.body.message).toMatch(responseBodyMessage);
    };
  });
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
    `(`$testTitle: GET /reports/agents/$agentID/inventory - $responseStatusCode
        username: $username
        responseBodyMessage: $responseBodyMessage`, async ({ username, agentID, responseStatusCode, responseBodyMessage }) => {
    const response = await supertest(innerServer.listener)
      .post(`/reports/agents/${agentID}/inventory`)
      .set('x-test-username', username)
      .send({
        browserTimezone: '',
        components: { '1': true },
        section: '',
        apiId: 'default'
      })
      .expect(responseStatusCode);
    if (responseBodyMessage) {
      expect(response.body.message).toMatch(responseBodyMessage);
    };
  });
});

describe('[endpoint][security] DELETE /reports/{name} - Parameters validation', () => {
  it.each`
        testTitle               | username       | filename                                                | responseStatusCode | responseBodyMessage
        ${'Delete report file'} | ${'admin'}     | ${'wazuh-module-overview-general-1234.pdf'}             | ${200}             | ${null}
        ${'Invalid parameters'} | ${'admin'}     | ${'..%2fwazuh-module-overview-general-1234.pdf'}        | ${400}             | ${'[request params.name]: must be A-z, 0-9, _, ., and - are allowed. It must end with .pdf.'}
        ${'Invalid parameters'} | ${'admin'}     | ${'custom..%2fwazuh-module-overview-general-1234.pdf'}  | ${400}             | ${'[request params.name]: must be A-z, 0-9, _, ., and - are allowed. It must end with .pdf.'}
        ${'Route not found'}    | ${'admin'}     | ${'../wazuh-module-overview-general-1234.pdf'}          | ${404}             | ${/Not Found/}
        ${'Delete report file'} | ${'../../etc'} | ${'wazuh-module-overview-general-1234.pdf'}             | ${200}             | ${null}   
        ${'Invalid parameters'} | ${'../../etc'} | ${'..%2fwazuh-module-overview-general-1234.pdf'}        | ${400}             | ${'[request params.name]: must be A-z, 0-9, _, ., and - are allowed. It must end with .pdf.'}
        ${'Invalid parameters'} | ${'../../etc'} | ${'custom..%2fwazuh-module-overview-general-1234.pdf'}  | ${400}             | ${'[request params.name]: must be A-z, 0-9, _, ., and - are allowed. It must end with .pdf.'}
        ${'Route not found'}    | ${'../../etc'} | ${'../wazuh-module-overview-general-1234.pdf'}          | ${404}             | ${/Not Found/}
    `(`$testTitle: DELETE /reports/$filename - $responseStatusCode
        username: $username
        responseBodyMessage: $responseBodyMessage`, async ({ username, filename, responseStatusCode, responseBodyMessage }) => {
    const response = await supertest(innerServer.listener)
      .delete(`/reports/${filename}`)
      .set('x-test-username', username)
      .expect(responseStatusCode);
    if (responseBodyMessage) {
      expect(response.body.message).toMatch(responseBodyMessage);
    };
  });
});