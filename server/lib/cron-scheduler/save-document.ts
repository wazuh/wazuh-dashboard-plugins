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
    this.save([{foo:`bar-${Date.now()}`},], 'test-monitoring')
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

    const createDocumentObject: BulkIndexDocumentsParams = {
      index,
      type: '_doc',
      body: doc.flatMap(item => [{ index: { _index: index } }, item])
    }
    await this.elasticClient.bulk(
      createDocumentObject
    );
  }

    
}