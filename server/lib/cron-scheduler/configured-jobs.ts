import { jobs } from './index';
import { IApi } from './apiRequest';
import { IJob } from './predefined-jobs';

export const configuredJobs = (params:{jobName?:string, host?: IApi}) => {
  const { host, jobName } = params;
  return checkCluster(getJobs({jobName, host}))
}

const getJobs = (params:{jobName?:string, host?: IApi}) => {
  const { host, jobName } = params;
  if (!jobName) return {jobObj:jobs, host};
  return {jobObj:{[jobName]:jobs[jobName]}, host}
}

const checkCluster = (params: {jobObj:{[key:string]: IJob}, host?: IApi}) => {
  const {host} = params;
  const newJobObj = JSON.parse(JSON.stringify(params.jobObj));
  if(host && host.cluster_info.status === 'enabled'){
    ['manager-stats-remoted', 'manager-stats-analysisd'].forEach(item => {
      newJobObj[item] && (newJobObj[item].status = false);
    });
  } else if (host && host.cluster_info.status === 'disabled') {
    ['cluster-stats-remoted', 'cluster-stats-analysisd'].forEach(item => {
      newJobObj[item] && (newJobObj[item].status = false);
    })
  }
  return newJobObj;
}
