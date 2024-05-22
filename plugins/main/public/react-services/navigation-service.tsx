import { Location, Action, History } from 'history';

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

  public navigate(path: string, state?: any): void {
    this.history.push(path, state);
  }

  public replace(path: string, state?: any): void {
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

  public listen(listener: (location: Location, action: Action) => void): void {
    this.history.listen(listener);
  }
}

export default NavigationService;
