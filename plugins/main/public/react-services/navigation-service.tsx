import { Location, Action, History, Path } from 'history';

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
    this.history.push(path, state);
  }

  public replace(path: string | Partial<Path>, state?: any): void {
    this.history.replace(path, state);
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

  public getLocation(): Location {
    return this.history.location;
  }

  public listen(
    listener: (location: Location, action: Action) => void,
  ): () => void {
    const unlisten = this.history.listen(listener);
    return unlisten;
  }
}

export default NavigationService;
