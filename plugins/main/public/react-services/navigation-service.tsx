import { Location, Action, History } from 'history';
import { getCore } from '../kibana-services';
import { NavigateToAppOptions } from '../../../../src/core/public';
import { getIndexPattern } from './elastic_helpers';
import { buildPhraseFilter } from '../../../../src/plugins/data/common';
import rison from 'rison-node';

/**
 * Custom implementation URLSearchParams-like to parse and serialize the URL query string.
 * This does not encode the URL avoid the _a and _g query parameters filters can be modified in
 * unexpected way breaking the filtering
 */
export class NavigationURLSearchParams {
  _params: Map<string, string[]>;
  constructor(queryString = '') {
    // strip leading “?” if present
    const qs =
      queryString.charAt(0) === '?' ? queryString.slice(1) : queryString;
    this._params = new Map();

    if (!qs) return;

    // parse “a=1&b=2&a=3”
    qs.split('&').forEach(pair => {
      const [rawKey, rawVal = null] = pair.split('=');
      const key = rawKey; // No decode the key
      const val = rawVal; // No decode the value

      if (!this._params.has(key)) {
        this._params.set(key, []);
      }
      this._params.get(key).push(val);
    });
  }

  // get first value for key
  get(key: string) {
    const vals = this._params.get(key);
    return vals ? vals[0] : null;
  }

  // get all values for key
  getAll(key: string) {
    return this._params.get(key) || [];
  }

  // check if it has a key
  has(key: string) {
    return this._params.has(key);
  }

  // replace all values for key
  set(key: string, value: any) {
    this._params.set(key, [String(value)]);
  }

  // append one more value under key
  append(key: string, value: any) {
    if (!this._params.has(key)) {
      this._params.set(key, []);
    }
    this._params.get(key).push(String(value));
  }

  // remove key entirely
  delete(key: string) {
    this._params.delete(key);
  }

  // iterate [key, value] for every single entry
  *entries() {
    for (const [key, values] of this._params) {
      for (const val of values) {
        yield [key, val];
      }
    }
  }

  // iterate value for every single entry
  *keys() {
    for (const key of this._params.keys()) {
      yield key;
    }
  }

  // iterate value for every single entry
  *values() {
    for (const value of this._params.values()) {
      yield value;
    }
  }

  // alias for entries(), so for..of works
  [Symbol.iterator]() {
    return this.entries();
  }

  // rebuild a query string
  toString() {
    const parts = [];
    for (const [rawKey, rawValue] of this._params) {
      const key = rawKey;
      const value = rawValue == null ? '' : rawValue; // assume already encoded if non-empty
      parts.push(value === '' ? key : `${key}=${value}`);
    }
    return parts.length ? '?' + parts.join('&') : '';
  }
}

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

  public getParams(): NavigationURLSearchParams {
    return new NavigationURLSearchParams(this.history.location.search);
  }

  public renewURL(params?: NavigationURLSearchParams): void {
    const newPath = this.getPathname();
    const queryParams = params
      ? this.buildSearch(params)
      : this.buildSearch(this.getParams());
    const locationHash = this.getHash();
    this.navigate(
      `${newPath}${queryParams ? `${queryParams}` : ''}${locationHash}`,
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

  public buildSearch(search: NavigationURLSearchParams) {
    return search.toString();
  }

  public updateAndNavigateSearchParams(params: {
    [key: string]: string | null;
  }): void {
    const urlParams = this.getParams();

    // Update or delete parameters according to their value
    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        urlParams.delete(key);
      } else {
        urlParams.set(key, value);
      }
    });

    const queryString = this.buildSearch(urlParams);
    this.navigate(`${this.getPathname()}${queryString}`);
  }

  public switchTab(newTab: string): void {
    this.updateAndNavigateSearchParams({ tab: newTab });
  }

  public switchSubTab = (subTab: string): void => {
    this.updateAndNavigateSearchParams({ tabView: subTab });
  };

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
