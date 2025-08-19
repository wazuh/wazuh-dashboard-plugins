interface HttpProxyPostRequest {
  <T = any>(url: string, data?: any, config?: Record<string, any>): Promise<T>;
  WithPut: <T = any>(
    url: string,
    data?: any,
    config?: Record<string, any>,
  ) => Promise<T>;
  WithDelete: <T = any>(
    url: string,
    config?: Record<string, any>,
  ) => Promise<T>;
  WithGet: <T = any>(
    url: string,
    config?: Record<string, any>,
  ) => Promise<T>;
}

interface HttpProxyRequest {
  post: HttpProxyPostRequest;
  get: <T = any>(url: string, config?: Record<string, any>) => Promise<T>;
  put: <T = any>(
    url: string,
    data?: any,
    config?: Record<string, any>,
  ) => Promise<T>;
  delete: <T = any>(url: string, config?: Record<string, any>) => Promise<T>;
}

export interface IHttpClient {
  get<T = any>(url: string, config?: Record<string, any>): Promise<T>;
  post<T = any>(
    url: string,
    data?: any,
    config?: Record<string, any>,
  ): Promise<T>;
  put<T = any>(
    url: string,
    data?: any,
    config?: Record<string, any>,
  ): Promise<T>;
  delete<T = any>(url: string, config?: Record<string, any>): Promise<T>;
  proxyRequest: HttpProxyRequest;
}
