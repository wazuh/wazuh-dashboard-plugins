import { Logger } from '../../../common/services/configuration';
import { HTTP_CLIENT_DEFAULT_TIMEOUT } from './constants';
import { GenericRequest } from './generic-client';
import { RequestInterceptorClient } from './request-interceptor';
import { WzRequest } from './server-client';
import { HTTPClient, HTTPClientRequestInterceptor } from './types';

interface HTTPClientServices {
  http: any;
  getTimeout(): Promise<number>;
  getURL(path: string): string;
  getServerAPI(): string;
  getIndexPatternTitle(): Promise<string>;
}

export class CoreHTTPClient implements HTTPClient {
  private requestInterceptor: HTTPClientRequestInterceptor;
  public generic;
  public server;
  private _timeout: number = HTTP_CLIENT_DEFAULT_TIMEOUT;
  constructor(private logger: Logger, private services: HTTPClientServices) {
    this.logger.debug('Creating client');
    // Create request interceptor
    this.requestInterceptor = new RequestInterceptorClient(
      logger,
      this.services.http,
    );

    const getTimeout = async () =>
      (await this.services.getTimeout()) || this._timeout;

    const internalServices = {
      getTimeout,
      getServerAPI: this.services.getServerAPI,
      getURL: this.services.getURL,
    };

    // Create clients
    this.server = new WzRequest(logger, {
      request: options => this.requestInterceptor.request(options),
      ...internalServices,
    });
    this.generic = new GenericRequest(logger, {
      request: options => this.requestInterceptor.request(options),
      getIndexPatternTitle: this.services.getIndexPatternTitle,
      ...internalServices,
      checkAPIById: apiId => this.server.checkAPIById(apiId),
    });
    this.logger.debug('Created client');
  }
  async setup() {
    this.logger.debug('Setup');
  }
  async start() {}
  async stop() {}
  async register() {
    this.logger.debug('Starting client');
    this.requestInterceptor.init();
    this.logger.debug('Started client');
  }
  async unregister() {
    this.logger.debug('Stopping client');
    this.requestInterceptor.destroy();
    this.logger.debug('Stopped client');
  }
}
