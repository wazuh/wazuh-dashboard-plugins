import { WzRequest } from './wz-request';
import { AppState } from './app-state';
import { ApiCheck } from './wz-api-check';
import axios, { AxiosResponse } from 'axios';
jest.mock('axios');

jest.mock('../kibana-services', () => ({
  ...(jest.requireActual('../kibana-services') as object),
  getHttp: jest.fn().mockReturnValue({
    basePath: {
      get: () => {
        return 'http://localhost:5601';
      },
      prepend: (url) => {
        return `http://localhost:5601${url}`;
      },
    },
  }),
  getCookies: jest.fn().mockReturnValue({
    set: (name, value, options) => {
      return true;
    },
  }),
}));

// app state
jest.mock('./app-state');
// wz-api-check
jest.mock('./wz-api-check');

// mock window location
const mockResponse = jest.fn();
Object.defineProperty(window, 'location', {
  value: {
    hash: {
      endsWith: mockResponse,
      includes: mockResponse,
    },
    href: mockResponse,
    assign: mockResponse,
  },
  writable: true,
});

describe('WzRequest', () => {
  const response: AxiosResponse = {
    data: {
      statusCode: 500,
      error: 'Internal Server Error',
      message: '3099 - ERROR3099 - Wazuh not ready yet',
    },
    status: 500,
    statusText: 'Internal Server Error',
    headers: {},
    config: {},
    request: {},
  };

  describe('genericReq', () => {
    it.skip('Should return an ERROR when request fails and have currentApi and checkStored fails', async () => {
      try {
        (axios as jest.MockedFunction<typeof axios>).mockResolvedValue(
          Promise.reject({
            response,
          })
        );
        const currentApiMock = JSON.stringify({ id: 'mocked-api-id' });
        AppState.getCurrentAPI = jest.fn().mockReturnValue(currentApiMock);
        ApiCheck.checkStored = jest
          .fn()
          .mockResolvedValue(Promise.reject(new Error('Error checkStored')));
        await WzRequest.genericReq('GET', '/api/request', {});
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Error checkStored');
      }
    });

    it.skip('Should return an ERROR when request fails and have currentApi and checkStored response succesfully', async () => {
      try {
        (axios as jest.MockedFunction<typeof axios>).mockResolvedValue(
          Promise.reject({
            response,
          })
        );
        const currentApiMock = JSON.stringify({ id: 'mocked-api-id' });
        AppState.getCurrentAPI = jest.fn().mockReturnValue(currentApiMock);
        ApiCheck.checkStored = jest
          .fn()
          .mockResolvedValue(Promise.resolve({ data: 'fake-checkStored-result' }));
        await WzRequest.genericReq('GET', '/api/request', {});
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe(response.data.message);
      }
    });

    it.skip('Should return an ERROR when request fails and dont have currentApi', async () => {
      try {
        (axios as jest.MockedFunction<typeof axios>).mockResolvedValue(
          Promise.reject({
            response,
          })
        );
        AppState.getCurrentAPI = jest.fn().mockReturnValue(JSON.stringify({}));
        await WzRequest.genericReq('GET', '/api/request', {});
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe(response.data.message);
      }
    });
  });
});
