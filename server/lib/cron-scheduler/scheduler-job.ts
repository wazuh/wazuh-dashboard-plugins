import { IJob } from './predefined-jobs';
import { WazuhHostsCtrl } from '../../controllers/wazuh-hosts';
import { IApi, ApiRequest, SaveDocument } from './index';

export class SchedulerJob {
  job: IJob;
  wazuhHosts: WazuhHostsCtrl;
  saveDocument: SaveDocument;

  constructor(newJob: IJob, server) {
    this.job = newJob;
    this.wazuhHosts = new WazuhHostsCtrl();
    this.saveDocument = new SaveDocument(server);
  }

  public async run() {
    const hosts = await this.getApiObjects();
    const data:object[] = [];
    for (const host of hosts) {
      const response = await this.getResponses(host);
      data.push(...response);
    }
    this.saveDocument.save(data, this.job.index)
  }

  private async getApiObjects() {
    const { apis } = this.job;
    const hosts:IApi[] = await this.wazuhHosts.getHostsEntries(false, false, false);
    if (hosts.length <= 0) { throw new Error('10001'); }
    if(apis){
      return this.filterHosts(hosts, apis);
    }
    return hosts;
  }

  private filterHosts(hosts: IApi[], apis: string[]) {
    const filteredHosts = hosts.filter(host => apis.includes(host.id));
    if (filteredHosts.length <= 0) {
      throw new Error('10002');
    }
    return filteredHosts;
  }

  private async getResponses(host): Promise<object[]> {
    const { request, params } = this.job;
    const data:object[] = [];

    if (typeof request === 'string') {
      const apiRequest = new ApiRequest(request, host, params);
      const response = await apiRequest.getData()
      data.push({...response, apiName:host.id});
    }else {
        const fieldName  = this.getParamName(request.request);
        const paramList = await this.getParamList(fieldName, host);
        for (const param of paramList) {
          const paramRequest = request.request.replace(/\{.+\}/, param);
          const apiRequest = new ApiRequest(paramRequest, host, params);
          const response = await apiRequest.getData()
          response.data['apiName'] = host.id;
          response.data[fieldName] = param;
          data.push(response)
        }
    }
    return data;
  }

  private getParamName(request): string {
    const regexResult = /\{(?<fieldName>.+)\}/.exec(request);
    if (regexResult === null) {throw new Error('10003');}
    // @ts-ignore
    const { fieldName } = regexResult.groups;
    if (fieldName === undefined || fieldName === '') {throw new Error('10004');}
    return fieldName
  }

  private async getParamList(fieldName, host) {
    const { request } = this.job;
    // @ts-ignore
    const apiRequest = new ApiRequest(request.params[fieldName].request, host)
    const response = await apiRequest.getData();
    const { items } = response['data'];
    if (items === undefined || items.lenght === 0 ) {throw new Error('10005');}
    const values = items.map(this.mapParamList)
    return values
  }

  private mapParamList(item) {
    if (typeof item !== 'object') {
      return item
    }
    const keys = Object.keys(item)
    if(keys.length > 1 || keys.length < 0) {
      throw new Error('10006');
    }
    return item[keys[0]];
  }
}
