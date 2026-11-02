import axios from 'axios';

jest.mock('axios', () => {
  const mockAxios = jest.fn();
  mockAxios.CancelToken = {
    source: () => ({ token: 'token', cancel: jest.fn() }),
  };
  return mockAxios;
});

// Loads a fresh copy of the module, so each test starts with a live session
const loadRequestHandler = () => {
  let requestHandler;
  jest.isolateModules(() => {
    requestHandler = require('./request-handler');
  });
  let interceptors;
  requestHandler.initializeInterceptor({
    http: {
      intercept: value => {
        interceptors = value;
        return () => {};
      },
    },
  });
  return { ...requestHandler, interceptors };
};

const leavePage = () => window.dispatchEvent(new Event('beforeunload'));

describe('request-handler', () => {
  const { location } = window;

  beforeAll(() => {
    delete window.location;
    window.location = { reload: jest.fn() };
  });

  afterAll(() => {
    window.location = location;
  });

  describe('isLoggingOut', () => {
    it('is false while the session is alive', () => {
      const { isLoggingOut } = loadRequestHandler();

      expect(isLoggingOut()).toBe(false);
    });

    it('is false after a 401 while the page stays', () => {
      const { isLoggingOut, interceptors } = loadRequestHandler();

      interceptors.responseError({ response: { status: 401 } });

      expect(isLoggingOut()).toBe(false);
    });

    it('is false when the page leaves with the session alive', () => {
      const { isLoggingOut } = loadRequestHandler();

      leavePage();

      expect(isLoggingOut()).toBe(false);
    });

    it('is true after a 401 from the platform HTTP client once the page leaves', () => {
      const { isLoggingOut, interceptors } = loadRequestHandler();

      interceptors.responseError({ response: { status: 401 } });
      leavePage();

      expect(isLoggingOut()).toBe(true);
    });

    it('is true after an expired session reply to a plugin request reloads the page', async () => {
      const { isLoggingOut, request } = loadRequestHandler();
      window.location.reload.mockImplementation(leavePage);
      axios.mockRejectedValue({
        response: { data: { message: 'Authentication required' } },
      });

      await expect(
        request({ method: 'GET', url: '/hosts/apis' }),
      ).rejects.toBeDefined();

      expect(window.location.reload).toHaveBeenCalled();
      expect(isLoggingOut()).toBe(true);
    });

    it('is false after a Server API 401, which the plugin retries with a new token', async () => {
      const { isLoggingOut, request } = loadRequestHandler();
      axios.mockRejectedValue({
        response: { status: 401, data: { message: 'status code 401' } },
      });

      await expect(
        request({ method: 'POST', url: '/api/request' }),
      ).rejects.toBeDefined();
      leavePage();

      expect(isLoggingOut()).toBe(false);
    });
  });
});
