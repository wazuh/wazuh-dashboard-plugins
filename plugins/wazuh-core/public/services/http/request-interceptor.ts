import axios, { AxiosRequestConfig } from 'axios';
import { HTTP_STATUS_CODES } from '../../../common/constants';
import { Logger } from '../../../common/services/configuration';
import { HTTPClientRequestInterceptor } from './types';

export class RequestInterceptorClient implements HTTPClientRequestInterceptor {
  // define if the request is allowed to run
  private _allow: boolean = true;
  // store the cancel token to abort the requests
  private _source: any;
  // unregister the interceptor
  private unregisterInterceptor: () => void = () => {};
  constructor(private logger: Logger, private http: any) {
    this.logger.debug('Creating');
    this._source = axios.CancelToken.source();
    this.logger.debug('Created');
  }
  private registerInterceptor() {
    this.logger.debug('Registering interceptor in core http');
    this.unregisterInterceptor = this.http.intercept({
      responseError: (httpErrorResponse, controller) => {
        if (
          httpErrorResponse.response?.status === HTTP_STATUS_CODES.UNAUTHORIZED
        ) {
          this.cancel();
        }
      },
      request: (current, controller) => {
        if (!this._allow) {
          throw new Error('Disable request');
        }
      },
    });
    this.logger.debug('Registered interceptor in core http');
  }
  init() {
    this.logger.debug('Initiating');
    this.registerInterceptor();
    this.logger.debug('Initiated');
  }
  destroy() {
    this.logger.debug('Destroying');
    this.logger.debug('Unregistering interceptor in core http');
    this.unregisterInterceptor();
    this.unregisterInterceptor = () => {};
    this.logger.debug('Unregistered interceptor in core http');
    this.logger.debug('Destroyed');
  }
  cancel() {
    this.logger.debug('Disabling requests');
    this._allow = false;
    this._source.cancel('Requests cancelled');
    this.logger.debug('Disabled requests');
  }
  async request(options: AxiosRequestConfig = {}) {
    if (!this._allow) {
      return Promise.reject('Requests are disabled');
    }
    if (!options.method || !options.url) {
      return Promise.reject('Missing parameters');
    }
    const optionsWithCancelToken = {
      ...options,
      cancelToken: this._source?.token,
    };

    if (this._allow) {
      try {
        const requestData = await axios(optionsWithCancelToken);
        return Promise.resolve(requestData);
      } catch (error) {
        if (
          error.response?.data?.message === 'Unauthorized' ||
          error.response?.data?.message === 'Authentication required'
        ) {
          this.cancel();
          // To reduce the dependencies, we use window object instead of the NavigationService
          window.location.reload();
        }
        throw error;
      }
    }
  }
}
