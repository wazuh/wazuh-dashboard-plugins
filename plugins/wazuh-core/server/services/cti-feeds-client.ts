import { Logger } from 'opensearch-dashboards/server';

const CONTENT_MANAGER_BASE_PATH = '/_plugins/_content_manager';

export class CTIFeedsClient {
  constructor(private logger: Logger) {
    this.logger.debug('CTI Feeds client initialized');
  }

  // Re-use this class to implement the get credentials, post subscriptions, etc.

  async updateCTIFeeds(context) {
    try {
      this.logger.debug('Triggering CTI feeds update in indexer');
      const response =
        await context.core.opensearch.client.asInternalUser.transport.request({
          method: 'POST',
          path: `${CONTENT_MANAGER_BASE_PATH}/update`,
        });
      return response.body;
    } catch (error) {
      this.logger.error(`Error updating CTI feeds: ${error.message}`);
      throw error;
    }
  }
}
