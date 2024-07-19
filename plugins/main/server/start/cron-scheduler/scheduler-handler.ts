import { jobs, SchedulerJob } from './index';
import { configuredJobs } from './configured-jobs';
import cron from 'node-cron';
import { WAZUH_STATISTICS_TEMPLATE_NAME } from '../../../common/constants';
import { statisticsTemplate } from '../../integration-files/statistics-template';
import { delayAsPromise } from '../../../common/utils';

const schedulerJobs = [];

/**
 * Wait until Kibana server is ready
 */
const checkPluginPlatformStatus = async function (context) {
  try {
    context.wazuh.logger.debug('Waiting for platform servers to be ready...');

    await checkElasticsearchServer(context);
    await checkTemplate(context);
    return;
  } catch (error) {
    context.wazuh.logger.warn(error.message || error);
    try {
      await delayAsPromise(3000);
      await checkPluginPlatformStatus(context);
    } catch (error) {}
  }
};

/**
 * Check Elasticsearch Server status and Kibana index presence
 */
const checkElasticsearchServer = async function (context) {
  context.wazuh.logger.debug(
    `Checking the existence of ${context.server.config.opensearchDashboards.index} index`,
  );
  const data =
    await context.core.opensearch.client.asInternalUser.indices.exists({
      index: context.server.config.opensearchDashboards.index,
    });

  return data.body;
};

/**
 * Verify wazuh-statistics template
 */
const checkTemplate = async function (context) {
  try {
    const appConfig = await context.wazuh_core.configuration.get();

    const prefixTemplateName = appConfig['cron.prefix'];
    const statisticsIndicesTemplateName =
      appConfig['cron.statistics.index.name'];
    const pattern = `${prefixTemplateName}-${statisticsIndicesTemplateName}-*`;

    try {
      // Check if the template already exists
      context.wazuh.logger.debug(
        `Getting the ${WAZUH_STATISTICS_TEMPLATE_NAME} template`,
      );
      const currentTemplate =
        await context.core.opensearch.client.asInternalUser.indices.getTemplate(
          {
            name: WAZUH_STATISTICS_TEMPLATE_NAME,
          },
        );
      // Copy already created index patterns
      statisticsTemplate.index_patterns =
        currentTemplate.body[WAZUH_STATISTICS_TEMPLATE_NAME].index_patterns;
    } catch (error) {
      // Init with the default index pattern
      statisticsTemplate.index_patterns = [pattern];
    }

    // Check if the user is using a custom pattern and add it to the template if it does
    if (!statisticsTemplate.index_patterns.includes(pattern)) {
      statisticsTemplate.index_patterns.push(pattern);
    }

    // Update the statistics template
    context.wazuh.logger.debug(
      `Updating the ${WAZUH_STATISTICS_TEMPLATE_NAME} template`,
    );
    await context.core.opensearch.client.asInternalUser.indices.putTemplate({
      name: WAZUH_STATISTICS_TEMPLATE_NAME,
      body: statisticsTemplate,
    });
    context.wazuh.logger.info(
      `Updated the ${WAZUH_STATISTICS_TEMPLATE_NAME} template`,
    );
  } catch (error) {
    context.wazuh.logger.error(
      `Something went wrong updating the ${WAZUH_STATISTICS_TEMPLATE_NAME} template ${
        error.message || error
      }`,
    );
    throw error;
  }
};

export async function jobSchedulerRun(context) {
  // Check Kibana index and if it is prepared, start the initialization of Wazuh App.
  await checkPluginPlatformStatus(context);
  const jobs = await configuredJobs(context, {});
  for (const job in jobs) {
    const schedulerJob: SchedulerJob = new SchedulerJob(job, context);
    schedulerJobs.push(schedulerJob);
    const task = cron.schedule(jobs[job].interval, () => schedulerJob.run());
  }
}
