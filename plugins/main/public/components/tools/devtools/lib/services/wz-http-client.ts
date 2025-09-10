import { WzRequest } from '../../../../../react-services';
import type { HttpClient, HttpRequestOptions } from '../types/http';
import type { HttpMethod } from '../constants/http';
import IApiResponse from '../../../../../react-services/interfaces/api-response.interface';

/**
 * HttpClient backed by WzRequest.
 */
export class WzHttpClient implements HttpClient {
  async request<T = any>(
    method: HttpMethod,
    path: string,
    body?: any,
    options?: HttpRequestOptions,
  ): Promise<IApiResponse<T> | T> {
    return WzRequest.apiReq(method, path, body, options as any);
  }
}
