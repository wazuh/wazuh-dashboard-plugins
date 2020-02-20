import {
  Client,
  BulkIndexDocumentsParams,
} from 'elasticsearch';
import { getConfiguration } from '../get-configuration';


export class SaveDocument {
  server: object;
  elasticClient: Client
  callWithRequest: Function
  callWithInternalUser: Function

  constructor(server) {
    this.server = server;
    this.elasticClient = server.plugins.elasticsearch.getCluster('data').clusterClient.client;
    this.callWithRequest = server.plugins.elasticsearch.getCluster('data').callWithRequest;
    this.callWithInternalUser = server.plugins.elasticsearch.getCluster('data').callWithInternalUser;
  }



  private async checkIndexAndCreateIfNotExists(index) {
    const exists = await this.elasticClient.indices.exists({index});
    if(!exists) { 
      await this.elasticClient.indices.create({index});
    }
  }

  private async checkIndexPatternAndCreateIfNotExists(index) {
    const KIBANA_INDEX = this.getKibanaIndex();
    const result = await this.elasticClient.search({
      index: KIBANA_INDEX,
      type: '_doc',
      body: {
        query: {
          match: {
            _id: `index-pattern:${index}*`
          }
        }
      }
    });
    if (result.hits.total.value === 0) {
      await this.createIndexPattern(KIBANA_INDEX, index);
    }
  }

  private async createIndexPattern(KIBANA_INDEX: any, index: any) {
    await this.elasticClient.create({
      index: KIBANA_INDEX,
      type: '_doc',
      'id': `index-pattern:${index}*`,
      body: {
        type: 'index-pattern',
        'index-pattern': {
          title: `${index}*`,
          timeFieldName: 'timestamp',
        }
      }
    });
  }

  private getKibanaIndex() {
    return ((((this.server || {})
      .registrations || {})
      .kibana || {})
      .options || {})
      .index || '.kibana';
  }

  async save(doc:object[], indexName) {
    const index = this.addIndexPrefix(indexName)
    await this.checkIndexAndCreateIfNotExists(index);
    const createDocumentObject = this.createDocument(doc, index);
    await this.elasticClient.bulk(
      createDocumentObject
    );
    await this.checkIndexPatternAndCreateIfNotExists(index);
  }

  private createDocument (doc, index): BulkIndexDocumentsParams {
    const createDocumentObject: BulkIndexDocumentsParams = {
      index,
      type: '_doc',
      body: doc.flatMap(item => [{ 
        index: { _index: index } },
        {
          ...(typeof item.data === 'object')
          ? item.data
          : {data: item.data},
          timestamp: new Date(Date.now()).toISOString()}
      ])
    };
    return createDocumentObject;
  }

  private addIndexPrefix(index): string {
    const configFile = getConfiguration();
    const prefix = configFile['cron.prefix'] || 'wazuh';
    return `${prefix}-${index}`;
  }
    
}