import {
  Client,
  BulkIndexDocumentsParams,
} from 'elasticsearch';
import { date } from 'joi';

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

  async checkIndex(index):Promise<boolean> {
    const exists = await this.elasticClient.indices.exists({index});
    return exists
  }

  async save(doc:object[], index) {
    const indexExists = this.checkIndex(index);
    if(!indexExists) { 
      await this.elasticClient.indices.create({index});
    }
    const createDocumentObject = this.createDocument(doc, index);
    console.log(createDocumentObject);
    await this.elasticClient.bulk(
      createDocumentObject
    );
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

    
}