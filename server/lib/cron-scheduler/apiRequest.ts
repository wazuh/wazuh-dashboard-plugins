
import Axios, { AxiosRequestConfig, AxiosResponse }from 'axios';
import { log } from '../../logger';
import { Agent } from 'https';

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
      httpsAgent: new Agent({rejectUnauthorized: false})
    }
    
    const response = await Axios(requestConfig);
    return response;
  }

  public async getData():Promise<object> {
    try {
      const response = await this.makeRequest();
      if(response.data.error !== 0) throw response.data;
      return response.data;
    } catch (error) {
      if(error.response && error.response.status === 401){
        throw {error: 401, message: 'Wrong Wazuh API credentials used'};
      }
      if(error.code && error.code === 'ECONNRESET') {
        throw {error: 3005, message: 'Wrong protocol being used to connect to the Wazuh API'};
      }
      if(error.code && ['ENOTFOUND','EHOSTUNREACH','EINVAL','EAI_AGAIN','ECONNREFUSED'].includes(error.code)) {
        throw {error: 3005, message: 'Wazuh API is not reachable. Please check your url and port.'};
      }
      throw error;
    }
  }
}