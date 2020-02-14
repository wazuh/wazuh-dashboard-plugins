
import Axios, { AxiosRequestConfig, AxiosResponse }from 'axios';
import { log } from '../../logger';

export interface IApi {
  id: string
  user: string
  password: string
  url: string
  port: number
  cluster_info: {
    manager: string
    cluster: 'Disabled' | 'Enabled'
    status: 'disabled' | 'enabled'
  }
}

export class ApiRequest {
  private api: IApi;
  private request: string;
  private params: {};

  constructor(request:string, api:IApi, params:{}={}, ) {
    this.request = request;
    this.api = api;
    this.params = params;
  }

  private async makeRequest():Promise<AxiosResponse> {
    const {url, port, user, password} = this.api;
    
    const requestConfig: AxiosRequestConfig = {
      method: 'GET',
      baseURL: `${url}:${port}`,
      url: this.request,
      params: this.params,
      headers: { 'Content-Type': 'application/json', 'kbn-xsrf': 'kibana' },
      auth: {username: user, password: password},
    }
    
    const response = await Axios(requestConfig);
    return response;
  }

  public async getData():Promise<object> {
    try {
      const response = await this.makeRequest();
      return response.data;
    } catch (error) {
      if(error.response.status === 401){
        log('apiRequest', `Wrong Wazuh API credentials used`);
        throw error.response;
      }
      return error.response.data;
    }
  }
}