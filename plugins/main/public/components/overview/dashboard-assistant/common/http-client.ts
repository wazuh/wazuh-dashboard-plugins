import { GenericRequest } from '../../../../react-services/generic-request';
import { IHttpClient } from './installation-manager/domain/types';

export class HttpClient implements IHttpClient {
  async get<T = any>(url: string, config?: any): Promise<T> {
    try {
      const response = await GenericRequest.request('GET', url, null, true) as { data: T };
      return response.data
    } catch (error) {
      throw new Error(`GET request failed: ${error}`);
    }
  }

  async post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    try {
      const response = await GenericRequest.request('POST', url, data, true) as { data: T };
      return response.data;
    } catch (error) {
      throw new Error(`POST request failed: ${error}`);
    }
  }

  async put<T = any>(url: string, data?: any, config?: any): Promise<T> {
    try {
      const response = await GenericRequest.request('PUT', url, data, true) as { data: T };
      return response.data;
    } catch (error) {
      throw new Error(`PUT request failed: ${error}`);
    }
  }

  async delete<T = any>(url: string, config?: any): Promise<T> {
    try {
      const response = await GenericRequest.request('DELETE', url, null, true) as { data: T };
      return response.data;
    } catch (error) {
      throw new Error(`DELETE request failed: ${error}`);
    }
  }
}