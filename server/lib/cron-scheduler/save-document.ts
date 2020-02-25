import {
  BulkIndexDocumentsParams,
} from 'elasticsearch';
import { getConfiguration } from '../get-configuration';
import { log } from '../../logger.js';
import { indexDate } from '../index-date.js';


export class SaveDocument {
  server: object;
  callWithRequest: Function
  callWithInternalUser: Function
  logPath = 'cron-scheduler|SaveDocument';

  constructor(server) {
    this.server = server;
    this.callWithRequest = server.plugins.elasticsearch.getCluster('data').callWithRequest;
    this.callWithInternalUser = server.plugins.elasticsearch.getCluster('data').callWithInternalUser;
  }

  async save(doc:object[], indexName, creation) {
    const index = this.addIndexPrefix(indexName);
    const indexCreation = `${index}-${indexDate(creation)}`;
    await this.checkIndexAndCreateIfNotExists(indexCreation);
    const createDocumentObject = this.createDocument(doc, indexCreation);
    const response = await this.callWithInternalUser('bulk', createDocumentObject);
    log(this.logPath, `Response of create new document ${JSON.stringify(response)}`, 'debug');
    await this.checkIndexPatternAndCreateIfNotExists(index);
  }

  private async checkIndexAndCreateIfNotExists(index) {
    const exists = await this.callWithInternalUser('indices.exists',{index});
    log(this.logPath, `Index '${index}' exists? ${exists}`, 'debug');
    if(!exists) {
      const response = await this.callWithInternalUser('indices.create', 
      {
        index, 
        body: {
          settings: {
            index: { 
              number_of_shards: 2,
              number_of_replicas: 0
            }
          }
        }
      });

      log(this.logPath, `Status of create a new index: ${JSON.stringify(response)}`, 'debug');
    }
  }

  private async checkIndexPatternAndCreateIfNotExists(index) {
    const KIBANA_INDEX = this.getKibanaIndex();
    log(this.logPath, `Internal index of kibana: ${KIBANA_INDEX}`, 'debug');
    const result = await this.callWithInternalUser('search', {
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
    const response = await this.callWithInternalUser('create', {
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
    log(
      this.logPath, 
      `The indexPattern no exist, response of createIndexPattern: ${JSON.stringify(response)}`, 
      'debug'
    );
  }

  private getKibanaIndex() {
    return ((((this.server || {})
    // @ts-ignore
      .registrations || {})
      .kibana || {})
      .options || {})
      .index || '.kibana';
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
    log(this.logPath, `Document object: ${JSON.stringify(createDocumentObject)}`, 'debug');
    return createDocumentObject;
  }

  private addIndexPrefix(index): string {
    const configFile = getConfiguration();
    const prefix = configFile['cron.prefix'] || 'wazuh';
    return `${prefix}-${index}`;
  }
    
}