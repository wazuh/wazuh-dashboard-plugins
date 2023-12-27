import { ApiCheck, formatUIDate } from '../../react-services';
import { SettingsController } from './settings';
import { ErrorHandler } from '../../react-services/error-management';
import { UI_LOGGER_LEVELS } from '../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../react-services/error-orchestrator/types';

import axios, { AxiosResponse } from 'axios';
jest.mock('../../react-services/time-service');
jest.mock('../../react-services/app-state');
jest.mock('../../react-services/saved-objects');
// axios mocked
jest.mock('axios');
// mocked some required kibana-services
jest.mock('../../kibana-services', () => ({
  ...(jest.requireActual('../../kibana-services') as object),
  getHttp: jest.fn().mockReturnValue({
    basePath: {
      get: () => {
        return 'http://localhost:5601';
      },
      prepend: (url: string) => {
        return `http://localhost:5601${url}`;
      },
    },
  }),
  getCookies: jest.fn().mockReturnValue({
    set: (name: string, value: any, options: object) => {
      return true;
    },
  }),
  getWzCurrentAppID: jest.fn().mockReturnValue('app'),
  formatUIDate: jest.fn(),
}));

// mocked window object
Object.defineProperty(window, 'location', {
  value: {
    hash: {
      endsWith: jest.fn(),
      includes: jest.fn(),
    },
    href: jest.fn(),
    assign: jest.fn(),
    search: jest.fn().mockResolvedValue({
      tab: 'api',
    }),
    path: jest.fn(),
  },
  writable: true,
});
// mocked scope dependency
const $scope = {
  $applyAsync: jest.fn(),
};
// mocked getErrorOrchestrator
const mockedGetErrorOrchestrator = {
  handleError: jest.fn(),
};

jest.mock('../../react-services/common-services', () => {
  return {
    getErrorOrchestrator: () => mockedGetErrorOrchestrator,
  };
});

// mocked getAppInfo response /api/setup
const getAppInfoResponse: AxiosResponse = {
  data: {
    data: {
      name: 'wazuh-api',
      'app-version': 'version-mocked',
      revision: 'mocked-revision',
      installationDate: new Date().toDateString(),
      lastRestart: new Date().toDateString(),
      hosts: {},
    },
  },
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {},
  request: {},
};

describe('Settings Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  describe('$onInit', () => {
    it('Should return ERROR instance on ErrorOrchestrator options when checkApiStatus throw error and fails', async () => {
      const checkApisStatusErrorMocked = ErrorHandler.createError(
        '3099 - ERROR3099 - Wazuh not ready yet',
      );
      const controller = new SettingsController(
        $scope,
        window,
        window.location,
        ErrorHandler,
      );
      const expectedErrorOrchestratorOptions = {
        context: `${SettingsController.name}.$onInit`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        error: {
          error: checkApisStatusErrorMocked,
          message:
            checkApisStatusErrorMocked.message || checkApisStatusErrorMocked,
          title: `${checkApisStatusErrorMocked.name}: Cannot initialize Settings`,
        },
      };
      controller.getSettings = jest.fn().mockResolvedValue([]);
      controller.checkApisStatus = jest
        .fn()
        .mockResolvedValue(Promise.reject(checkApisStatusErrorMocked));
      await controller.$onInit();
      expect(mockedGetErrorOrchestrator.handleError).toBeCalledTimes(1);
      expect(mockedGetErrorOrchestrator.handleError).toBeCalledWith(
        expectedErrorOrchestratorOptions,
      );
    });

    it('Should return ERROR instance on ErrorOrchestrator options when apiIsDown = true because checkManager fails', async () => {
      const checkApiErrorMocked = ErrorHandler.createError(
        '3099 - ERROR3099 - Wazuh not ready yet',
      );
      const expectedErrorOrchestratorOptions = {
        context: `${SettingsController.name}.getAppInfo`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: checkApiErrorMocked,
          message: checkApiErrorMocked.message || checkApiErrorMocked,
          title: `${checkApiErrorMocked.name}`,
        },
      };
      // checkApi must return error - Wazuh not ready yet
      ApiCheck.checkApi = jest
        .fn()
        .mockResolvedValue(Promise.reject(checkApiErrorMocked));
      // mock getAppInfo
      (axios as jest.MockedFunction<typeof axios>).mockResolvedValueOnce(
        Promise.resolve(getAppInfoResponse),
      );
      // mock formatUIDate
      (formatUIDate as jest.MockedFunction<typeof Date>).mockReturnValue(
        'mocked-date',
      );
      const controller = new SettingsController(
        $scope,
        window,
        window.location,
        ErrorHandler,
      );
      controller.getSettings = jest.fn().mockResolvedValue([]);
      // mocking manager hosts - apiEntries from wazuh.yml

      controller.apiEntries = [
        {
          manager: {
            url: 'https://wazuh.manager',
            port: 55000,
            username: 'wazuh-wui',
            password: 'mypassword1-',
            run_as: false,
          },
        },
      ];
      await controller.$onInit();
      expect(mockedGetErrorOrchestrator.handleError).toBeCalledTimes(1);
      expect(mockedGetErrorOrchestrator.handleError).toBeCalledWith(
        expectedErrorOrchestratorOptions,
      );
    });
  });
});
