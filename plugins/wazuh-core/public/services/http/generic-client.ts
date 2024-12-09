import { Logger } from '../../../common/services/configuration';
import { PLUGIN_PLATFORM_REQUEST_HEADERS } from './constants';
import {
  HTTPClientGeneric,
  HTTPClientRequestInterceptor,
  HTTPVerb,
} from './types';

interface GenericRequestServices {
  request: HTTPClientRequestInterceptor['request'];
  getURL: (path: string) => string;
  getTimeout: () => Promise<number>;
  getIndexPatternTitle: () => Promise<string>;
  getServerAPI: () => string;
  checkAPIById: (apiId: string) => Promise<any>;
}

export class GenericRequest implements HTTPClientGeneric {
  onErrorInterceptor?: (error: any) => Promise<void>;

  constructor(
    private readonly logger: Logger,
    private readonly services: GenericRequestServices,
  ) {}

  async request(
    method: HTTPVerb,
    path: string,
    payload = null,
    returnError = false,
  ) {
    try {
      if (!method || !path) {
        throw new Error('Missing parameters');
      }

      const timeout = await this.services.getTimeout();
      const requestHeaders = {
        ...PLUGIN_PLATFORM_REQUEST_HEADERS,
        'content-type': 'application/json',
      };
      const url = this.services.getURL(path);

      try {
        requestHeaders.pattern = await this.services.getIndexPatternTitle();
      } catch {
        /* empty */
      }

      try {
        requestHeaders.id = this.services.getServerAPI();
      } catch {
        // Intended
      }

      let options = {};

      if (method === 'GET') {
        options = {
          method: method,
          headers: requestHeaders,
          url: url,
          timeout: timeout,
        };
      }

      if (method === 'PUT') {
        options = {
          method: method,
          headers: requestHeaders,
          data: payload,
          url: url,
          timeout: timeout,
        };
      }

      if (method === 'POST') {
        options = {
          method: method,
          headers: requestHeaders,
          data: payload,
          url: url,
          timeout: timeout,
        };
      }

      if (method === 'DELETE') {
        options = {
          method: method,
          headers: requestHeaders,
          data: payload,
          url: url,
          timeout: timeout,
        };
      }

      const data = await this.services.request(options);

      if (!data) {
        throw new Error(`Error doing a request to ${url}, method: ${method}.`);
      }

      return data;
    } catch (error) {
      // if the requests fails, we need to check if the API is down
      const currentApi = this.services.getServerAPI(); // JSON.parse(AppState.getCurrentAPI() || '{}');

      if (currentApi) {
        try {
          await this.services.checkAPIById(currentApi);
        } catch {
          // const wzMisc = new WzMisc();
          // wzMisc.setApiIsDown(true);
          // if (
          //   ['/settings', '/health-check', '/blank-screen'].every(
          //     pathname =>
          //       !NavigationService.getInstance()
          //         .getPathname()
          //         .startsWith(pathname),
          //   )
          // ) {
          //   NavigationService.getInstance().navigate('/health-check');
          // }
        }
      }

      // if(this.onErrorInterceptor){
      //   await this.onErrorInterceptor(error)
      // }
      if (returnError) {
        throw error;
      }

      return error?.response?.data?.message || false
        ? Promise.reject(new Error(error.response.data.message))
        : Promise.reject(error || new Error('Server did not respond'));
    }
  }

  setOnErrorInterceptor(onErrorInterceptor: (error: any) => Promise<void>) {
    this.onErrorInterceptor = onErrorInterceptor;
  }
}
