import IApiResponse from '../../../../../react-services/interfaces/api-response.interface';
import type { HttpMethod } from '../constants/http';

export interface HttpRequestOptions {
  // When true, return the raw axios-like response
  returnOriginalResponse?: boolean;
}

export interface HttpResponse<T = any> {
  status: number;
  statusText: string;
  data: T;
}

export interface HttpClient {
  request<T = any>(
    method: HttpMethod,
    path: string,
    body?: any,
    options?: HttpRequestOptions,
  ): Promise<IApiResponse<T> | T>;
}
