import { Location, Action, History, Path } from 'history';
import { getCore } from '../kibana-services';
import { NavigateToAppOptions } from '../../../../src/core/public';

class NavigationService {
  private static instance: NavigationService;
  private history: History;

  private constructor(history: History) {
    this.history = history;
  }

  public static getInstance(history?: History): NavigationService {
    if (!NavigationService.instance && history) {
      NavigationService.instance = new NavigationService(history);
    } else if (!NavigationService.instance) {
      throw new Error('NavigationService must be initialized with a history.');
    }
    return NavigationService.instance;
  }

  public getHistory(): History {
    return this.history;
  }

  public getLocation(): Location {
    return this.history.location;
  }

  public getHash(): string {
    return this.history.location.hash;
  }

  public getPathname(): string {
    return this.history.location.pathname;
  }

  public getSearch(): string {
    return this.history.location.search;
  }

  public getState(): any {
    return this.history.location.state;
  }

  public getParams(): URLSearchParams {
    return new URLSearchParams(this.history.location.search);
  }

  public renewURL(params?: URLSearchParams): void {
    const newPath = this.getPathname();
    const queryParams = params
      ? params.toString()
      : this.getParams().toString();
    const locationHash = this.getHash();
    this.replace(
      `${newPath}${queryParams ? `?${queryParams}` : ''}${locationHash}`,
    );
  }

  public navigate(path: string | Partial<Path>, state?: any): void {
    if (typeof path === 'string') {
      this.history.push(path, state);
    } else {
      this.history.push(path, state || path.state);
    }
  }

  public replace(path: string | Partial<Path>, state?: any): void {
    if (typeof path === 'string') {
      this.history.replace(path, state);
    } else {
      this.history.replace(path, state || path.state);
    }
  }

  public goBack(): void {
    this.history.goBack();
  }

  public goForward(): void {
    this.history.goForward();
  }

  public go(n: number): void {
    this.history.go(n);
  }

  public reload(): void {
    window.location.reload();
  }

  public listen(
    listener: (location: Location, action: Action) => void,
  ): () => void {
    const unlisten = this.history.listen(listener);
    return unlisten;
  }

  public async navigateToApp(
    appId: string,
    options?: NavigateToAppOptions,
  ): Promise<void> {
    await getCore().application.navigateToApp(appId, options);
  }

  public async navigateToUrl(url: string): Promise<void> {
    await getCore().application.navigateToUrl(url);
  }

  public getUrlForApp(
    appId: string,
    options?: { path?: string; absolute?: boolean },
  ): string {
    return getCore().application.getUrlForApp(appId, options);
  }
}

export default NavigationService;
