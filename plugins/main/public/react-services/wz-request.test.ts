import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { WzRequest } from './wz-request';
import { AppState } from './app-state';
import { ApiCheck } from './wz-api-check';
import { WzAuthentication } from './wz-authentication';

jest.mock('axios');
const mockToastAdd = jest.fn();
jest.mock('../kibana-services', () => ({
  ...(jest.requireActual('../kibana-services') as object),
  getHttp: jest.fn().mockReturnValue({
    basePath: { prepend: (url: string) => `http://localhost:5601${url}` },
  }),
  getWazuhCorePlugin: () => ({
    configuration: { get: jest.fn().mockResolvedValue(20000) },
  }),
  getToasts: () => ({ add: mockToastAdd }),
}));
jest.mock('./app-state');
jest.mock('./wz-authentication', () => ({ WzAuthentication: {} }));

const mockNavigate = jest.fn();
jest.mock('./navigation-service', () => ({
  getInstance: () => ({
    getPathname: () => '/overview',
    navigate: mockNavigate,
  }),
}));

const mockIsLoggingOut = jest.fn().mockReturnValue(false);
jest.mock('../services/request-handler', () => ({
  ...(jest.requireActual('../services/request-handler') as object),
  isLoggingOut: () => mockIsLoggingOut(),
}));

describe('WzRequest.genericReq', () => {
  describe('When the request fails and the API check fails', () => {
    beforeEach(() => {
      (axios as jest.MockedFunction<typeof axios>).mockRejectedValue(
        new Error('Error message'),
      );
      AppState.getCurrentAPI = jest
        .fn()
        .mockReturnValue(JSON.stringify({ id: 'mocked-api-id' }));
      jest.spyOn(ApiCheck, 'checkStored').mockRejectedValue(new Error('down'));
      mockNavigate.mockClear();
      mockToastAdd.mockClear();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('Should notify that the API is not available', async () => {
      mockIsLoggingOut.mockReturnValue(false);

      await expect(WzRequest.genericReq('GET', '/hosts/apis')).rejects.toThrow(
        'down',
      );

      expect(ApiCheck.checkStored).toHaveBeenCalledWith(
        'mocked-api-id',
        false,
        {
          asSystemRequest: false,
        },
      );
      expect(mockToastAdd).toHaveBeenCalledTimes(1);
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('Should not check the API nor notify while logging out', async () => {
      mockIsLoggingOut.mockReturnValue(true);

      await expect(WzRequest.genericReq('GET', '/hosts/apis')).rejects.toThrow(
        'Error message',
      );

      expect(ApiCheck.checkStored).not.toHaveBeenCalled();
      expect(mockToastAdd).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('Should not redirect when the API check times out', async () => {
      mockIsLoggingOut.mockReturnValue(false);
      jest.spyOn(ApiCheck, 'checkStored').mockRejectedValue(
        Object.assign(new Error('timeout of 20000ms exceeded'), {
          code: 'ECONNABORTED',
        }),
      );

      await expect(WzRequest.genericReq('GET', '/hosts/apis')).rejects.toThrow(
        'Error message',
      );

      expect(ApiCheck.checkStored).toHaveBeenCalledWith(
        'mocked-api-id',
        false,
        {
          asSystemRequest: false,
        },
      );
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('When the request is sent by a timer (asSystemRequest)', () => {
    const mockedAxios = axios as jest.MockedFunction<typeof axios>;
    const okResponse = { data: {} } as AxiosResponse;
    const sentHeaders = (call: number) =>
      (mockedAxios.mock.calls[call][0] as unknown as AxiosRequestConfig)
        .headers;

    beforeEach(() => {
      mockedAxios.mockReset();
      AppState.getCurrentAPI = jest
        .fn()
        .mockReturnValue(JSON.stringify({ id: 'mocked-api-id' }));
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('Should not flag a regular request as a system request', async () => {
      mockedAxios.mockResolvedValue(okResponse);

      await WzRequest.genericReq('GET', '/hosts/apis');

      expect(sentHeaders(0)).not.toHaveProperty('osd-system-request');
    });

    it('Should flag the request so it does not extend the session', async () => {
      mockedAxios.mockResolvedValue(okResponse);

      await WzRequest.genericReq('GET', '/hosts/apis', null, {
        asSystemRequest: true,
      });

      expect(sentHeaders(0)).toMatchObject({
        'osd-system-request': 'true',
      });
    });

    it('Should forward the flag from apiReq', async () => {
      mockedAxios.mockResolvedValue({ data: { data: {} } } as AxiosResponse);

      await WzRequest.apiReq(
        'GET',
        '/cluster/node01/logs',
        {},
        { asSystemRequest: true },
      );

      expect(sentHeaders(0)).toMatchObject({
        'osd-system-request': 'true',
      });
    });

    it('Should keep the flag on the API check after a failure', async () => {
      mockIsLoggingOut.mockReturnValue(false);
      mockedAxios.mockRejectedValue(new Error('Error message'));
      jest
        .spyOn(ApiCheck, 'checkStored')
        .mockRejectedValue(
          Object.assign(new Error('timeout'), { code: 'ECONNABORTED' }),
        );

      await expect(
        WzRequest.genericReq('GET', '/hosts/apis', null, {
          asSystemRequest: true,
        }),
      ).rejects.toThrow('Error message');

      expect(ApiCheck.checkStored).toHaveBeenCalledWith(
        'mocked-api-id',
        false,
        {
          asSystemRequest: true,
        },
      );
    });

    it('Should keep the flag on the token refresh and the retry after a 401', async () => {
      const refresh = jest.fn().mockResolvedValue(undefined);
      WzAuthentication.refresh = refresh;
      mockedAxios
        .mockRejectedValueOnce(new Error('Request failed with status code 401'))
        .mockResolvedValue(okResponse);

      await WzRequest.genericReq('GET', '/hosts/apis', null, {
        checkCurrentApiIsUp: false,
        asSystemRequest: true,
      });

      expect(refresh).toHaveBeenCalledWith(true, { asSystemRequest: true });
      expect(mockedAxios).toHaveBeenCalledTimes(2);
      expect(sentHeaders(1)).toMatchObject({
        'osd-system-request': 'true',
      });
    });
  });
});
