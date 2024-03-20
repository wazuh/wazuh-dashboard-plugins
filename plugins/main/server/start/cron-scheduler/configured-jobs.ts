import { jobs } from './index';
import { IApi } from './apiRequest';
import { IJob } from './predefined-jobs';

export const configuredJobs = async (
  context,
  params: {
    jobName?: string;
    host?: IApi;
  },
) => {
  const { host, jobName } = params;
  return checkCluster(
    await checkConfiguration(context, getJobs({ jobName, host })),
  );
};

const getJobs = (params: { jobName?: string; host?: IApi }) => {
  const { host, jobName } = params;
  if (!jobName) return { jobObj: jobs, host };
  return { jobObj: { [jobName]: jobs[jobName] }, host };
};

const checkCluster = (params: {
  jobObj: { [key: string]: IJob };
  host?: IApi;
}) => {
  const { host } = params;
  const newJobObj = JSON.parse(JSON.stringify(params.jobObj));
  if (host && host.cluster_info && host.cluster_info.status === 'enabled') {
    ['manager-stats-remoted', 'manager-stats-analysisd'].forEach(item => {
      newJobObj[item] && (newJobObj[item].status = false);
    });
  } else if (
    host &&
    host.cluster_info &&
    host.cluster_info.status === 'disabled'
  ) {
    ['cluster-stats-remoted', 'cluster-stats-analysisd'].forEach(item => {
      newJobObj[item] && (newJobObj[item].status = false);
    });
  } else if (host && !host.cluster_info) {
    Object.keys(newJobObj).forEach(key => (newJobObj[key].status = false));
  }
  return newJobObj;
};

const checkConfiguration = async (
  context,
  params: {
    jobObj: { [key: string]: IJob };
    host?: IApi;
  },
) => {
  const { jobObj, host } = params;
  const config = await context.wazuh_core.configuration.get();
  const cronSettigns = Object.keys(config).filter(checkSetting);
  cronSettigns.forEach(setting =>
    applySettings(setting, config[setting], jobObj),
  );
  return { jobObj, host };
};
const cronRegx = /cron.(?<task>statistics).((?<index>\w+)\.)?(?<config>\w+)$/;

const checkSetting = setting => cronRegx.test(setting);

const applySettings = (setting, value, jobObj: { [key: string]: IJob }) => {
  const { task, index, config } = cronRegx.exec(setting).groups;
  Object.keys(jobObj).forEach(key => {
    if (task === 'statistics') {
      applyStatisticSetting(jobObj[key], index, config, value);
    } else if (!key.includes(task)) {
      return;
    } else {
      applySetting(jobObj[key], index, config, value);
    }
  });
};

const applySetting = (job, index, config, value) => {
  if (index) {
    job[index][config] = value;
  } else {
    job[config] = value;
  }
};

const applyStatisticSetting = (job, index, config, value) => {
  if (index) {
    job[index][config] = value;
  } else {
    job[config] = value;
  }
};
