import { BulkIndexDocumentsParams } from 'elasticsearch';
import { getConfiguration } from '../../lib/get-configuration';
import { log } from '../../lib/logger';
import { indexDate } from '../../lib/index-date';
import { WAZUH_INDEX_SHARDS, WAZUH_INDEX_REPLICAS } from '../../../common/constants'

export interface IIndexConfiguration {
  name: string
  creation: 'h' | 'd' | 'w' | 'm'
  mapping?: string
  shards?: number
  replicas?: number
}

export class SaveDocument {
  context: any;
  esClientInternalUser: any;
  logPath = 'cron-scheduler|SaveDocument';

  constructor(context) {
    this.context = context;
    this.esClientInternalUser = context.core.elasticsearch.client.asInternalUser;
  }

  async save(doc: object[], indexConfig: IIndexConfiguration) {
    const { name, creation, mapping, shards, replicas } = indexConfig;
    const index = this.addIndexPrefix(name);
    const indexCreation = `${index}-${indexDate(creation)}`;
    try {
      await this.checkIndexAndCreateIfNotExists(indexCreation, shards, replicas);
      const createDocumentObject = this.createDocument(doc, indexCreation, mapping);
      const response = await this.esClientInternalUser.bulk(createDocumentObject);
      log(this.logPath, `Response of create new document ${JSON.stringify(response)}`, 'debug');
      // await this.checkIndexPatternAndCreateIfNotExists(index);
    } catch (error) {
      if (error.status === 403)
        throw { error: 403, message: `Authorization Exception in the index "${index}"` }
      if (error.status === 409)
        throw { error: 409, message: `Duplicate index-pattern: ${index}` }
      throw error;
    }
  }

  private async checkIndexAndCreateIfNotExists(index, shards, replicas) {
    try {
      try{
        const exists = await this.esClientInternalUser.indices.exists({ index });
        log(this.logPath, `Index '${index}' exists? ${exists.body}`, 'debug');
      }catch(error){
        log(this.logPath, `Index '${index}' exists? false`, 'debug');
        const response = await this.esClientInternalUser.indices.create({
          index,
          body: {
            settings: {
              index: {
                number_of_shards: shards || WAZUH_INDEX_SHARDS,
                number_of_replicas: replicas || WAZUH_INDEX_REPLICAS
              }
            }
          }
        });
        
        log(this.logPath, `Status of create a new index: ${JSON.stringify(response)}`, 'debug');

      }
    } catch (error) {
      this.checkDuplicateIndexError(error);
    }
  }

  private checkDuplicateIndexError(error: any) {
    const { type } = ((error || {}).body || {}).error || {};
    if (!['resource_already_exists_exception'].includes(type))
      throw error;
  }

  private createDocument(doc, index, mapping: string): BulkIndexDocumentsParams {
    const createDocumentObject: BulkIndexDocumentsParams = {
      index,
      type: '_doc',
      body: doc.flatMap(item => [{
        index: { _index: index }
      },
      {
        ...this.buildData(item, mapping),
        timestamp: new Date(Date.now()).toISOString()
      }
      ])
    };
    log(this.logPath, `Document object: ${JSON.stringify(createDocumentObject)}`, 'debug');
    return createDocumentObject;
  }

  buildData(item, mapping) {
    const getValue = (key: string, item) => {
      const keys = key.split('.');
      if (keys.length === 1) {
        return JSON.stringify(item[key]);
      }
      return getValue(keys.slice(1).join('.'), item[keys[0]])
    }
    if (mapping) {
      const data = mapping.replace(
        /\${([a-z|A-Z|0-9|\.\-\_]+)}/gi,
        (...key) => getValue(key[1], item)
      )
      return JSON.parse(data);
    }
    if (typeof item.data === 'object') {
      return item.data;
    }
    return { data: item.data };
  }

  private addIndexPrefix(index): string {
    const configFile = getConfiguration();
    const prefix = configFile['cron.prefix'] || 'wazuh';
    return `${prefix}-${index}`;
  }

}