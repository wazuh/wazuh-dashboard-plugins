import md5 from 'md5';
import fs from 'fs';
import { WazuhReportingCtrl } from './wazuh-reporting';

jest.mock('../lib/logger', () => ({
  log: jest.fn()
}));

jest.mock('../lib/reporting/extended-information', () => ({
  extendedInformation: () => {},
  buildAgentsTable: () => {}
}));

jest.mock('../lib/reporting/printer', () => {
  class ReportPrinterMock {
    constructor() { }
    addContent() { }
    addConfigTables() { }
    addTables() { }
    addTimeRangeAndFilters() { }
    addVisualizations() { }
    formatDate() { }
    checkTitle() { }
    addSimpleTable() { }
    addList() { }
    addNewLine() { }
    addContentWithNewLine() { }
    addAgentsFilters() { }
    print() { }
  }
  return {
    ReportPrinter: ReportPrinterMock
  }
});

const getMockerUserContext = (username: string) => ({ username, hashUsername: md5(username) });

const mockContext = (username: string) => ({
  wazuh: {
    security: {
      getCurrentUser: () => getMockerUserContext(username)
    }
  }
});

const mockResponse = () => ({
  ok: (body) => body,
  custom: (body) => body,
  badRequest: (body) => body
});

const endpointController = new WazuhReportingCtrl();

console.warn(`
Theses tests don't have in account the validation of endpoint parameters.
The endpoints related to an specific file.
This validation could prevent the endpoint handler is executed, so these tests
don't cover the reality.
`);

describe('[security] Report endpoints guard related to a file. Parameter defines or builds the filename.', () => {
  let routeHandler = null;
  const routeHandlerResponse = 'Endpoint handler executed.';

  beforeEach(() => {
    routeHandler = jest.fn(() => routeHandlerResponse);
  });

  afterEach(() => {
    routeHandler = null;
  });

  it.each`
		testTitle                     | username       | filename                                             | endpointProtected
		${'Execute endpoint handler'} | ${'admin'}     | ${'wazuh-module-overview-general-1234.pdf'}          | ${false}
		${'Endpoint protected'}       | ${'admin'}     | ${'../wazuh-module-overview-general-1234.pdf'}       | ${true}
		${'Endpoint protected'}       | ${'admin'}     | ${'wazuh-module-overview-../general-1234.pdf'}       | ${true}
		${'Endpoint protected'}       | ${'admin'}     | ${'custom../wazuh-module-overview-general-1234.pdf'} | ${true}
		${'Execute endpoint handler'} | ${'../../etc'} | ${'wazuh-module-agents-001-general-1234.pdf'}        | ${false}
		${'Endpoint protected'}       | ${'../../etc'} | ${'../wazuh-module-agents-001-general-1234.pdf'}     | ${true}
		${'Endpoint protected'}       | ${'../../etc'} | ${'wazuh-module-overview-../general-1234.pdf'}       | ${true}
		${'Endpoint protected'}       | ${'../../etc'} | ${'custom../wazuh-module-overview-general-1234.pdf'} | ${true}
	`(`$testTitle
	username: $username
	filename: $filename
	endpointProtected: $endpointProtected`, async ({ username, filename, endpointProtected }) => {
    const response = await endpointController.checkReportsUserDirectoryIsValidRouteDecorator(
      routeHandler,
      function getFilename(request) {
        return request.params.name
      }
    )(mockContext(username), { params: { name: filename } }, mockResponse());
    if (endpointProtected) {

      expect(response.body.message).toBe('5040 - You shall not pass!');
      expect(routeHandler.mock.calls).toHaveLength(0);
    } else {
      expect(routeHandler.mock.calls).toHaveLength(1);
      expect(response).toBe(routeHandlerResponse);
    }
  });

});

describe('[security] GET /reports', () => {

  it.each`
		username
		${'admin'}
		${'../../etc'}
	`(`Get user reports: GET /reports
	username: $username`, async ({ username }) => {
    jest.spyOn(fs, 'readdirSync').mockImplementation(() => []);

    const response = await endpointController.getReports(mockContext(username), {}, mockResponse());
    expect(response.body.reports).toHaveLength(0);
  });
});

