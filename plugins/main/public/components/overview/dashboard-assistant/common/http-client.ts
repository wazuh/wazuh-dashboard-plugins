import { GenericRequest } from '../../../../react-services/generic-request';
import { IHttpClient } from './installation-manager/domain/types';

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

export class HttpClient implements IHttpClient {
  private buildProxyUrl = (method: HttpMethod, path: string) =>
    `/api/console/proxy?method=${method}&path=${path}&dataSourceId=`;

  get proxyRequest() {
    return {
      post: Object.assign(
        (url: string, data?: any, config?: Record<string, any>) =>
          this.post(this.buildProxyUrl(HttpMethod.POST, url), data, config),
        {
          put: (url: string, data?: any, config?: Record<string, any>) =>
            this.post(this.buildProxyUrl(HttpMethod.PUT, url), data, config),
          delete: (url: string, config?: Record<string, any>) =>
            this.post(this.buildProxyUrl(HttpMethod.DELETE, url), config),
        },
      ),
      get: (url: string, config?: Record<string, any>) =>
        this.get(this.buildProxyUrl(HttpMethod.GET, url), config),
      put: (url: string, data?: any, config?: Record<string, any>) =>
        this.put(this.buildProxyUrl(HttpMethod.PUT, url), data, config),
      delete: (url: string, config?: Record<string, any>) =>
        this.delete(this.buildProxyUrl(HttpMethod.DELETE, url), config),
    };
  }

  async get<T = any>(url: string, config?: Record<string, any>): Promise<T> {
    try {
      const response = (await GenericRequest.request(
        HttpMethod.GET,
        url,
        null,
        true,
      )) as { data: T };
      return response.data;
    } catch (error) {
      throw new Error(`${HttpMethod.GET} request failed: ${error}`);
    }
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: Record<string, any>,
  ): Promise<T> {
    try {
      const response = (await GenericRequest.request(
        HttpMethod.POST,
        url,
        data,
        true,
      )) as { data: T };
      return response.data;
    } catch (error) {
      throw new Error(`${HttpMethod.POST} request failed: ${error}`);
    }
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: Record<string, any>,
  ): Promise<T> {
    try {
      const response = (await GenericRequest.request(
        HttpMethod.PUT,
        url,
        data,
        true,
      )) as { data: T };
      return response.data;
    } catch (error) {
      throw new Error(`${HttpMethod.PUT} request failed: ${error}`);
    }
  }

  async delete<T = any>(url: string, config?: Record<string, any>): Promise<T> {
    try {
      const response = (await GenericRequest.request(
        HttpMethod.DELETE,
        url,
        null,
        true,
      )) as { data: T };
      return response.data;
    } catch (error) {
      throw new Error(`${HttpMethod.DELETE} request failed: ${error}`);
    }
  }
}
