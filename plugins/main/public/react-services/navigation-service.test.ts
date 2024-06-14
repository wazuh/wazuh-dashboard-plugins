import { createHashHistory, History } from 'history';
import NavigationService from './navigation-service';
import { getCore } from '../kibana-services';

jest.mock('../kibana-services');

const navigateToApp = jest.fn();
const navigateToUrl = jest.fn();
const getUrlForApp = jest.fn();

getCore.mockImplementation(() => ({
  application: {
    navigateToApp: navigateToApp,
    navigateToUrl: navigateToUrl,
    getUrlForApp: getUrlForApp,
  },
}));

describe('NavigationService test', () => {
  let history: History;
  let navigationService: NavigationService;

  beforeEach(() => {
    history = createHashHistory();
    navigationService = NavigationService.getInstance(history);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should get the current history instance', () => {
    expect(navigationService.getHistory()).toBe(history);
  });

  it('should get the current location', () => {
    navigationService.navigate('/test-path');
    expect(navigationService.getLocation()).toBe(history.location);
  });

  it('should get the current pathname', () => {
    navigationService.navigate('/test-path');
    expect(navigationService.getPathname()).toBe('/test-path');
  });

  it('should get the current search', () => {
    navigationService.navigate('/test-path?search=test');
    expect(navigationService.getSearch()).toBe('?search=test');
  });

  it('should get the current hash', () => {
    navigationService.navigate('/test-path#hash');
    expect(navigationService.getHash()).toBe('#hash');
  });

  it('should get the current state', () => {
    const state = { key: 'value' };
    navigationService.navigate('/test-path', state);
    expect(navigationService.getState()).toBe(state);
  });

  it('should get URLSearchParams from the current search', () => {
    navigationService.navigate('/test-path?search=test');
    expect(navigationService.getParams().get('search')).toBe('test');
  });

  it('should navigate to a new path', () => {
    navigationService.navigate('/new-path');
    expect(history.location.pathname).toBe('/new-path');
  });

  it('should replace the current path', () => {
    navigationService.replace('/replaced-path');
    expect(history.location.pathname).toBe('/replaced-path');
  });

  it('should call to navigateToApp from core.application', async () => {
    await navigationService.navigateToApp('app_id', {});
    expect(navigateToApp).toHaveBeenCalledTimes(1);
  });

  it('should navigate to a URL', async () => {
    await navigationService.navigateToUrl('https://test.com');
    expect(navigateToUrl).toHaveBeenCalledWith('https://test.com');
  });

  it('should get URL for an app', () => {
    navigationService.getUrlForApp('testApp', { path: '/test-path' });
    expect(getUrlForApp).toHaveBeenCalledWith('testApp', {
      path: '/test-path',
    });
  });

  /*
  The particular problem with testing NavigationService's goBack, goForward, and go(n) methods
  is that this is an asynchronous operation, meaning that navigation back/forward/n does not complete immediately.
  To resolve this, we leverage the listen method to listen for changes in history and ensure that the test waits
   for the navigation to complete before making expectations.
   */
  it('should navigate goBack', async () => {
    navigationService.navigate('/first-path');
    navigationService.navigate('/second-path');

    // Go back to /first-path
    await new Promise<void>(resolve => {
      const unlisten = navigationService.listen(location => {
        if (location.pathname === '/first-path') {
          unlisten();
          resolve();
        }
      });
      navigationService.goBack();
    });

    expect(history.location.pathname).toEqual('/first-path');
  });

  it('should navigate forward', async () => {
    navigationService.navigate('/first-path');
    navigationService.navigate('/second-path');
    navigationService.navigate('/third-path');

    // Go back to /second-path
    await new Promise<void>(resolve => {
      const unlisten = navigationService.listen(location => {
        if (location.pathname === '/second-path') {
          unlisten();
          resolve();
        }
      });
      navigationService.goBack();
    });

    // Now go forward to /third-path
    await new Promise<void>(resolve => {
      const unlisten = navigationService.listen(location => {
        if (location.pathname === '/third-path') {
          unlisten();
          resolve();
        }
      });
      navigationService.goForward();
    });

    expect(history.location.pathname).toEqual('/third-path');
  });

  it('should navigate with go(n)', async () => {
    navigationService.navigate('/first-path');
    navigationService.navigate('/second-path');
    navigationService.navigate('/third-path');
    navigationService.navigate('/fourth-path');

    // Go back 2 steps to /second-path
    await new Promise<void>(resolve => {
      const unlisten = navigationService.listen(location => {
        if (location.pathname === '/second-path') {
          unlisten();
          resolve();
        }
      });
      navigationService.go(-2);
    });

    expect(history.location.pathname).toEqual('/second-path');

    // Go forward 1 step to /third-path
    await new Promise<void>(resolve => {
      const unlisten = navigationService.listen(location => {
        if (location.pathname === '/third-path') {
          unlisten();
          resolve();
        }
      });
      navigationService.go(1);
    });

    expect(history.location.pathname).toEqual('/third-path');

    // Go forward 1 more step to /fourth-path
    await new Promise<void>(resolve => {
      const unlisten = navigationService.listen(location => {
        if (location.pathname === '/fourth-path') {
          unlisten();
          resolve();
        }
      });
      navigationService.go(1);
    });

    expect(history.location.pathname).toEqual('/fourth-path');
  });

  it('should reload the page', () => {
    const reloadMock = jest.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { reload: reloadMock },
    });
    navigationService.reload();
    expect(reloadMock).toHaveBeenCalled();
  });
});
