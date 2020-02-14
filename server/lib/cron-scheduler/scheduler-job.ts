import { IJob } from './predefined-jobs';
import { WazuhHostsCtrl } from '../../controllers/wazuh-hosts'
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

  private async getApiObjects() {
    const { apis } = this.job;
    const hosts:IApi[] = await this.wazuhHosts.getHostsEntries(false, false, false);
    if (hosts.length <= 0) { throw new Error('10001'); }
    if(apis){
      const filteredHosts = hosts.filter(host => apis.includes(host.id));
      if (filteredHosts.length <= 0) { throw new Error('10002'); }
      return filteredHosts;
    }
    return hosts;
  }

  public async run() {
    const hosts = await this.getApiObjects();
    const data:object[] = [];
    for (const host of hosts) {
      const apiRequest = new ApiRequest(this.job.request, host, this.job.params);
      const response = await apiRequest.getData()
      data.push(response);
    }
    this.saveDocument.save(data, this.job.index)
  }
}
