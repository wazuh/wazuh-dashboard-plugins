/*
 * Wazuh app - Class for the Elastic wrapper
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import knownFields from '../integration-files/known-fields';

export class ElasticWrapper {
  constructor(server) {
    this.elasticRequest = server.plugins.elasticsearch.getCluster('data');
    this.WZ_KIBANA_INDEX =
      server &&
      server.registrations &&
      server.registrations.kibana &&
      server.registrations.kibana.options &&
      server.registrations.kibana.options.index
        ? server.registrations.kibana.options.index
        : '.kibana';
  }

  /**
   * This function checks if an index pattern exists,
   * you should check response.hits.total
   * @param {*} id Eg: 'wazuh-alerts'
   */
  async searchIndexPatternById(id) {
    try {
      if (!id)
        return Promise.reject(
          new Error('No valid id for search index pattern')
        );

      const data = await this.elasticRequest.callWithInternalUser('search', {
        index: this.WZ_KIBANA_INDEX,
        type: 'doc',
        body: {
          query: {
            match: {
              _id: 'index-pattern:' + id
            }
          }
        }
      });

      return data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Search any index by name
   * @param {*} name
   */
  async searchIndexByName(name) {
    try {
      if (!name) return Promise.reject(new Error('No valid name given'));

      const data = await this.elasticRequest.callWithInternalUser('search', {
        index: name
      });

      return data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * This function creates a new index pattern.
   * @param {*} title Eg: 'wazuh-alerts-3.x-*'
   * @param {*} id Optional.
   */
  async createIndexPattern(title, id) {
    try {
      if (!title)
        return Promise.reject(
          new Error('No valid title for create index pattern')
        );

      const data = await this.elasticRequest.callWithInternalUser('create', {
        index: this.WZ_KIBANA_INDEX,
        type: 'doc',
        id: id ? id : 'index-pattern:' + title,
        body: {
          type: 'index-pattern',
          'index-pattern': {
            title: title,
            timeFieldName: '@timestamp'
          }
        }
      });

      return data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Special function to create the wazuh-monitoring index pattern,
   * do not use for any other creation, use the right function instead.
   * @param {*} title
   * @param {*} id
   */
  async createMonitoringIndexPattern(title, id) {
    try {
      if (!title)
        return Promise.reject(
          new Error('No valid title for create index pattern')
        );

      const data = await this.elasticRequest.callWithInternalUser('create', {
        index: this.WZ_KIBANA_INDEX,
        type: 'doc',
        id: id ? id : 'index-pattern:' + title,
        body: {
          type: 'index-pattern',
          'index-pattern': {
            fields:
              '[{"name":"@timestamp","type":"date","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"_id","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":false},{"name":"_index","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":false},{"name":"_score","type":"number","count":0,"scripted":false,"searchable":false,"aggregatable":false,"readFromDocValues":false},{"name":"_source","type":"_source","count":0,"scripted":false,"searchable":false,"aggregatable":false,"readFromDocValues":false},{"name":"_type","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":false},{"name":"dateAdd","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"dateAdd.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"group","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"group.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"host","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"id","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"ip","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"lastKeepAlive","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"lastKeepAlive.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"manager_host","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"manager_host.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"name","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"os.arch","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"os.arch.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"os.codename","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"os.codename.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"os.major","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"os.major.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"os.name","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"os.name.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"os.platform","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"os.platform.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"os.uname","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"os.uname.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"os.version","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"os.version.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"status","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"version","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"version.keyword","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true}]',
            title: title,
            timeFieldName: '@timestamp'
          }
        }
      });

      return data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Creates the .wazuh-version index with a custom configuration.
   * @param {*} config
   */
  async createWazuhVersionIndex(configuration) {
    try {
      if (!configuration)
        return Promise.reject(
          new Error('No valid configuration for create .wazuh-version index')
        );

      const data = await this.elasticRequest.callWithInternalUser(
        'indices.create',
        {
          index: '.wazuh-version',
          body: configuration
        }
      );

      return data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Creates the .wazuh index with a custom configuration.
   * @param {*} config
   */
  async createWazuhIndex(configuration) {
    try {
      if (!configuration)
        return Promise.reject(
          new Error('No valid configuration for create .wazuh index')
        );

      const data = await this.elasticRequest.callWithInternalUser(
        'indices.create',
        {
          index: '.wazuh',
          body: configuration
        }
      );

      return data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Inserts configuration on .wazuh-version index
   * @param {*} configuration
   */
  async insertWazuhVersionConfiguration(configuration) {
    try {
      if (!configuration)
        return Promise.reject(
          new Error('No valid configuration for create .wazuh-version index')
        );

      const data = await this.elasticRequest.callWithInternalUser('create', {
        index: '.wazuh-version',
        type: 'wazuh-version',
        id: 1,
        body: configuration
      });

      return data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Get all the index patterns
   */
  async getAllIndexPatterns() {
    try {
      const data = await this.elasticRequest.callWithInternalUser('search', {
        index: this.WZ_KIBANA_INDEX,
        type: 'doc',
        body: {
          query: {
            match: {
              type: 'index-pattern'
            }
          },
          size: 999
        }
      });

      return data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Updates index-pattern known fields
   * @param {*} patternId 'index-pattern:' + id
   */
  async updateIndexPatternKnownFields(id) {
    try {
      if (!id)
        return Promise.reject(
          new Error('No valid index pattern id for update index pattern')
        );

      const pattern = await this.getIndexPatternUsingGet(id);

      let currentFields = [];

      // If true, it's an existing index pattern, we need to review its known fields
      if (
        pattern &&
        pattern._source &&
        pattern._source['index-pattern'] &&
        pattern._source['index-pattern'].fields
      ) {
        currentFields = JSON.parse(pattern._source['index-pattern'].fields);

        if (Array.isArray(currentFields) && Array.isArray(knownFields)) {
          for (const field of knownFields) {
            // It has this field?
            const index = currentFields
              .map(item => item.name)
              .indexOf(field.name);

            if (index >= 0 && currentFields[index]) {
              // If field already exists, update its type
              currentFields[index].type = field.type;
            } else {
              // If field doesn't exist, add it
              currentFields.push(field);
            }
          }
        }
      } else {
        // It's a new index pattern, just add our known fields
        currentFields = knownFields;
      }

      // This array always must has items
      if (!currentFields || !currentFields.length) {
        return Promise.reject(
          new Error(
            `Something went wrong while updating known fields for index pattern ${id}`
          )
        );
      }

      let currentFieldsString = null;

      try {
        currentFieldsString = JSON.stringify(currentFields);
      } catch (error) {
        return Promise.reject(
          new Error(`Could not stringify known fields for index pattern ${id}`)
        );
      }

      // Updating known fields
      const data = await this.elasticRequest.callWithInternalUser('update', {
        index: this.WZ_KIBANA_INDEX,
        type: 'doc',
        id: id.includes('index-pattern:') ? id : 'index-pattern:' + id,
        body: {
          doc: {
            type: 'index-pattern',
            'index-pattern': {
              fields: currentFieldsString,
              fieldFormatMap:
                '{"data.virustotal.permalink":{"id":"url"},"data.vulnerability.reference":{"id":"url"},"data.url":{"id":"url"},"rule.id":{"id":"url","params":{"urlTemplate":"/app/wazuh#/manager/?tab=ruleset&ruleid={{value}}","labelTemplate":"{{value}}","openLinkInCurrentTab":true}}}'
            }
          }
        }
      });

      return data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Get the .wazuh-version index
   */
  async getWazuhVersionIndex() {
    try {
      const data = await this.elasticRequest.callWithInternalUser('get', {
        index: '.wazuh-version',
        type: 'wazuh-version',
        id: '1'
      });

      return data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Updates lastRestart field on .wazuh-version index
   * @param {*} version
   * @param {*} revision
   */
  async updateWazuhVersionIndexLastRestart(version, revision) {
    try {
      if (!version || !revision)
        return Promise.reject(new Error('No valid version or revision given'));

      const data = await this.elasticRequest.callWithInternalUser('update', {
        index: '.wazuh-version',
        type: 'wazuh-version',
        id: 1,
        body: {
          doc: {
            'app-version': version,
            revision: revision,
            lastRestart: new Date().toISOString() // Indice exists so we update the lastRestarted date only
          }
        }
      });

      return data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Get .wazuh-version index
   */
  async getWazuhVersionIndexAsSearch() {
    try {
      const data = await this.elasticRequest.callWithInternalUser('search', {
        index: '.wazuh-version',
        type: 'wazuh-version'
      });

      return data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   *
   * @param {*} payload
   */
  async searchWazuhAlertsWithPayload(payload) {
    try {
      if (!payload) return Promise.reject(new Error('No valid payload given'));
      const pattern = payload.pattern;
      delete payload.pattern;
      const fullPattern = await this.getIndexPatternUsingGet(pattern);

      const title =
        fullPattern &&
        fullPattern._source &&
        fullPattern._source['index-pattern'] &&
        fullPattern._source['index-pattern'].title
          ? fullPattern._source['index-pattern'].title
          : false;

      const data = await this.elasticRequest.callWithInternalUser('search', {
        index: title || 'wazuh-alerts-3.x-*',
        type: 'wazuh',
        body: payload
      });

      return data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Search for the Wazuh API configuration document using its own id (usually it's a timestamp)
   * @param {*} id Eg: 12396176723
   */
  async getWazuhConfigurationById(id) {
    try {
      if (!id) return Promise.reject(new Error('No valid document id given'));

      const data = await this.elasticRequest.callWithInternalUser('get', {
        index: '.wazuh',
        type: 'wazuh-configuration',
        id: id
      });

      return {
        user: data._source.api_user,
        password: Buffer.from(data._source.api_password, 'base64').toString(
          'ascii'
        ),
        url: data._source.url,
        port: data._source.api_port,
        insecure: data._source.insecure,
        cluster_info: data._source.cluster_info,
        extensions: data._source.extensions
      };
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Get the Wazuh API entries stored on .wazuh index
   */
  async getWazuhAPIEntries() {
    try {
      const data = await this.elasticRequest.callWithInternalUser('search', {
        index: '.wazuh',
        type: 'wazuh-configuration',
        size: '100'
      });

      return data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Usually used to save a new Wazuh API entry
   * @param {*} doc
   * @param {*} req
   */
  async createWazuhIndexDocument(req, doc) {
    try {
      if (!doc) return Promise.reject(new Error('No valid document given'));

      const data = await this.elasticRequest.callWithRequest(req, 'create', {
        index: '.wazuh',
        type: 'wazuh-configuration',
        id: new Date().getTime(),
        body: doc,
        refresh: true
      });

      return data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Updates the a document from the .wazuh index using id and doc content
   * @param {*} id
   * @param {*} doc
   */
  async updateWazuhIndexDocument(req, doc) {
    try {
      const id = typeof req === 'object' && req.payload ? req.payload.id : req;
      if (!id || !doc) throw new Error('No valid parameters given');

      const data = await this.elasticRequest.callWithRequest(req, 'update', {
        index: '.wazuh',
        type: 'wazuh-configuration',
        id: id,
        body: doc
      });

      return data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Search for active entries on .wazuh index
   * @param {*} req
   */
  async searchActiveDocumentsWazuhIndex(req) {
    try {
      if (!req) return Promise.reject(new Error('No valid request given'));

      const data = await this.elasticRequest.callWithRequest(req, 'search', {
        index: '.wazuh',
        type: 'wazuh-configuration',
        q: 'active:true'
      });

      return data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Delete a Wazuh API entry using incoming request
   * @param {*} req
   */
  async deleteWazuhAPIEntriesWithRequest(req) {
    try {
      if (!req.params || !req.params.id)
        return Promise.reject(new Error('No API id given'));

      const data = await this.elasticRequest.callWithRequest(req, 'delete', {
        index: '.wazuh',
        type: 'wazuh-configuration',
        id: req.params.id
      });

      return data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Same as curling the templates from Elasticsearch
   */
  async getTemplates() {
    try {
      const data = await this.elasticRequest.callWithInternalUser(
        'cat.templates',
        {}
      );

      return data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Same as curling the plugins from Elasticsearch
   */
  async getPlugins() {
    try {
      const data = await this.elasticRequest.callWithInternalUser(
        'cat.plugins',
        {}
      );
      const usingCredentials = await this.usingCredentials();

      return usingCredentials ? data : false;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async usingCredentials() {
    try {
      const data = await this.elasticRequest.callWithInternalUser(
        'cluster.getSettings',
        { includeDefaults: true }
      );

      return (
        data &&
        data.defaults &&
        data.defaults.xpack &&
        data.defaults.xpack.security &&
        data.defaults.xpack.security.enabled
      );
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Make a bulk request to update any index
   * @param {*} bulk
   */
  async pushBulkAnyIndex(index, bulk) {
    try {
      if (!bulk || !index)
        return Promise.reject(new Error('No valid parameters given given'));

      const data = await this.elasticRequest.callWithInternalUser('bulk', {
        index: index,
        type: 'agent',
        body: bulk
      });

      return data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Useful to search elements with "wazuh" as type giving an index as parameter
   * @param {*} req
   * @param {*} index
   */
  async searchWazuhElementsByIndexWithRequest(req, index) {
    try {
      if (!req || !index)
        return Promise.reject(new Error('No valid parameters given'));

      const data = await this.elasticRequest.callWithRequest(req, 'search', {
        index: index,
        type: 'wazuh'
      });

      return data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Check if an index exists
   * @param {*} index
   */
  async checkIfIndexExists(index) {
    try {
      if (!index) return Promise.reject(new Error('No valid index given'));

      const data = await this.elasticRequest.callWithInternalUser(
        'indices.exists',
        { index: index }
      );

      return data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Get a template by name
   * @param {*} name
   */
  async getTemplateByName(name) {
    try {
      if (!name) return Promise.reject(new Error('No valid name given'));

      const data = await this.elasticRequest.callWithInternalUser(
        'indices.getTemplate',
        { name: name }
      );

      return data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Creates the Kibana index with minimum content
   */
  async createEmptyKibanaIndex() {
    try {
      const data = await this.elasticRequest.callWithInternalUser(
        'indices.create',
        { index: this.WZ_KIBANA_INDEX }
      );

      return data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async createIndexByName(name, configuration = null) {
    try {
      if (!name) return Promise.reject(new Error('No valid name given'));

      const raw = {
        index: name,
        body: configuration
      };

      if (!configuration) delete raw.body;

      const data = await this.elasticRequest.callWithInternalUser(
        'indices.create',
        raw
      );

      return data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Deletes an Elasticsearch index by its name
   * @param {} name
   */
  async deleteIndexByName(name) {
    try {
      if (!name) return Promise.reject(new Error('No valid name given'));

      const data = await this.elasticRequest.callWithInternalUser(
        'indices.delete',
        { index: name }
      );

      return data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Deletes wazuh monitoring index pattern
   */
  async deleteMonitoring() {
    try {
      const data = await this.elasticRequest.callWithInternalUser('delete', {
        index: this.WZ_KIBANA_INDEX,
        type: 'doc',
        id: 'index-pattern:wazuh-monitoring-*'
      });

      return data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Get an index pattern by name and/or id
   * @param {*} id Could be id and/or title
   */
  async getIndexPatternUsingGet(id) {
    try {
      if (!id) return Promise.reject(new Error('No valid id given'));

      const data = await this.elasticRequest.callWithInternalUser('get', {
        index: this.WZ_KIBANA_INDEX,
        type: 'doc',
        id: id.includes('index-pattern:') ? id : 'index-pattern:' + id
      });

      return data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Inserts the wazuh-agent template
   * @param {*} template
   */
  async putMonitoringTemplate(template) {
    try {
      if (!template)
        return Promise.reject(new Error('No valid template given'));

      const data = await this.elasticRequest.callWithInternalUser(
        'indices.putTemplate',
        {
          name: 'wazuh-agent',
          body: template
        }
      );

      return data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Inserts the wazuh-kibana template.
   * Reindex purposes.
   * Do not use
   * @param {*} template
   */
  async putWazuhKibanaTemplate(template) {
    try {
      if (!template)
        return Promise.reject(new Error('No valid template given'));

      const data = await this.elasticRequest.callWithInternalUser(
        'indices.putTemplate',
        {
          name: 'wazuh-kibana',
          order: 0,
          create: true,
          body: template
        }
      );

      return data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Check for the wazuh-setup index, only old installations.
   * Reindex purposes
   * Do not use
   */
  async getOldWazuhSetup() {
    try {
      const data = await this.elasticRequest.callWithInternalUser('get', {
        index: '.wazuh',
        type: 'wazuh-setup',
        id: '1'
      });

      return data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Reindex purposes
   * Do not use
   * @param {*} configuration
   */
  async reindexWithCustomConfiguration(configuration) {
    try {
      if (!configuration)
        return Promise.reject(new Error('No valid configuration given'));

      const data = await this.elasticRequest.callWithInternalUser('reindex', {
        body: configuration
      });

      return data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Updates replicas and few other settings (if they are given) for specific index
   * @param {string} index Target index name
   * @param {object} configuration Settings to be updated
   */
  async updateIndexSettings(index, configuration) {
    try {
      if (!index) throw new Error('No valid index given');
      if (!configuration) throw new Error('No valid configuration given');

      // Number of shards is not dynamic so delete that setting if it's given
      if (
        configuration.settings &&
        configuration.settings.index &&
        configuration.settings.index.number_of_shards
      ) {
        delete configuration.settings.index.number_of_shards;
      }

      const data = await this.elasticRequest.callWithInternalUser(
        'indices.putSettings',
        {
          index: index,
          body: configuration
        }
      );

      return data;
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
