import axios from 'axios';
import { WzRequest } from './wz-request';
import { AppState } from './app-state';
import { ApiCheck } from './wz-api-check';

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

      expect(ApiCheck.checkStored).toHaveBeenCalledWith('mocked-api-id');
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
  });
});
