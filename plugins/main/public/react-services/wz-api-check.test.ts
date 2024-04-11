import { ApiCheck } from './index';

import axios, { AxiosResponse } from 'axios';
jest.mock('axios');

jest.mock('../kibana-services', () => ({
  ...(jest.requireActual('../kibana-services') as object),
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
}));

describe('Wz Api Check', () => {
  const response: AxiosResponse = {
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

  describe('checkStored', () => {
    it('should return ERROR instance when request fails', async () => {
      try {
        (axios as jest.MockedFunction<typeof axios>).mockResolvedValue(
          Promise.reject({
            response,
          }),
        );
        await ApiCheck.checkStored('api-2');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(typeof error).not.toBe('string');
        if (error instanceof Error)
          expect(error.message).toBe(response.data.message);
      }
    });
  });

  describe('checkApi', () => {
    it('should return ERROR instance when request fails', async () => {
      try {
        (axios as jest.MockedFunction<typeof axios>).mockResolvedValue(
          Promise.reject({
            response,
          }),
        );
        await ApiCheck.checkApi({ id: 'api-id-mocked' });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(typeof error).not.toBe('string');
        if (error instanceof Error)
          expect(error.message).toBe(response.data.message);
      }
    });
  });
});
