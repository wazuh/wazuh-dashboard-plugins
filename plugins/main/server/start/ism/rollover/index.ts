import { ILegacyCustomClusterClient } from '../../../src/core/server';
import { createOpenSearchClient } from './lib/create-opensearch-client';
import taskISMPolicy from './tasks/ism-policy';
import taskTemplate from './tasks/template';
import taskCreateRolloverIndices from './tasks/rollover-indices';

export async function jobISMRolloverRun(context) {
  // Check the indexManagementDashboards plugin is installed
  if (!context.plugins.indexManagementDashboards) {
    context.wazuh.logger.warn(
      'The indexManagementDashboards plugin is not installed. Skip task.',
    );
    // Skip task if indexManagementDashboards  application is not installed
    return;
  }

  try {
    // Get if the task is enabled
    let config = {
      'ism.rollover.enabled': context.wazuh.config.get('ism.rollover.enabled'),
    };
    context.wazuh.logger.debug(
      `Configuration of [ism.rollover.enabled]: ${config['ism.rollover.enabled']}`,
    );
    if (!config['ism.rollover.enabled']) {
      context.wazuh.logger.warn(
        'Roll over ISM policy task is disabled. Skip task.',
      );
      return;
    }

    // Create custom OpenSearch client to manage the ISM
    const opensearchClient: ILegacyCustomClusterClient = createOpenSearchClient(
      context.core.opensearch,
    );
    // Get the configuration
    config = {
      ...config,
      ...Object.fromEntries(
        [
          'ism.rollover.index_patterns',
          'ism.rollover.priority',
          'ism.rollover.min_doc_count',
          'ism.rollover.min_index_age',
          'ism.rollover.min_primary_shard_size',
          'ism.rollover.overwrite',
        ].map((settingKey: string) => {
          const value = context.wazuh.config.get(settingKey);
          context.wazuh.logger.debug(
            `Configuration of [${settingKey}]: [${value}]`,
          );
          return [settingKey, value];
        }),
      ),
    };

    // Set the roll over alias templates
    await taskTemplate(context, {
      opensearchClient,
      config,
    });

    // Set the ISM policy
    await taskISMPolicy(context, {
      opensearchClient,
      config,
    });

    await taskCreateRolloverIndices(context, {
      opensearchClient,
      config,
    });
  } catch (error) {
    context.wazuh.logger.error(error.message);
  }
}
