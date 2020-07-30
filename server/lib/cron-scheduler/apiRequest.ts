import { AxiosResponse }from 'axios';
import { ApiInterceptor } from '../api-interceptor.js';

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
  private apiInterceptor: ApiInterceptor;

  constructor(request:string, api:IApi, params:{}={}, ) {
    this.request = request;
    this.api = api;
    this.params = params;
    this.apiInterceptor = new ApiInterceptor()
  }

  private async makeRequest():Promise<AxiosResponse> {
    const {id, url, port} = this.api;
    
    const response: AxiosResponse = await this.apiInterceptor.request(
      'GET',
      `${url}:${port}/v4/${this.request}`,
      this.params,
      {idHost: id }
    )
    return response;
  }

  public async getData():Promise<object> {
    try {
      const response = await this.makeRequest();
      if(response.data.status) throw response;
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