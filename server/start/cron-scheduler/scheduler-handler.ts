import { jobs, SchedulerJob } from './index';
import { configuredJobs } from './configured-jobs';
import { log } from '../../lib/logger';
import { getConfiguration } from '../../lib/get-configuration';
import cron from 'node-cron';
import { WAZUH_STATISTICS_TEMPLATE_NAME } from '../../../common/constants';
import { statisticsTemplate } from '../../integration-files/statistics-template';

const blueWazuh = '\u001b[34mwazuh\u001b[39m';
const schedulerErrorLogColors = [blueWazuh, 'scheduler', 'error'];
const schedulerJobs = [];

/**
* Wait until Kibana server is ready
*/
const checkKibanaStatus = async function (context) {
  try {
     log(
       'scheduler-handler:checkKibanaStatus',
       'Waiting for Kibana and Elasticsearch servers to be ready...',
       'debug'
     );
 
    await checkElasticsearchServer(context);
    await checkTemplate(context);
    return;
  } catch (error) {
     log(
       'scheduler-handler:checkKibanaStatus',
       error.mesage ||error
     );
     try{
       await delay(3000);
       await checkKibanaStatus(context);
     }catch(error){};
  }
 }
 
 
 /**
  * Check Elasticsearch Server status and Kibana index presence
  */
 const checkElasticsearchServer = async function (context) {
   try {
     const data = await context.core.elasticsearch.client.asInternalUser.indices.exists({
       index: context.server.config.kibana.index
     });
 
     return data.body;
   } catch (error) {
     log('scheduler-handler:checkElasticsearchServer', error.message || error);
     return Promise.reject(error);
   }
 }


 /**
 * Verify wazuh-agent template
 */
const checkTemplate = async function (context) {
  try {
    log(
      'scheduler-handler:checkTemplate',
      'Updating the monitoring template',
      'debug'
    );

    const appConfig = await getConfiguration();
    const templateName =  appConfig['cron.prefix'] && appConfig['cron.statistics.index.name'] 
      ? `${appConfig['cron.prefix']}-${appConfig['cron.statistics.index.name']}` 
      : WAZUH_STATISTICS_TEMPLATE_NAME;
    const pattern = `${templateName}-*`;

    try {
      // Check if the template already exists
      const currentTemplate = await context.core.elasticsearch.client.asInternalUser.indices.getTemplate({
        name: templateName
      });
      // Copy already created index patterns
      statisticsTemplate.index_patterns = currentTemplate.body[templateName].index_patterns;
    }catch (error) {
      // Init with the default index pattern
      statisticsTemplate.index_patterns = [pattern];
    }

    // Check if the user is using a custom pattern and add it to the template if it does
    if (!statisticsTemplate.index_patterns.includes(pattern)) {
      statisticsTemplate.index_patterns.push(pattern);
    };

    // Update the monitoring template
    await context.core.elasticsearch.client.asInternalUser.indices.putTemplate({
      name: templateName,
      body: statisticsTemplate
    });
    log(
      'scheduler-handler:checkTemplate',
      'Updated the monitoring template',
      'debug'
    );
  } catch (error) {
    const errorMessage = `Something went wrong updating the statistics template ${error.message || error}`;
    log(
      'scheduler-handler:checkTemplate',
      errorMessage
    );
    context.wazuh.logger.error(schedulerErrorLogColors, errorMessage);
    throw error;
  }
}

export async function jobSchedulerRun(context){
  // Check Kibana index and if it is prepared, start the initialization of Wazuh App.
  await checkKibanaStatus(context);
  for (const job in configuredJobs({})) {
    const schedulerJob: SchedulerJob = new SchedulerJob(job, context);
    schedulerJobs.push(schedulerJob);
    const task = cron.schedule(
      jobs[job].interval,
      () => schedulerJob.run(),
    );
  }
}