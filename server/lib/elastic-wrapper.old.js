/*
 * Wazuh app - Class for the Elastic wrapper
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { knownFields } from '../integration-files/known-fields';
import { monitoringKnownFields } from '../integration-files/monitoring-known-fields';
import { IndexPatternsFetcher } from '../../../../src/plugins/data/server/';
import { WAZUH_ALERTS_PATTERN, WAZUH_MONITORING_PATTERN } from '../../util/constants';

export class ElasticWrapper {
  constructor(server) {
    this.cachedCredentials = {};
    this._server = server;
    this.usingSearchGuard = ((server || {}).plugins || {}).searchguard || false;
    this.elasticRequest = server.plugins.elasticsearch.getCluster('data');
    this.WZ_KIBANA_INDEX =
      ((((server || {}).registrations || {}).kibana || {}).options || {})
        .index || '.kibana';
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
        type: '_doc',
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
   * @param {*} title Eg: 'wazuh-alerts-
   * @param {*} id Optional.
   */
  async createIndexPattern(title, id) {
    try {
      if (!title)
        return Promise.reject(
          new Error('No valid title for create index pattern')
        );
      return ; // Index pattern is now created when accessing the WUI

      const data = await this.elasticRequest.callWithInternalUser('create', {
        index: this.WZ_KIBANA_INDEX,
        type: '_doc',
        id: id ? id : 'index-pattern:' + title,
        body: {
          type: 'index-pattern',
          'index-pattern': {
            title: title,
            timeFieldName: 'timestamp'
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
  async createMonitoringIndexPattern(title, id, namespace = undefined) {
    try {
      if (!title)
        return Promise.reject(
          new Error('No valid title for create index pattern')
        );

      const data = await this.elasticRequest.callWithInternalUser('create', {
        index: this.WZ_KIBANA_INDEX,
        type: '_doc',
        id: id ? id : 'index-pattern:' + title,
        body: {
          type: 'index-pattern',
          'index-pattern': {
            fields:
              '[{"name":"timestamp","type":"date","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"_id","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":false},{"name":"_index","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":false},{"name":"_score","type":"number","count":0,"scripted":false,"searchable":false,"aggregatable":false,"readFromDocValues":false},{"name":"_source","type":"_source","count":0,"scripted":false,"searchable":false,"aggregatable":false,"readFromDocValues":false},{"name":"_type","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":false},{"name":"dateAdd","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"group","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"host","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"id","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"ip","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"lastKeepAlive","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"cluster.name","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"mergedSum","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"configSum","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"node_name","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"manager","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"manager_host","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"name","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"os.arch","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"os.codename","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"os.major","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"os.name","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"os.platform","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"os.uname","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"os.version","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false},{"name":"status","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true},{"name":"version","type":"string","count":0,"scripted":false,"searchable":true,"aggregatable":false,"readFromDocValues":false}]',
            title: title,
            timeFieldName: 'timestamp'
          },
          namespace
        }
      });

      return data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Delete .wazuh-version index if exists
   */
  async deleteWazuhVersionIndex() {
    try {
      const data = await this.elasticRequest.callWithInternalUser(
        'indices.delete',
        {
          index: '.wazuh-version'
        }
      );
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
        type: '_doc',
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

  addFormatMap(fields){
    const tmpFields = JSON.parse(fields);
    if(!tmpFields["data.virustotal.permalink"]){
      tmpFields["data.virustotal.permalink"] = {"id":"url"};
    }
    if(!tmpFields["data.vulnerability.reference"]){
      tmpFields["data.vulnerability.reference"] = {"id":"url"};
    }
    if(!tmpFields["data.url"]){
      tmpFields["data.url"] = {"id":"url"};
    }
    return tmpFields;
  }


  /**
   * Updates index-pattern known fields
   * @param {*} id 'index-pattern:' + id
   */
  async updateIndexPatternKnownFields(id) {
    try {
      if (!id)
        return Promise.reject(
          new Error('No valid index pattern id for update index pattern')
        );

      const pattern = await this.getIndexPatternUsingGet(id);

      let detectedFields = [];
      try {
        const patternTitle =
          (((pattern || {})._source || {})['index-pattern'] || {}).title || '';
        detectedFields = await this.discoverNewFields(patternTitle);
      } catch (error) {} // eslint-disable-line

      let currentFields = [];
      // If true, it's an existing index pattern, we need to review its known fields
      const { fields, fieldFormatMap } = ((pattern || {})._source || {})['index-pattern'] || {};
      if( !fields || !fieldFormatMap ) throw {message: " No index pattern found, open the interface to generate"}
      const currentFieldsFormatMap = this.addFormatMap(fieldFormatMap);
      if (fields) {
        currentFields = JSON.parse(fields);

        if (Array.isArray(currentFields) && Array.isArray(knownFields)) {
          currentFields = currentFields.filter(
            item =>
              item.name &&
              item.name !==
                'data.aws.service.action.networkConnectionAction.remoteIpDetails.geoLocation.lat' &&
              item.name !==
                'data.aws.service.action.networkConnectionAction.remoteIpDetails.geoLocation.lon'
          );
          this.mergeDetectedFields(knownFields, currentFields);
        }
      } else {
        // It's a new index pattern, just add our known fields
        currentFields = knownFields;
      }

      // Iterate over dynamic fields
      this.mergeDetectedFields(detectedFields, currentFields);

      // This array always must has items
      if (!currentFields || !currentFields.length) {
        return Promise.reject(
          new Error(
            `Something went wrong while updating known fields for index pattern ${id}`
          )
        );
      }

      let currentFieldsString = null;

      // Ensure '@timestamp' field is always excluded, >= 7.0.0 is using 'timestamp'
      try {
        const idx = currentFields.map(item => item.name).indexOf('@timestamp');
        if (idx > -1) {
          currentFields[idx].excluded = true;
        }
      } catch (error) {} // eslint-disable-line

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
        type: '_doc',
        id: id.includes('index-pattern:') ? id : 'index-pattern:' + id,
        body: {
          doc: {
            type: 'index-pattern',
            'index-pattern': {
              timeFieldName: 'timestamp',
              fields: currentFieldsString,
              fieldFormatMap: JSON.stringify(currentFieldsFormatMap) ,
              sourceFilters: '[{"value":"@timestamp"}]'
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
   * Updates wazuh-monitoring index-pattern known fields
   * @param {*} patternId 'index-pattern:' + id
   */
  async updateMonitoringIndexPatternKnownFields(id) {
    try {
      if (!id)
        return Promise.reject(
          new Error('No valid index pattern id for update index pattern')
        );

      let detectedFields = [];

      try {
        const patternTitle = id.split('index-pattern:')[1];
        detectedFields = await this.discoverNewFields(patternTitle);
      } catch (error) {} // eslint-disable-line

      const pattern = await this.getIndexPatternUsingGet(id);

      let currentFields = [];

      // If true, it's an existing index pattern, we need to review its known fields
      if ((((pattern || {})._source || {})['index-pattern'] || {}).fields) {
        currentFields = JSON.parse(pattern._source['index-pattern'].fields);

        if (
          Array.isArray(currentFields) &&
          Array.isArray(monitoringKnownFields)
        ) {
          this.mergeDetectedFields(monitoringKnownFields, currentFields);
        }
      } else {
        // It's a new index pattern, just add our known fields
        currentFields = monitoringKnownFields;
      }

      // Iterate over dynamic fields
      this.mergeDetectedFields(detectedFields, currentFields);

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
        type: '_doc',
        id: id.includes('index-pattern:') ? id : 'index-pattern:' + id,
        body: {
          doc: {
            type: 'index-pattern',
            'index-pattern': {
              fields: currentFieldsString,
              timeFieldName: 'timestamp'
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
   *
   * @param {*} payload
   */
  async searchWazuhAlertsWithPayload(payload, namespace) {
    try {
      if (!payload) return Promise.reject(new Error('No valid payload given'));
      const pattern = payload.pattern;
      delete payload.pattern;
      const fullPattern = await this.getIndexPatternUsingGet(
        pattern,
        namespace
      );

      const title =
        (((fullPattern || {})._source || {})['index-pattern'] || {}).title ||
        false;

      const data = await this.elasticRequest.callWithInternalUser('search', {
        index: title || WAZUH_ALERTS_PATTERN,
        type: '_doc',
        body: payload
      });

      return data;
    } catch (error) {
      return Promise.reject(error);
    }
  }

  async searchWazuhAlertsWithRequest(req, payload, namespace) {
    try {
      // TODO: Remember test with Kibana Spaces
      // if (!payload) return Promise.reject(new Error('No valid payload given'));
      // const pattern = payload.pattern;
      // delete payload.pattern;
      // const fullPattern = await this.getIndexPatternUsingGet(
      //   pattern,
      //   namespace
      // );

      // const title =
      //   (((fullPattern || {})._source || {})['index-pattern'] || {}).title ||
      //   false;

      const data = await this.elasticRequest.callWithRequest(req, 'search', payload);

      return data;
    } catch (error) {
      return Promise.reject(error);
    }
  }
  cleanCachedCredentials() {
    const now = new Date().getTime();
    for (const key in this.cachedCredentials) {
      if (now - this.cachedCredentials[key].fetched_at >= 2000)
        delete this.cachedCredentials[key];
    }
  }

  /**
   * Get the Wazuh API entries stored on .wazuh index
   */
  async getWazuhAPIEntries() {
    try {
      const data = await this.elasticRequest.callWithInternalUser('search', {
        index: '.wazuh',
        type: '_doc',
        size: '100'
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

  async usingCredentials() {
    try {
      const data = await this.elasticRequest.callWithInternalUser(
        'cluster.getSettings',
        { includeDefaults: true }
      );

      return (
        this.usingSearchGuard ||
        ((((data || {}).defaults || {}).xpack || {}).security || {}).user !=
          null
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
        type: '_doc',
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
        type: '_doc'
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
  async checkIfIndexExists(index, params = {}) {
    try {
      if (!index) return Promise.reject(new Error('No valid index given'));

      const data = await this.elasticRequest.callWithInternalUser(
        'indices.exists',
        { index: index, ...params }
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
      this.buildingKibanaIndex = true;
      const data = await this.elasticRequest.callWithInternalUser(
        'indices.create',
        { index: this.WZ_KIBANA_INDEX }
      );
      this.buildingKibanaIndex = false;
      return data;
    } catch (error) {
      this.buildingKibanaIndex = false;
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
        type: '_doc',
        id: `index-pattern:${WAZUH_MONITORING_PATTERN}`
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
  async getIndexPatternUsingGet(id, namespace) {
    try {
      if (!id) return Promise.reject(new Error('No valid id given'));
      let idQuery = id.includes('index-pattern:') ? id : 'index-pattern:' + id;
      if (namespace && namespace !== 'default') {
        idQuery = `${namespace}:${idQuery}`;
      }
      const data = await this.elasticRequest.callWithInternalUser('get', {
        index: this.WZ_KIBANA_INDEX,
        type: '_doc',
        id: idQuery
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
        (((configuration || {}).settings || {}).index || {}).number_of_shards
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

  /**
   * Fetch new fields found for certain index pattern.
   * It always return an array, even if there are no results (empty array).
   * @param {*} pattern Index pattern title
   */
  async discoverNewFields(pattern) {
    let detectedFields = [];
    try {
      const metaFields = ['_source', '_id', '_type', '_index', '_score'];
      const callCluster = this.elasticRequest.callWithInternalUser;
      const patternService = await new IndexPatternsFetcher(
        callCluster
      );

      detectedFields = await patternService.getFieldsForWildcard({
        pattern,
        metaFields
      });
    } catch (error) {} // eslint-disable-line

    if (!Array.isArray(detectedFields)) {
      detectedFields = [];
    }

    return detectedFields;
  }

  /**
   * Merge :detectedFields into :currentFields.
   * @param {*} detectedFields Source. Array of index pattern fields
   * @param {*} currentFields Target. Array of index pattern fields
   */
  mergeDetectedFields(detectedFields, currentFields) {
    if (Array.isArray(detectedFields) && Array.isArray(currentFields)) {
      // Iterate over dynamic fields
      for (const field of detectedFields) {
        // It has this field?
        const index = currentFields.map(item => item.name).indexOf(field.name);

        if (index >= 0 && currentFields[index]) {
          // If field already exists, update its type
          currentFields[index].type = field.type;
        } else {
          // If field doesn't exist, add it
          currentFields.push(field);
        }
      }
    }
  }

  /**
   * Get user roles
   */
  async getRoles(req, user) {
    const params = {
      path: `_security/user/${user}`,
      method: 'GET',
    };
    const result = await this.elasticRequest.callWithRequest(
      req,
      'transport.request',
      params
    );
    return ((result || {})[user] || {}).roles || []
  }
}
