import { AxiosRequestConfig } from 'axios';
import { BehaviorSubject } from 'rxjs';

export interface HTTPClientRequestInterceptor {
  init(): void;
  destroy(): void;
  cancel(): void;
  request(options: AxiosRequestConfig): Promise<any>;
}

export type HTTPVerb = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';

export interface HTTPClientGeneric {
  request(
    method: HTTPVerb,
    path: string,
    payload?: any,
    returnError?: boolean,
  ): Promise<any>;
}

export type HTTPClientServerUserData = {
  token: string | null;
  policies: any | null;
  account: any | null;
  logged: boolean;
};

export interface HTTPClientServer {
  request(
    method: HTTPVerb,
    path: string,
    body: any,
    options: {
      checkCurrentApiIsUp?: boolean;
      returnOriginalResponse?: boolean;
    },
  ): Promise<any>;
  csv(path: string, filters: any): Promise<any>;
  auth(force: boolean): Promise<any>;
  unauth(force: boolean): Promise<any>;
  userData$: BehaviorSubject<HTTPClientServerUserData>;
  getUserData(): HTTPClientServerUserData;
}

export interface HTTPClient {
  generic: HTTPClientGeneric;
  server: HTTPClientServer;
}

export interface WzRequestServices {
  request: HTTPClientRequestInterceptor['request'];
  getURL(path: string): string;
  getTimeout(): Promise<number>;
  getServerAPI(): string;
}

export interface ServerAPIResponseItems<T> {
  affected_items: Array<T>;
  failed_items: Array<any>;
  total_affected_items: number;
  total_failed_items: number;
}

export interface ServerAPIResponseItemsData<T> {
  data: ServerAPIResponseItems<T>;
  message: string;
  error: number;
}

export interface ServerAPIResponseItemsDataHTTPClient<T> {
  data: ServerAPIResponseItemsData<T>;
}
