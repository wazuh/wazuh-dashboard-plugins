import { Location, Action, History } from 'history';
import rison from 'rison-node';
import { getCore } from '../kibana-services';
import { NavigateToAppOptions } from '../../../../src/core/public';
import { buildPhraseFilter } from '../../../../src/plugins/data/common';
import { getIndexPattern } from './elastic_helpers';

class NavigationService {
  // eslint-disable-next-line no-use-before-define
  private static instance: NavigationService;
  private readonly history: History;

  private constructor(history: History) {
    this.history = history;
  }

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
      ? this.buildSearch(params)
      : this.buildSearch(this.getParams());
    const locationHash = this.getHash();

    this.navigate(
      `${newPath}${queryParams ? `?${queryParams}` : ''}${locationHash}`,
    );
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

  public replace(path: string, state?: any): void {
    if (state) {
      this.history.replace({
        pathname: path,
        state,
      });
    } else {
      this.history.replace(path);
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
    globalThis.location.reload();
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

  public buildSearch(search: URLSearchParams) {
    return [...search.entries()]
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
  }

  public updateAndNavigateSearchParams(
    params: Record<string, string | null>,
  ): void {
    const urlParams = this.getParams();

    // Update or delete parameters according to their value
    for (const [key, value] of Object.entries(params)) {
      if (value === null) {
        urlParams.delete(key);
      } else {
        urlParams.set(key, value);
      }
    }

    const queryString = this.buildSearch(urlParams);

    this.navigate(`${this.getPathname()}?${queryString}`);
  }

  public switchTab(newTab: string): void {
    this.updateAndNavigateSearchParams({ tab: newTab });
  }

  public switchSubTab(subTab: string): void {
    this.updateAndNavigateSearchParams({ tabView: subTab });
  }

  /*
  TODO: Analyze and improve this function taking into account whether buildFilterW is still used and whether the implementation with respect to the middle button is correct in navigateToModule
  */
  private buildFilterW(filters, indexPattern) {
    const filtersArray: any[] = [];

    for (const currentFilter of Object.keys(filters)) {
      filtersArray.push({
        ...buildPhraseFilter(
          { name: currentFilter, type: 'text' },
          filters[currentFilter],
          indexPattern,
        ),
        $state: { isImplicit: false, store: 'appState' },
      });
    }

    return rison.encode({ filters: filtersArray });
  }

  navigateToModule(
    event: any,
    section: string,
    params: any,
    navigateMethod?: any,
  ) {
    event.persist(); // needed to access this event asynchronously

    if (
      event.button === 0 && // left button clicked
      navigateMethod
    ) {
      navigateMethod();

      return;
    }

    getIndexPattern().then(indexPattern => {
      const urlParams = {};

      if (Object.keys(params).length > 0) {
        for (const key of Object.keys(params)) {
          if (key === 'filters') {
            urlParams['_w'] = this.buildFilterW(params[key], indexPattern);
          } else {
            urlParams[key] = params[key];
          }
        }
      }

      const url = Object.entries(urlParams)
        .map(urlParam => urlParam.join('='))
        .join('&');
      const currentUrl = globalThis.location.href.split('#/')[0];
      const newUrl = currentUrl + `#/${section}?` + url;

      if (event && (event.which === 2 || event.button === 1)) {
        // middlebutton clicked
        window.open(newUrl, '_blank', 'noreferrer');
      } else if (event.button === 0) {
        // left button clicked
        if (navigateMethod) {
          navigateMethod();
        } else {
          this.replace(`${this.getPathname()}?${url}`);
        }
      }
    });
  }
}

export default NavigationService;
export { NavigationService };
