import { createHashHistory, History } from 'history';
import NavigationService from './navigation-service';

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
