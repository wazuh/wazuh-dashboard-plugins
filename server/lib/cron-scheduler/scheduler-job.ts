import { jobs } from './predefined-jobs';
import { WazuhHostsCtrl } from '../../controllers/wazuh-hosts';
import { IApi, ApiRequest, SaveDocument } from './index';
import { ErrorHandler } from './error-handler';

export class SchedulerJob {
  jobName: string;
  wazuhHosts: WazuhHostsCtrl;
  saveDocument: SaveDocument;
  server: any;

  constructor(jobName: string, server) {
    this.jobName = jobName;
    this.server = server;
    this.wazuhHosts = new WazuhHostsCtrl();
    this.saveDocument = new SaveDocument(server);
  }

  public async run() {
    const { index, status } = jobs[this.jobName];
    if ( !status ) { return; }
    try {
      const hosts = await this.getApiObjects();
      const data = await hosts.reduce(async (acc, host) => {
        const response = await this.getResponses(host);
        const accResolve = await Promise.resolve(acc)
        return [
          ...accResolve,
          ...response,
        ]
      }, Promise.resolve([]));
      await this.saveDocument.save(data, index);
    } catch (error) {
      ErrorHandler(error, this.server);
    } 
  }

  private async getApiObjects() {
    const { apis } = jobs[this.jobName];
    const hosts:IApi[] = await this.wazuhHosts.getHostsEntries(false, false, false);
    if (hosts.length <= 0) throw {error: 10001, message: 'No Wazuh host configured in wazuh.yml' }
    if(apis){
      return this.filterHosts(hosts, apis);
    }
    return hosts;
  }

  private filterHosts(hosts: IApi[], apis: string[]) {
    const filteredHosts = hosts.filter(host => apis.includes(host.id));
    if (filteredHosts.length <= 0) {
      throw {error: '10002', message: 'No host was found with the indicated ID'};
    }
    return filteredHosts;
  }

  private async getResponses(host): Promise<object[]> {
    const { request, params } = jobs[this.jobName];
    const data:object[] = [];

    if (typeof request === 'string') {
      const apiRequest = new ApiRequest(request, host, params);
      const response = await apiRequest.getData()
      data.push({...response, apiName:host.id});
    }else {
      await this.getResponsesForIRequest(host, data);
    }
    return data;
  }

  private async getResponsesForIRequest(host: any,  data: object[]) {
    const { request, params } = jobs[this.jobName];
    const fieldName = this.getParamName(request.request);
    const paramList = await this.getParamList(fieldName, host);
    for (const param of paramList) {
      const paramRequest = request.request.replace(/\{.+\}/, param);
      const apiRequest = new ApiRequest(paramRequest, host, params);
      const response = await apiRequest.getData();
      response.data['apiName'] = host.id;
      response.data[fieldName] = param;
      data.push(response);
    }
  }

  private getParamName(request): string {
    const regexResult = /\{(?<fieldName>.+)\}/.exec(request);
    if (regexResult === null) throw {error: 10003, message: `The parameter is not found in the Request: ${request}`};
    // @ts-ignore
    const { fieldName } = regexResult.groups;
    if (fieldName === undefined || fieldName === '') throw {error: 10004, message: `Invalid field in the request: {request: ${request}, field: ${fieldName}}`}
    return fieldName
  }

  private async getParamList(fieldName, host) {
    const { request } = jobs[this.jobName];
    // @ts-ignore
    const apiRequest = new ApiRequest(request.params[fieldName].request, host)
    const response = await apiRequest.getData();
    const { items } = response['data'];
    if (items === undefined || items.lenght === 0 ) throw {error: 10005, message: `Empty response when tried to get the parameters list: ${JSON.stringify(response)}`}
    const values = items.map(this.mapParamList)
    return values
  }

  private mapParamList(item) {
    if (typeof item !== 'object') {
      return item
    }
    const keys = Object.keys(item)
    console.log({keys})
    if(keys.length > 1 || keys.length < 0) throw { error: 10006, message: `More than one key or none were obtained: ${keys}`}
    return item[keys[0]];
  }
}
