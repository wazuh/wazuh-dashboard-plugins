import { settingsWizard } from './settings-wizard';
import { AppState } from '../../react-services/app-state';
import { GenericRequest } from '../../react-services';
import { ErrorHandler } from '../../react-services/error-handler';

jest.mock('../../react-services/app-state');
jest.mock('../../react-services', () => ({
  GenericRequest: { request: jest.fn() },
}));
jest.mock('../../react-services/error-handler', () => ({
  ErrorHandler: { handle: jest.fn() },
}));
jest.mock('../../react-services/wz-api-check', () => ({ ApiCheck: {} }));
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
});
