import { Logger } from 'opensearch-dashboards/server';

const CTI_BASE_URL ='/_plugins/content-manager'

export class CTIFeedsClient {
  constructor(
    private logger: Logger,
    private opensearchClient: any,
  ) {
    this.logger.debug('CTI Feeds client initialized');
  }

  async getCredentials() {
    try {
      this.logger.debug('Fetching CTI subscription credentials from indexer');
      const response = await this.opensearchClient.asInternalUser.transport.request({
        method: 'GET',
        path: `${CTI_BASE_URL}/subscription`,
      });
      return response.body;
    } catch (error) {
      this.logger.error(`Error retrieving CTI credentials: ${error.message}`);
      throw error;
    }
  }

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
