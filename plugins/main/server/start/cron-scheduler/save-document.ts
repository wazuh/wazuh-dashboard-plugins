import { BulkIndexDocumentsParams } from 'elasticsearch';
import { indexDate } from '../../lib/index-date';
import {
  WAZUH_STATISTICS_DEFAULT_INDICES_SHARDS,
  WAZUH_STATISTICS_DEFAULT_INDICES_REPLICAS,
} from '../../../common/constants';
import { tryCatchForIndexPermissionError } from '../tryCatchForIndexPermissionError';

export interface IIndexConfiguration {
  name: string;
  creation: 'h' | 'd' | 'w' | 'm';
  mapping?: string;
  shards?: number;
  replicas?: number;
}

export class SaveDocument {
  context: any;
  esClientInternalUser: any;

  constructor(context) {
    this.context = context;
    this.esClientInternalUser = context.core.opensearch.client.asInternalUser;
  }

  async save(doc: object[], indexConfig: IIndexConfiguration) {
    const { name, creation, mapping, shards, replicas } = indexConfig;
    const index = await this.addIndexPrefix(name);
    const indexCreation = `${index}-${indexDate(creation)}`;
    try {
      await this.checkIndexAndCreateIfNotExists(
        indexCreation,
        shards,
        replicas,
      );
      const createDocumentObject = this.createDocument(
        doc,
        indexCreation,
        mapping,
      );
      this.context.wazuh.logger.debug('Bulk data');
      const response = await this.esClientInternalUser.bulk(
        createDocumentObject,
      );
      this.context.wazuh.logger.debug(
        `Bulked data. Response of creating the new document ${JSON.stringify(
          response,
        )}`,
      );
    } catch (error) {
      if (error.status === 403) {
        throw {
          error: 403,
          message: `Authorization Exception in the index "${index}"`,
        };
      }
      if (error.status === 409) {
        throw { error: 409, message: `Duplicate index-pattern: ${index}` };
      }
      throw error;
    }
  }

  private async checkIndexAndCreateIfNotExists(index, shards, replicas) {
    try {
      await tryCatchForIndexPermissionError(index)(async () => {
        this.context.wazuh.logger.debug(
          `Checking the existence of ${index} index`,
        );
        const exists = await this.esClientInternalUser.indices.exists({
          index,
        });
        this.context.wazuh.logger.debug(
          `Index '${index}' exists? ${exists.body}`,
        );
        if (!exists.body) {
          this.context.wazuh.logger.debug(`Creating ${index} index`);
          await this.esClientInternalUser.indices.create({
            index,
            body: {
              settings: {
                index: {
                  number_of_shards:
                    shards ?? WAZUH_STATISTICS_DEFAULT_INDICES_SHARDS,
                  number_of_replicas:
                    replicas ?? WAZUH_STATISTICS_DEFAULT_INDICES_REPLICAS,
                },
              },
            },
          });
          this.context.wazuh.logger.info(`${index} index created`);
        }
      })();
    } catch (error) {
      this.checkDuplicateIndexError(error);
    }
  }

  private checkDuplicateIndexError(error: any) {
    if (
      !['resource_already_exists_exception'].includes(error?.body?.error?.type)
    ) {
      throw error;
    }
  }

  private createDocument(
    doc,
    index,
    mapping: string,
  ): BulkIndexDocumentsParams {
    const createDocumentObject: BulkIndexDocumentsParams = {
      index,
      body: doc
        .map(
          item =>
            `{"index": { "_index": "${index}" }}\n${JSON.stringify({
              ...this.buildData(item, mapping),
              timestamp: new Date(Date.now()).toISOString(),
            })}\n`,
        )
        .join(''),
    };
    this.context.wazuh.logger.debug(
      `Document object: ${JSON.stringify(createDocumentObject)}`,
    );
    return createDocumentObject;
  }

  buildData(item, mapping) {
    const getItemArray = (array, index) => {
      return JSON.stringify(array[index || 0]);
    };
    const getValue = (key: string, item) => {
      const keys = key.split('.');
      if (keys.length === 1) {
        if (key.match(/\[.*\]/)) {
          return getItemArray(
            item[key.replace(/\[.*\]/, '')],
            key.match(/\[(.*)\]/)[1],
          );
        }
        return JSON.stringify(item[key]);
      }
      return getValue(keys.slice(1).join('.'), item[keys[0]]);
    };
    if (mapping) {
      let data;
      data = mapping.replace(/\${([a-z|A-Z|0-9|\.\-\_\[.*\]]+)}/gi, (...key) =>
        getValue(key[1], item),
      );
      return JSON.parse(data);
    }

    if (typeof item.data === 'object') {
      return item.data;
    }
    return { data: item.data };
  }

  private async addIndexPrefix(index): string {
    const prefix = await this.context.wazuh_core.configuration.get(
      'cron.prefix',
    );
    return `${prefix}-${index}`;
  }
}
