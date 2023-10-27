import { jobISMRolloverRun } from './index';

describe('Task:Roll over Index State Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    [
      'The indexManagementDashboards plugin is not installed. The job is skipped.',
      {
        config: {
          'ism.rollover.enabled': true,
          'ism.rollover.index_patterns': [
            'wazuh-alerts-*',
            'wazuh-archives-*',
            '-wazuh-alerts-4.x-sample*',
          ],
          'ism.rollover.min_index_age': '45d',
          'ism.rollover.min_primary_shard_size': 30,
          'ism.rollover.min_doc_count': 250000000,
          'ism.rollover.overwrite': true,
          'ism.rollover.priority': 10,
        },
        plugins: {},
      },
    ],
    [
      'The indexManagementDashboards plugin is installed. The job is disabled and skipped.',
      {
        config: {
          'ism.rollover.enabled': false,
          'ism.rollover.index_patterns': [
            'wazuh-alerts-*',
            'wazuh-archives-*',
            '-wazuh-alerts-4.x-sample*',
          ],
          'ism.rollover.min_index_age': '45d',
          'ism.rollover.min_primary_shard_size': 30,
          'ism.rollover.min_doc_count': 250000000,
          'ism.rollover.overwrite': true,
          'ism.rollover.priority': 10,
        },
        plugins: {
          indexManagementDashboards: {},
        },
      },
    ],
  ])('%s', async (title, { config, plugins }) => {
    // Mock context
    const context = {
      wazuh: {
        logger: {
          debug: jest.fn(),
          info: jest.fn(),
          warn: jest.fn(),
          error: jest.fn(),
        },
        config: {
          get: (key: string) => config[key],
        },
      },
      core: {},
      plugins: plugins,
      job: {},
    };

    await jobISMRolloverRun(context);
    if (!plugins.indexManagementDashboards) {
      expect(context.wazuh.logger.warn).toHaveBeenCalledWith(
        'The indexManagementDashboards plugin is not installed. Skip task.',
      );
    } else {
      if (!config['ism.rollover.enabled']) {
        expect(context.wazuh.logger.warn).toHaveBeenCalledWith(
          'Roll over ISM policy task is disabled. Skip task.',
        );
      }
    }
  });
});
