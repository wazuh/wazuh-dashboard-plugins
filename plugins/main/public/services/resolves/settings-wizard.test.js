import { settingsWizard } from './settings-wizard';
import { AppState } from '../../react-services/app-state';
import { GenericRequest } from '../../react-services';
import { ErrorHandler } from '../../react-services/error-handler';
import { ApiCheck } from '../../react-services/wz-api-check';

jest.mock('../../react-services/app-state');
jest.mock('../../react-services', () => ({
  GenericRequest: { request: jest.fn() },
}));
jest.mock('../../react-services/error-handler', () => ({
  ErrorHandler: { handle: jest.fn() },
}));
jest.mock('../../react-services/wz-api-check', () => ({
  ApiCheck: { checkStored: jest.fn() },
}));
jest.mock('./health-check', () => ({ healthCheck: () => false }));
jest.mock('../../kibana-services', () => ({
  getWzCurrentAppID: () => 'file-integrity-monitoring',
}));
jest.mock('../../utils/applications', () => ({
  serverApis: { id: 'server-apis' },
}));

const mockNavigateToApp = jest.fn();
jest.mock('../../react-services/navigation-service', () => ({
  getInstance: () => ({
    getSearch: () => '',
    getPathname: () => '/overview',
    navigate: jest.fn(),
    navigateToApp: mockNavigateToApp,
  }),
}));

const mockIsLoggingOut = jest.fn();
jest.mock('../request-handler', () => ({
  isLoggingOut: () => mockIsLoggingOut(),
}));

const wzMisc = { getWizard: () => false, setWizard: jest.fn() };

describe('settingsWizard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    GenericRequest.request.mockRejectedValue(new Error('Disable request'));
  });

  describe.each([
    ['no API is selected', null],
    ['an API is selected', JSON.stringify({ id: 'default' })],
  ])('When listing the API hosts fails and %s', (_, currentApi) => {
    beforeEach(() => {
      AppState.getCurrentAPI.mockReturnValue(currentApi);
    });

    it('opens the API settings with an error', async () => {
      mockIsLoggingOut.mockReturnValue(false);

      await settingsWizard(null, wzMisc);

      expect(ErrorHandler.handle).toHaveBeenCalled();
      expect(mockNavigateToApp).toHaveBeenCalledWith('server-apis');
    });

    it('does nothing while logging out', async () => {
      mockIsLoggingOut.mockReturnValue(true);

      await settingsWizard(null, wzMisc);

      expect(ErrorHandler.handle).not.toHaveBeenCalled();
      expect(mockNavigateToApp).not.toHaveBeenCalled();
    });
  });

  describe('When the selected API is listed', () => {
    const clusterInfo = { status: 'disabled', manager: 'wazuh.manager' };
    const selectApi = id => {
      AppState.getCurrentAPI.mockReturnValue(JSON.stringify({ id }));
      GenericRequest.request.mockResolvedValue({ data: [{ id }] });
    };

    beforeEach(() => {
      ApiCheck.checkStored.mockResolvedValue({
        data: { data: { cluster_info: clusterInfo } },
      });
    });

    it('stores the cluster info when it is missing', async () => {
      selectApi('missing');
      AppState.getClusterInfo.mockReturnValue({});

      await settingsWizard(null, wzMisc);

      expect(ApiCheck.checkStored).toHaveBeenCalledWith('missing');
      expect(AppState.setClusterInfo).toHaveBeenCalledWith(clusterInfo);
    });

    it('keeps the stored cluster info', async () => {
      selectApi('stored');
      AppState.getClusterInfo.mockReturnValue(clusterInfo);

      await settingsWizard(null, wzMisc);

      expect(ApiCheck.checkStored).not.toHaveBeenCalled();
      expect(AppState.setClusterInfo).not.toHaveBeenCalled();
    });

    it('requests the cluster info once for every view', async () => {
      selectApi('shared');
      AppState.getClusterInfo.mockReturnValue({});

      await settingsWizard(null, wzMisc);
      await settingsWizard(null, wzMisc);

      expect(ApiCheck.checkStored).toHaveBeenCalledTimes(1);
    });

    it('stops waiting for a slow API after 3 seconds', async () => {
      jest.useFakeTimers();
      selectApi('slow');
      AppState.getClusterInfo.mockReturnValue({});
      ApiCheck.checkStored.mockReturnValue(new Promise(() => {}));
      const onResolved = jest.fn();

      settingsWizard(null, wzMisc).then(onResolved);
      for (let i = 0; i < 10; i++) await Promise.resolve();
      jest.advanceTimersByTime(2999);
      for (let i = 0; i < 10; i++) await Promise.resolve();
      expect(onResolved).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);
      for (let i = 0; i < 10; i++) await Promise.resolve();
      expect(onResolved).toHaveBeenCalled();
      expect(AppState.setClusterInfo).not.toHaveBeenCalled();
      jest.useRealTimers();
    });
  });
});
