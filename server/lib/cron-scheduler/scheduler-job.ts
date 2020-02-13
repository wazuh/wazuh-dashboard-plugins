import { job } from './predefined-jobs';
import { WazuhHostsCtrl } from '../../controllers/wazuh-hosts'
import { IApi } from './index';

export class SchedulerJob {
  job: job;
  wazuhHosts: WazuhHostsCtrl;

  constructor(newJob: job) {
    this.job = newJob;
    this.wazuhHosts = new WazuhHostsCtrl();
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

  private async saveResponse() {}

  public async run() {}
}
