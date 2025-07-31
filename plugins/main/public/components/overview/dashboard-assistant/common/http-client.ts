import { GenericRequest } from '../../../../react-services/generic-request';
import { IHttpClient } from './installation-manager/domain/types';

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

const buildProxyUrl = (method: HttpMethod, path: string) =>
  `/api/console/proxy?method=${method}&path=${path}&dataSourceId=`;

export class HttpClient implements IHttpClient {
  get proxyRequest() {
    return {
      get: (url: string, config?: Record<string, any>) =>
        this.post(buildProxyUrl(HttpMethod.GET, url), config),
      post: Object.assign(
        (url: string, data?: any, config?: Record<string, any>) =>
          this.post(buildProxyUrl(HttpMethod.POST, url), data, config),
        {
          put: (url: string, data?: any, config?: Record<string, any>) =>
            this.post(buildProxyUrl(HttpMethod.PUT, url), data, config),
          delete: (url: string, config?: Record<string, any>) =>
            this.post(buildProxyUrl(HttpMethod.DELETE, url), config),
        },
      ),
      put: (url: string, data?: any, config?: Record<string, any>) =>
        this.put(buildProxyUrl(HttpMethod.PUT, url), data, config),
      delete: (url: string, config?: Record<string, any>) =>
        this.delete(buildProxyUrl(HttpMethod.DELETE, url), config),
    };
  }

  async get<T = any>(url: string, config?: Record<string, any>): Promise<T> {
    try {
      const response = (await GenericRequest.request(
        HttpMethod.GET,
        config?.proxy ? buildProxyUrl(HttpMethod.GET, url) : url,
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
