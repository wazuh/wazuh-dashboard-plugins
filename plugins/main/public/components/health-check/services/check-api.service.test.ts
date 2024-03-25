import * as service from './check-api.service';
import { CheckLogger } from '../types/check_logger';
import { ApiCheck, AppState } from '../../../react-services';
import axios, { AxiosResponse } from 'axios';

jest.mock('axios');
// app state
jest.mock('../../../react-services/app-state');
jest.mock('../../../kibana-services', () => ({
  ...(jest.requireActual('../../../kibana-services') as object),
  getHttp: jest.fn().mockReturnValue({
    basePath: {
      get: () => {
        return 'http://localhost:5601';
      },
      prepend: url => {
        return `http://localhost:5601${url}`;
      },
    },
  }),
  getCookies: jest.fn().mockReturnValue({
    set: (name, value, options) => {
      return true;
    },
    get: () => {
      return '{}';
    },
    remove: () => {
      return;
    },
  }),
}));

const hostData = {
  id: 'api',
  url: 'url-mocked',
  port: 9000,
  username: 'username',
  password: 'password',
  run_as: false,
};
const getApiHostsResponse: AxiosResponse = {
  data: [hostData],
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {},
  request: {},
};

const checkStoredErrorResponse: AxiosResponse = {
  data: {
    statusCode: 500,
    error: 'Internal Server Error',
    message: '3099 - ERROR3099 - Server not ready yet',
  },
  status: 500,
  statusText: 'Internal Server Error',
  headers: {},
  config: {},
  request: {},
};

// checkLogger mocked
const checkLoggerMocked: CheckLogger = {
  info: jest.fn(),
  error: jest.fn(),
  action: jest.fn(),
};

describe.skip('CheckApi Service', () => {
  it('Should show logs info when api check pass successfully and have cluster_info ', async () => {
    const currentApi = { id: 'api-mocked' };
    AppState.getCurrentAPI = jest
      .fn()
      .mockReturnValue(JSON.stringify(currentApi));
    AppState.setClusterInfo = jest.fn();
    const checkStoredResponse = {
      data: {
        data: {
          url: 'url-mocked',
          port: 9000,
          username: 'username',
          password: 'password',
          run_as: false,
          cluster_info: {
            status: 'enabled',
            node: 'master',
            manager: 'manager-mocked',
            cluster: 'cluster-mocked',
          },
        },
      },
    };
    ApiCheck.checkStored = jest
      .fn()
      .mockResolvedValue(Promise.resolve(checkStoredResponse));
    await service.checkApiService({})(checkLoggerMocked);
    expect(checkLoggerMocked.info).toBeCalledWith(
      `Current API id [${currentApi.id}]`,
    );
    expect(checkLoggerMocked.info).toBeCalledWith(
      `Checking current API id [${currentApi.id}]...`,
    );
    expect(checkLoggerMocked.info).toBeCalledWith(`Set cluster info in cookie`);
    expect(checkLoggerMocked.info).toBeCalledTimes(3);
  });

  it('Should return ERROR and show logs info when api check fails on checkApi', async () => {
    const currentApi = { id: 'api-mocked' };
    AppState.getCurrentAPI = jest
      .fn()
      .mockReturnValue(JSON.stringify(currentApi));
    AppState.setClusterInfo = jest.fn();
    ApiCheck.checkStored = jest
      .fn()
      .mockResolvedValue(Promise.reject(checkStoredErrorResponse));
    (axios as jest.MockedFunction<typeof axios>).mockResolvedValue(
      Promise.resolve(getApiHostsResponse),
    );

    ApiCheck.checkApi = jest
      .fn()
      .mockResolvedValue(Promise.reject(checkStoredErrorResponse));

    try {
      await service.checkApiService({})(checkLoggerMocked);
    } catch (error) {
      expect(error).toBeDefined();
      expect(typeof error).not.toBe('string');
      expect(error.message).toContain('No API available to connect');
      expect(error).toBeInstanceOf(Error);
    }
  });
});
