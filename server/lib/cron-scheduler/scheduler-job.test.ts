//@ts-nocheck
import { job, SchedulerJob, IApi } from './index';
import { WazuhHostsCtrl } from '../../controllers/wazuh-hosts';
jest.mock('../../controllers/wazuh-hosts');

describe('SchedulerJob', () => {
  const oneApi = [ { 
    url: 'http://localhost',
    port: 55000,
    user: 'foo',
    password: 'bar',
    id: 'default',
    cluster_info: { 
      status: 'disabled',
      manager: 'master',
      node: 'node01',
      cluster: 'Disabled' 
    } 
  } ];
  const twoApi = [ 
    { 
      url: 'http://localhost',
      port: 55000,
      user: 'foo',
      password: 'bar',
      id: 'internal',
      cluster_info: { 
        status: 'disabled',
        manager: 'master',
        node: 'node01',
        cluster: 'Disabled' 
      } 
    }, 
    { 
      url: 'http://externalhost',
      port: 55000,
      user: 'foo',
      password: 'bar',
      id: 'external',
      cluster_info: { 
        status: 'disabled',
        manager: 'master',
        node: 'node01',
        cluster: 'Disabled' 
      } 
    }, 
  ];
  const threeApi = [ 
    { 
      url: 'http://localhost',
      port: 55000,
      user: 'foo',
      password: 'bar',
      id: 'internal',
      cluster_info: { 
        status: 'disabled',
        manager: 'master',
        node: 'node01',
        cluster: 'Disabled' 
      } 
    }, 
    { 
      url: 'http://externalhost',
      port: 55000,
      user: 'foo',
      password: 'bar',
      id: 'external',
      cluster_info: { 
        status: 'disabled',
        manager: 'master',
        node: 'node01',
        cluster: 'Disabled' 
      } 
    }, 
    { 
      url: 'http://externalhost',
      port: 55000,
      user: 'foo',
      password: 'bar',
      id: 'experimental',
      cluster_info: { 
        status: 'disabled',
        manager: 'master',
        node: 'node01',
        cluster: 'Disabled' 
      } 
    }, 
  ];
  const testJob: job = {
    status: true,
    method: 'GET',
    request: '/manager/status',
    params: {},
    index: 'manager-status',
    interval: '* */2 * * *',
    creation: 'w',
  }
  let schedulerJob: SchedulerJob;

  beforeEach(() => {
    schedulerJob = new SchedulerJob({...testJob});
  });

  afterEach(() => {
    jest.clearAllMocks();
  })

  it('should job is assigned ', () => {
    expect(schedulerJob).toBeInstanceOf(SchedulerJob);
    expect(schedulerJob.job).toEqual(testJob);
  });

  it('should get API object when no especified the `apis` paramenter on the job object', async () => {
    WazuhHostsCtrl.prototype.getHostsEntries.mockResolvedValue(oneApi)
    const apis: IApi[] = await schedulerJob.getApiObjects();

    expect(apis).not.toBeUndefined();
    expect(apis).not.toBeFalsy();
    expect(apis).toEqual(oneApi);
  });

  it('should get all API object when no especified the `apis` paramenter on the job object', async () => {
    WazuhHostsCtrl.prototype.getHostsEntries.mockResolvedValue(twoApi)
    const apis: IApi[] = await schedulerJob.getApiObjects();

    expect(apis).not.toBeUndefined();
    expect(apis).not.toBeFalsy();
    expect(apis).toEqual(twoApi);
  });

  it('should get all API object when no especified the `apis` paramenter on the job object', async () => {
    WazuhHostsCtrl.prototype.getHostsEntries.mockResolvedValue(twoApi)
    const apis: IApi[] = await schedulerJob.getApiObjects();

    expect(apis).not.toBeUndefined();
    expect(apis).not.toBeFalsy();
    expect(apis).toEqual(twoApi);
  });

  it('should get one of two API object when especified the id in `apis` paramenter on the job object', async () => {
    WazuhHostsCtrl.prototype.getHostsEntries.mockResolvedValue(twoApi)
    schedulerJob.job = {...testJob, apis: ['internal']}
    const apis: IApi[] = await schedulerJob.getApiObjects();
    const filteredTwoApi = twoApi.filter(item => item.id === 'internal')
    
    expect(apis).not.toBeUndefined();
    expect(apis).not.toBeFalsy();
    expect(apis).toEqual(filteredTwoApi);
  });

  it('should get one of three API object when especified the id in `apis` paramenter on the job object', async () => {
    WazuhHostsCtrl.prototype.getHostsEntries.mockResolvedValue(threeApi)
    const selectedApis = ['internal', 'external'];
    schedulerJob.job = {...testJob, apis: selectedApis}
    const apis: IApi[] = await schedulerJob.getApiObjects();
    const filteredThreeApi = threeApi.filter(item =>  selectedApis.includes(item.id))
    
    expect(apis).not.toBeUndefined();
    expect(apis).not.toBeFalsy();
    expect(apis).toEqual(filteredThreeApi);
  });

  it('should throw and exception when no get apis', async () => {
    WazuhHostsCtrl.prototype.getHostsEntries.mockResolvedValue([])
    await expect(schedulerJob.getApiObjects()).rejects.toThrow();
    await expect(schedulerJob.getApiObjects()).rejects.toThrowError(/10001/);
  });

  it('should throw and exception when filter by no exist api', async () => {
    WazuhHostsCtrl.prototype.getHostsEntries.mockResolvedValue(threeApi)
    schedulerJob.job = {...testJob, apis: ['unkown']}
    await expect(schedulerJob.getApiObjects()).rejects.toThrow();
    await expect(schedulerJob.getApiObjects()).rejects.toThrowError(/10002/);
  });

})