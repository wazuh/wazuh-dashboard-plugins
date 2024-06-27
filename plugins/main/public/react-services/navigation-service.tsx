import { Location, Action, History } from 'history';
import { getCore } from '../kibana-services';
import { NavigateToAppOptions } from '../../../../src/core/public';
import { getIndexPattern } from './elastic_helpers';
import { buildPhraseFilter } from '../../../../src/plugins/data/common';
import rison from 'rison-node';

class NavigationService {
  private static instance: NavigationService;
  private history: History;

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
      ? params.toString()
      : this.getParams().toString();
    const locationHash = this.getHash();
    this.replace(
      `${newPath}${queryParams ? `?${queryParams}` : ''}${locationHash}`,
    );
  }

  public navigate(path: string, state?: any): void {
    if (!state) {
      this.history.push(path);
    } else {
      this.history.push({
        pathname: path,
        state,
      });
    }
  }

  public replace(path: string, state?: any): void {
    if (!state) {
      this.history.replace(path);
    } else {
      this.history.replace({
        pathname: path,
        state,
      });
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

  /*
  TODO: Analyze and improve this function taking into account whether buildFilter_w is still used and whether the implementation with respect to the middle button is correct in navigateToModule
  */
  private buildFilter_w(filters, indexPattern) {
    const filtersArray: any[] = [];
    Object.keys(filters).forEach(currentFilter => {
      filtersArray.push({
        ...buildPhraseFilter(
          { name: currentFilter, type: 'text' },
          filters[currentFilter],
          indexPattern,
        ),
        $state: { isImplicit: false, store: 'appState' },
      });
    });
    return rison.encode({ filters: filtersArray });
  }

  navigateToModule(e: any, section: string, params: any, navigateMethod?: any) {
    e.persist(); // needed to access this event asynchronously
    if (e.button == 0) {
      // left button clicked
      if (navigateMethod) {
        navigateMethod();
        return;
      }
    }
    getIndexPattern().then(indexPattern => {
      const urlParams = {};

      if (Object.keys(params).length) {
        Object.keys(params).forEach(key => {
          if (key === 'filters') {
            urlParams['_w'] = this.buildFilter_w(params[key], indexPattern);
          } else {
            urlParams[key] = params[key];
          }
        });
      }
      const url = Object.entries(urlParams)
        .map(e => e.join('='))
        .join('&');
      const currentUrl = window.location.href.split('#/')[0];
      const newUrl = currentUrl + `#/${section}?` + url;

      if (e && (e.which == 2 || e.button == 1)) {
        // middlebutton clicked
        window.open(newUrl, '_blank', 'noreferrer');
      } else if (e.button == 0) {
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
