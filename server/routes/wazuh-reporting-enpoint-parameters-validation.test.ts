import { Router } from '../../../../src/core/server/http/router/router';
import { HttpServer } from '../../../../src/core/server/http/http_server';
import { loggingSystemMock } from '../../../../src/core/server/logging/logging_system.mock';
import { ByteSizeValue } from '@kbn/config-schema';
import supertest from 'supertest';
import { WazuhReportingRoutes } from './wazuh-reporting';
import md5 from 'md5';

jest.mock('pdfmake/src/printer', () => jest.fn(function () { }));
jest.mock('../reporting/vulnerability-request', () => ({
    VulnerabilityRequest: jest.fn(function () { })
}));
jest.mock('../reporting/overview-request', () => ({
    OverviewRequest: jest.fn(function () { })
}));
jest.mock('../reporting/rootcheck-request', () => ({
    RootcheckRequest: jest.fn(function () { })
}));
jest.mock('../reporting/pci-request', () => ({
    PciRequest: jest.fn(function () { })
}));
jest.mock('../reporting/overview-request', () => ({
    OverviewRequest: jest.fn(function () { })
}));
jest.mock('../reporting/gdpr-request', () => ({
    GdprRequest: jest.fn(function () { })
}));
jest.mock('../reporting/tsc-request', () => ({
    TSCRequest: jest.fn(function () { })
}));
jest.mock('../reporting/audit-request', () => ({
    AuditRequest: jest.fn(function () { })
}));
jest.mock('../reporting/syscheck-request', () => ({
    SyscheckRequest: jest.fn(function () { })
}));
jest.mock('../controllers/wazuh-api', () => ({
    WazuhApiCtrl: jest.fn(function () { })
}));

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
    WazuhReportingRoutes(server.server);

    // start server
    await server.start();
});

afterAll(async () => {
    // Stop server
    await server.stop();
});

describe('[security] GET /reports/{name}', () => {
    it.each`
          titleTest                   | name                                                    | responseStatusCode | responseBodyMessage
          ${'Route not found'}        |${'../wazuh-modules-overview-general-1234.pdf'}          | ${404}             | ${/Not Found/}
          ${'Invalid name parameter'} | ${'..%2fwazuh-modules-overview-general-1234.pdf'}       | ${400}             | ${'fails to match the required pattern'}
          ${'Invalid name parameter'} | ${'custom..%2fwazuh-modules-overview-general-1234.pdf'} | ${400}             | ${'fails to match the required pattern'}
        `(`$titleTest -GET /reports/$name - $responseStatusCode
        message: $responseBodyMessage`, async ({ name, responseStatusCode, responseBodyMessage }) => {
        const response = await supertest(innerServer.listener)
            .get(`/reports/${name}`)
            .expect(responseStatusCode);
        if(responseBodyMessage && response.body?.message){
            expect(response.body.message).toMatch(responseBodyMessage)
        };
    });
});

describe('[security] DELETE /reports/{name}', () => {
    it.each`
          titleTest                   | name                                                    | responseStatusCode | responseBodyMessage
          ${'Route not found'}        | ${'../wazuh-modules-overview-general-1234.pdf'}         | ${404}             | ${/Not Found/}
          ${'Invalid name parameter'} | ${'..%2fwazuh-modules-overview-general-1234.pdf'}       | ${400}             | ${'fails to match the required pattern'}
          ${'Invalid name parameter'} | ${'custom..%2fwazuh-modules-overview-general-1234.pdf'} | ${400}             | ${'fails to match the required pattern'}
        `(`$titleTest - DELETE /reports/$name - $responseStatusCode
        message: $responseBodyMessage`, async ({ name, responseStatusCode, responseBodyMessage }) => {
        const response = await supertest(innerServer.listener)
            .delete(`/reports/${name}`)
            .expect(responseStatusCode);
        if(responseBodyMessage && response.body?.message){
            expect(response.body.message).toMatch(responseBodyMessage)
        };
    });
});