describe('[security] GET /reports/{name}', () => {

  it.each`
		titleTest               | username       | filename                               | valid
		${'Get report'}         | ${'admin'}     | ${'wazuh-module-overview-1234.pdf'}    | ${true}
		${'Endpoint protected'} | ${'admin'}     | ${'../wazuh-module-overview-1234.pdf'} | ${false}
		${'Get report'}         | ${'../../etc'} | ${'wazuh-module-overview-1234.pdf'}    | ${true}
		${'Endpoint protected'} | ${'../../etc'} | ${'../wazuh-module-overview-1234.pdf'} | ${false}
	`(`$titleTest: GET /reports/$filename
	username: $username
	valid: $valid`, async ({ username, filename, valid }) => {
    const fileContent = 'content file';
    jest.spyOn(fs, 'readFileSync').mockImplementation(() => fileContent);

    const response = await endpointController.getReportByName(mockContext(username), { params: { name: filename } }, mockResponse());
    if (valid) {
      expect(response.headers['Content-Type']).toBe('application/pdf');
      expect(response.body).toBe('content file');
    } else {
      expect(response.body.message).toBe('5040 - You shall not pass!');
    }
  });
});

describe('[security] POST /reports', () => {
  jest.mock('../lib/filesystem', () => ({
    createDataDirectoryIfNotExists: jest.fn()
  }));

  it.each`
		titleTest               | username         | moduleID          | valid
		${'Create report'}         | ${'admin'}       | ${'general'}      | ${true}
		${'Endpoint protected'} | ${'admin'}       | ${'../general'}   | ${false}
		${'Create report'}         | ${'../../etc'}   | ${'general'}      | ${true}
		${'Endpoint protected'} | ${'../../etc'}   | ${'../general'}   | ${false}
	`(`$titleTest: POST /reports/modules/$moduleID
	username: $username
	valid: $valid`, async ({ username, moduleID, valid }) => {
    jest.spyOn(endpointController, 'renderHeader').mockImplementation(() => true);
    jest.spyOn(endpointController, 'sanitizeKibanaFilters').mockImplementation(() => [false, false]);

    const mockRequest = {
      body: {
        array: [],
        agents: false,
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
        apiId: 'default',
        tab: moduleID
      },
      params: {
        moduleID: moduleID
      }
    };

    const response = await endpointController.createReportsModules(mockContext(username), mockRequest, mockResponse());

    if (valid) {
      expect(response.body.success).toBe(true);
      expect(response.body.message).toMatch(new RegExp(`Report wazuh-module-overview-${moduleID}`));
    } else {
      expect(response.body.message).toBe('5040 - You shall not pass!');
    };
  });
});

describe('[security] DELETE /reports/<filename>', () => {
  let mockFsUnlinkSync;

  afterEach(() => {
    mockFsUnlinkSync.mockClear();
  });

  it.each`
		titleTest               | username        | filename                                    | valid
		${'Delete report'}      | ${'admin'}      | ${'wazuh-module-overview-1234.pdf'}         | ${true}
		${'Endpoint protected'} | ${'admin'}      | ${'../wazuh-module-overview-1234.pdf'}      | ${false}
		${'Endpoint protected'} | ${'admin'}      | ${'custom../wazuh-module-overview-1234.pdf'}| ${false}
		${'Delete report'}      | ${'../../etc'}  | ${'wazuh-module-overview-1234.pdf'}         | ${true}
		${'Endpoint protected'} | ${'../../etc'}  | ${'../wazuh-module-overview-1234.pdf'}      | ${false}
		${'Endpoint protected'} | ${'../../etc'}  | ${'custom../wazuh-module-overview-1234.pdf'}| ${false}
	`(`[security] DELETE /reports/$filename
	username: $username
	valid: $valid`, async ({ filename, username, valid }) => {
    mockFsUnlinkSync = jest.spyOn(fs, 'unlinkSync').mockImplementation(() => { });

    const response = await endpointController.deleteReportByName(mockContext(username), { params: { name: filename } }, mockResponse());

    if (valid) {
      expect(response.body.error).toBe(0);
      expect(mockFsUnlinkSync.mock.calls).toHaveLength(1);
    } else {
      expect(response.body.message).toBe('5040 - You shall not pass!');
      expect(mockFsUnlinkSync.mock.calls).toHaveLength(0);
    };
  });
});