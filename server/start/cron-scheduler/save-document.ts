import { BulkIndexDocumentsParams } from 'elasticsearch';
import { getConfiguration } from '../../lib/get-configuration';
import { log } from '../../lib/logger';
import { indexDate } from '../../lib/index-date';
import { WAZUH_STATISTICS_DEFAULT_INDICES_SHARDS, WAZUH_STATISTICS_DEFAULT_INDICES_REPLICAS } from '../../../common/constants';
import { tryCatchForIndexPermissionError } from '../tryCatchForIndexPermissionError';

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
      await tryCatchForIndexPermissionError(index) (async() => {
        const exists = await this.esClientInternalUser.indices.exists({ index });
        log(this.logPath, `Index '${index}' exists? ${exists.body}`, 'debug');
        if (!exists.body) {
          const response = await this.esClientInternalUser.indices.create({
            index,
            body: {
              settings: {
                index: {
                  number_of_shards: shards ?? WAZUH_STATISTICS_DEFAULT_INDICES_SHARDS,
                  number_of_replicas: replicas ?? WAZUH_STATISTICS_DEFAULT_INDICES_REPLICAS
                }
              }
            }
          });
          log(this.logPath, `Status of create a new index: ${JSON.stringify(response)}`, 'debug');
        }
      })();
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
      body: doc.map(item => `{"index": { "_index": "${index}" }}\n${JSON.stringify({
        ...this.buildData(item, mapping),
        timestamp: new Date(Date.now()).toISOString()
      })}\n`)
      .join('')
    };
    log(this.logPath, `Document object: ${JSON.stringify(createDocumentObject)}`, 'debug');
    return createDocumentObject;
  }

  buildData(item, mapping) {
    const getItemArray = (array, index) => {
      return JSON.stringify(array[index || 0]);
    };
    const getValue = (key: string, item) => {
      const keys = key.split('.');
      if (keys.length === 1) {
        if(key.match(/\[.*\]/)){
          return getItemArray(
            item[key.replace(/\[.*\]/, '')], 
            key.match(/\[(.*)\]/)[1]
          );
        }
        return JSON.stringify(item[key]);
      }
      return getValue(keys.slice(1).join('.'), item[keys[0]])
    }
    if (mapping) {
      let data;
      data = mapping.replace(
        /\${([a-z|A-Z|0-9|\.\-\_\[.*\]]+)}/gi,
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