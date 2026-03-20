import { Logger } from 'opensearch-dashboards/server';

const CTI_BASE_URL ='/_plugins/content-manager'

export class CTIFeedsClient {
  constructor(private logger: Logger, private opensearchClient: any) {
    this.logger.debug('CTI Feeds client initialized');
  }

  // Re-use this class to implement the get credentials, post subscriptions, etc.

  async updateCTIFeeds() {
    try {
      this.logger.debug('Triggering CTI feeds update in indexer');
      const response =
        await this.opensearchClient.asInternalUser.transport.request({
          method: 'POST',
          path: `${CTI_BASE_URL}/update`,
        });
      return response.body;
    } catch (error) {
      this.logger.error(`Error updating CTI feeds: ${error.message}`);
      throw error;
    }
  }
}
