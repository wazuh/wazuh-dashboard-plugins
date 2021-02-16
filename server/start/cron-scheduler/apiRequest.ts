import { AxiosResponse }from 'axios';
import * as ApiInterceptor  from '../../lib/api-interceptor.js';

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
    const {id, url, port} = this.api;
    
    const response: AxiosResponse = await ApiInterceptor.requestAsInternalUser(
      'GET',
      '/${this.request}',
      this.params,
      {apiHostID: id }
    )
    return response;
  }

  public async getData():Promise<object> {
    try {
      const response = await this.makeRequest();
      if (response.status !== 200) throw response;
      return response.data;
    } catch (error) {
      if (error.status === 404) {
        throw {error: 404, message: error.data.detail};
      }
      if (error.response && error.response.status === 401){
        throw {error: 401, message: 'Wrong Wazuh API credentials used'};
      }
      if (error && error.data && error.data.detail && error.data.detail === 'ECONNRESET') {
        throw {error: 3005, message: 'Wrong protocol being used to connect to the Wazuh API'};
      }
      if (error && error.data && error.data.detail && ['ENOTFOUND','EHOSTUNREACH','EINVAL','EAI_AGAIN','ECONNREFUSED'].includes(error.data.detail)) {
        throw {error: 3005, message: 'Wazuh API is not reachable. Please check your url and port.'};
      }
      throw error;
    }
  }
}