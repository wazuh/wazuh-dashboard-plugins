import axios, { AxiosError, AxiosResponse } from 'axios';
import { SavedObject } from './saved-objects';
import { AppState } from './app-state';
import { ErrorHandler } from './error-management';

jest.mock('./app-state');

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

describe('SavedObjects', () => {
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

  describe('existsIndexPattern', () => {
    it('Should return ERROR when get request if exist index pattern fails', async () => {
      try {
        const mockingError = new Error('Error on genericReq') as AxiosError;
        mockingError.response = response;
        (axios as jest.MockedFunction<typeof axios>).mockResolvedValue(
          Promise.reject(ErrorHandler.createError(mockingError)),
        );
        const currentApiMock = JSON.stringify({ id: 'mocked-api-id' });
        AppState.getCurrentAPI = jest.fn().mockReturnValue(currentApiMock);
        await SavedObject.existsIndexPattern('fake-index-pattern');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(typeof error).not.toBe('string');
        if (error instanceof Error) {
          expect(error.message).toBe(response.data.message);
        }
      }
    });
  });
});
