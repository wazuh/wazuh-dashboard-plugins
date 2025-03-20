import { Location, History } from 'history';

export class NavigationService {
  // eslint-disable-next-line no-use-before-define
  private static instance: NavigationService;

  private constructor(private readonly history: History) {}

  public static getInstance(history?: History): NavigationService {
    if (history) {
      NavigationService.instance = new NavigationService(history);
    } else if (!NavigationService.instance) {
      throw new Error('NavigationService must be initialized with a history.');
    }

    return NavigationService.instance;
  }

  public getHistory(): History {
    return this.history;
  }

  public navigate(path: string, state?: any): void {
    if (state) {
      this.history.push({
        pathname: path,
        state,
      });
    } else {
      this.history.push(path);
    }
  }

  public getLocation(): Location {
    return this.history.location;
  }
}
