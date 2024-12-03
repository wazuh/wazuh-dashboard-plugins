import axios, { AxiosRequestConfig } from 'axios';
import { HTTP_STATUS_CODES } from '../../../common/constants';
import { Logger } from '../../../common/services/configuration';
import { HTTPClientRequestInterceptor } from './types';

export class RequestInterceptorClient implements HTTPClientRequestInterceptor {
  // define if the request is allowed to run
  private allow = true;
  // store the cancel token to abort the requests
  private readonly cancelTokenSource: any;
  // unregister the interceptor
  private unregisterInterceptor: () => void = function () {};

  constructor(
    private readonly logger: Logger,
    private readonly http: any,
  ) {
    this.logger.debug('Creating');
    this.cancelTokenSource = axios.CancelToken.source();
    this.logger.debug('Created');
  }

  private registerInterceptor() {
    this.logger.debug('Registering interceptor in core http');
    this.unregisterInterceptor = this.http.intercept({
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      responseError: (httpErrorResponse, controller) => {
        if (
          httpErrorResponse.response?.status === HTTP_STATUS_CODES.UNAUTHORIZED
        ) {
          this.cancel();
        }
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      request: (current, controller) => {
        if (!this.allow) {
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
    this.allow = false;
    this.cancelTokenSource.cancel('Requests cancelled');
    this.logger.debug('Disabled requests');
  }

  async request(options: AxiosRequestConfig = {}) {
    if (!this.allow) {
      throw 'Requests are disabled';
    }

    if (!options.method || !options.url) {
      throw 'Missing parameters';
    }

    const optionsWithCancelToken = {
      ...options,
      cancelToken: this.cancelTokenSource?.token,
    };

    if (this.allow) {
      try {
        const requestData = await axios(optionsWithCancelToken);

        return requestData;
      } catch (error) {
        if (
          error.response?.data?.message === 'Unauthorized' ||
          error.response?.data?.message === 'Authentication required'
        ) {
          this.cancel();
          // To reduce the dependencies, we use window object instead of the NavigationService
          globalThis.location.reload();
        }

        throw error;
      }
    }
  }
}