describe('[security] POST /reports', () => {
    it.each`
          titleTest                                | tab             | isAgents    | responseStatusCode | responseBodyMessage
          ${'Module - Invalid tab parameter'}      | ${'../general'} | ${false}    | ${400}             | ${'fails because ["tab" must be one of'}
          ${'Module - Invalid isAgents parameter'} | ${'general'}    | ${'../001'} | ${400}             | ${'fails to match the required pattern'}
        `(`$titleTest - POST /reports - $responseStatusCode
        message: $responseBodyMessage
        tab: $tab
        isAgents: $isAgents`, async ({ tab, isAgents, responseStatusCode, responseBodyMessage }) => {
        const response = await supertest(innerServer.listener)
            .post(`/reports`)
            .send({
                'array': [],
                'filters': [],
                'time': {
                    'from': '',
                    'to': ''
                },
                'searchBar': '',
                'tables': [],
                'tab': tab,
                'section': 'overview',
                'isAgents': isAgents,
                'browserTimezone': ''
            })
            .expect(responseStatusCode);
        if(responseBodyMessage && response.body?.message){
            expect(response.body.message).toMatch(responseBodyMessage)
        };
    });

    it.each`
          titleTest                               | groupID           | responseStatusCode | responseBodyMessage
          ${'Group - Invalid groupID parameter'}  | ${'../general'}   | ${400}             | ${'fails because ["groupID" with value'}
          ${'Group - Invalid groupID parameter'}  | ${'..%2fgeneral'} | ${400}             | ${'fails because ["groupID" with value'}
        `(`$titleTest - POST /reports - $responseStatusCode
        message: $responseBodyMessage
        groupID: $groupID`, async ({ groupID, responseStatusCode, responseBodyMessage }) => {
        const response = await supertest(innerServer.listener)
            .post(`/reports`)
            .send({
                'array': [],
                'time': '',
                'searchBar': '',
                'tables': [],
                'tab': 'groupConfig',
                'browserTimezone': '',
                'components': {
                    '0': true,
                    '1': true
                },
                'groupID': groupID
            })
            .expect(responseStatusCode);
        if(responseBodyMessage && response.body?.message){
            expect(response.body.message).toMatch(responseBodyMessage)
        };
    });

    it.each`
          titleTest                                             | agentID       | responseStatusCode | responseBodyMessage
          ${'Agent configuration - Invalid agentID parameter'}  | ${'../001'}   | ${400}             | ${'fails because ["agentID" with value'}
          ${'Agent configuration - Invalid agentID parameter'}  | ${'..%2f001'} | ${400}             | ${'fails because ["agentID" with value'}
        `(`$titleTest - POST /reports - $responseStatusCode
        message: $responseBodyMessage
        agentID: $agentID`, async ({ agentID, responseStatusCode, responseBodyMessage }) => {
        const response = await supertest(innerServer.listener)
            .post(`/reports`)
            .send({
                'array': [],
                'time': '',
                'searchBar': '',
                'tables': [],
                'tab': 'agentConfig',
                'browserTimezone': 'Europe/Madrid',
                'components': {
                    '0': true,
                    '1': true,
                    '2': true,
                    '3': true,
                    '4': true,
                    '6': true,
                    '7': true,
                    '8': true,
                    '9': true,
                    '10': true,
                    '12': true,
                    '13': true
                },
                'agentID': agentID
            })
            .expect(responseStatusCode);
        if(responseBodyMessage && response.body?.message){
            expect(response.body.message).toMatch(responseBodyMessage)
        };
    });

    it.each`
          titleTest                                         | isAgents       | responseStatusCode | responseBodyMessage
          ${'Agent inventory - Invalid isAgents parameter'} | ${'../001'}    | ${400}             | ${'"isAgents" with value "../001" fails to match the required pattern: /^\\d{3,}$/]'}
          ${'Agent inventory - Invalid isAgents parameter'} | ${'..%2f001'}  | ${400}             | ${'"isAgents" with value "..%2f001" fails to match the required pattern: /^\\d{3,}$/]'}
        `(`$titleTest - POST /reports - $responseStatusCode
        message: $responseBodyMessage
        isAgents: $isAgents`, async ({ isAgents, responseStatusCode, responseBodyMessage }) => {
        const response = await supertest(innerServer.listener)
            .post(`/reports`)
            .send({
                'array': [],
                'filters': [],
                'time': {},
                'searchBar': false,
                'tables': [],
                'tab': 'syscollector',
                'section': 'agents',
                'isAgents': isAgents,
                'browserTimezone': ''
            })
            .expect(responseStatusCode);
        if(responseBodyMessage && response.body?.message){
            expect(response.body.message).toMatch(responseBodyMessage)
        };
    });
    
});

