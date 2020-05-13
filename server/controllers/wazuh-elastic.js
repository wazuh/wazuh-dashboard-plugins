/*
 * Wazuh app - Class for Wazuh-Elastic functions
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { ElasticWrapper } from '../lib/elastic-wrapper';
import { ErrorResponse } from './error-response';
import { log } from '../logger';
import { getConfiguration } from '../lib/get-configuration';
import {
  AgentsVisualizations,
  OverviewVisualizations,
  ClusterVisualizations
} from '../integration-files/visualizations';

import { Base } from '../reporting/base-query';
import { checkKnownFields } from '../lib/refresh-known-fields';
import { generateAlerts } from '../lib/generate-alerts/generate-alerts-script';

export class WazuhElasticCtrl {
  /**
   * Constructor
   * @param {*} server
   */
  constructor(server) {
    this._server = server;
    this.wzWrapper = new ElasticWrapper(server);
    this.wzSampleAlertsCaterories = {
      'security': [{ syscheck: true }, { aws: true }, { gcp: true }, { authentication: true }, { ssh: true }, { apache: true, alerts: 2000 }, { web: true }, { windows: { service_control_manager: true}, alerts: 1000}],
      'auditing-policy-monitoring': [{ rootcheck: true }, { audit: true }, { openscap: true }, { ciscat: true }],
      'threat-detection': [{ vulnerabilities: true }, { virustotal: true }, { osquery: true }, { docker: true }, { mitre: true }]
    };
    this.wzSampleAlertsIndexPrefix = 'wazuh-alerts-3.x-';
    this.buildSampleIndexByCategory = (category) => `${this.wzSampleAlertsIndexPrefix}sample-${category}` // wazuh-alerts-3.x-sample-security, wazuh-alerts-3.x-sample-auditing-policy-monitoring, wazuh-alerts-3.x-threat-detection
    this.defaultNumSampleAlerts = 3000;
  }

  /**
   * This retrieve a template from Elasticsearch
   * @param {Object} req
   * @param {Object} reply
   * @returns {Object} template or ErrorResponse
   */
  async getTemplate(req, reply) {
    try {
      if (!req.params || !req.params.pattern) {
        throw new Error(
          'An index pattern is needed for checking the Elasticsearch template existance'
        );
      }

      const data = await this.wzWrapper.getTemplates();

      if (!data || typeof data !== 'string') {
        throw new Error(
          'An unknown error occurred when fetching templates from Elasticseach'
        );
      }

      const lastChar = req.params.pattern[req.params.pattern.length - 1];

      // Split into separate patterns
      const tmpdata = data.match(/\[.*\]/g);
      const tmparray = [];
      for (let item of tmpdata) {
        // A template might use more than one pattern
        if (item.includes(',')) {
          item = item.substr(1).slice(0, -1);
          const subItems = item.split(',');
          for (const subitem of subItems) {
            tmparray.push(`[${subitem.trim()}]`);
          }
        } else {
          tmparray.push(item);
        }
      }

      // Ensure we are handling just patterns
      const array = tmparray.filter(
        item => item.includes('[') && item.includes(']')
      );

      const pattern =
        lastChar === '*' ? req.params.pattern.slice(0, -1) : req.params.pattern;
      const isIncluded = array.filter(item => {
        item = item.slice(1, -1);
        const lastChar = item[item.length - 1];
        item = lastChar === '*' ? item.slice(0, -1) : item;
        return item.includes(pattern) || pattern.includes(item);
      });
      log(
        'wazuh-elastic:getTemplate',
        `Template is valid: ${
          isIncluded && Array.isArray(isIncluded) && isIncluded.length
            ? 'yes'
            : 'no'
        }`,
        'debug'
      );
      return isIncluded && Array.isArray(isIncluded) && isIncluded.length
        ? {
            statusCode: 200,
            status: true,
            data: `Template found for ${req.params.pattern}`
          }
        : {
            statusCode: 200,
            status: false,
            data: `No template found for ${req.params.pattern}`
          };
    } catch (error) {
      log('wazuh-elastic:getTemplate', error.message || error);
      return ErrorResponse(
        `Could not retrieve templates from Elasticsearch due to ${error.message ||
          error}`,
        4002,
        500,
        reply
      );
    }
  }

  /**
   * This check index-pattern
   * @param {Object} req
   * @param {Object} reply
   * @returns {Object} status obj or ErrorResponse
   */
  async checkPattern(req, reply) {
    try {
      const response = await this.wzWrapper.getAllIndexPatterns();

      const filtered = response.hits.hits.filter(
        item => item._source['index-pattern'].title === req.params.pattern
      );
      log(
        'wazuh-elastic:checkPattern',
        `Index pattern found: ${filtered.length >= 1 ? 'yes' : 'no'}`,
        'debug'
      );
      return filtered.length >= 1
        ? { statusCode: 200, status: true, data: 'Index pattern found' }
        : {
            statusCode: 500,
            status: false,
            error: 10020,
            message: 'Index pattern not found'
          };
    } catch (error) {
      log('wazuh-elastic:checkPattern', error.message || error);
      return ErrorResponse(
        `Something went wrong retrieving index-patterns from Elasticsearch due to ${error.message ||
          error}`,
        4003,
        500,
        reply
      );
    }
  }

  /**
   * This get the fields keys
   * @param {Object} req
   * @param {Object} reply
   * @returns {Array<Object>} fields or ErrorResponse
   */
  async getFieldTop(req, reply) {
    try {
      // Top field payload
      let payload = {
        size: 1,
        query: {
          bool: {
            must: [],
            must_not: {
              term: {
                'agent.id': '000'
              }
            },
            filter: { range: { timestamp: {} } }
          }
        },
        aggs: {
          '2': {
            terms: {
              field: '',
              size: 1,
              order: { _count: 'desc' }
            }
          }
        }
      };

      // Set up time interval, default to Last 24h
      const timeGTE = 'now-1d';
      const timeLT = 'now';
      payload.query.bool.filter.range['timestamp']['gte'] = timeGTE;
      payload.query.bool.filter.range['timestamp']['lt'] = timeLT;

      // Set up match for default cluster name
      payload.query.bool.must.push(
        req.params.mode === 'cluster'
          ? { match: { 'cluster.name': req.params.cluster } }
          : { match: { 'manager.name': req.params.cluster } }
      );

      payload.aggs['2'].terms.field = req.params.field;
      payload.pattern = req.params.pattern;
      const spaces = this._server.plugins.spaces;
      const namespace = spaces && spaces.getSpaceId(req);
      const data = await this.wzWrapper.searchWazuhAlertsWithPayload(
        payload,
        namespace
      );

      return data.hits.total.value === 0 ||
        typeof data.aggregations['2'].buckets[0] === 'undefined'
        ? { statusCode: 200, data: '' }
        : {
            statusCode: 200,
            data: data.aggregations['2'].buckets[0].key
          };
    } catch (error) {
      log('wazuh-elastic:getFieldTop', error.message || error);
      return ErrorResponse(error.message || error, 4004, 500, reply);
    }
  }

  /**
   * This get the elastic setup settings
   * @param {Object} req
   * @param {Object} reply
   * @returns {Object} setup info or ErrorResponse
   */
  async getSetupInfo(req, reply) {
    try {
      const data = await this.wzWrapper.getWazuhVersionIndexAsSearch();

      return data.hits.total.value === 0
        ? { statusCode: 200, data: '' }
        : { statusCode: 200, data: data.hits.hits[0]._source };
    } catch (error) {
      log('wazuh-elastic:getSetupInfo', error.message || error);
      return ErrorResponse(
        `Could not get data from elasticsearch due to ${error.message ||
          error}`,
        4005,
        500,
        reply
      );
    }
  }

  /**
   * Checks one by one if the requesting user has enough privileges to use
   * an index pattern from the list.
   * @param {Array<Object>} list List of index patterns
   * @param {Object} req
   * @returns {Array<Object>} List of allowed index
   */
  async filterAllowedIndexPatternList(list, req) {
    let finalList = [];
    for (let item of list) {
      let results = false,
        forbidden = false;
      try {
        results = await this.wzWrapper.searchWazuhElementsByIndexWithRequest(
          req,
          item.title
        );
      } catch (error) {
        forbidden = true;
      }
      if (
        ((results || {}).hits || {}).total.value >= 1 ||
        (!forbidden && ((results || {}).hits || {}).total === 0)
      ) {
        finalList.push(item);
      }
    }
    return finalList;
  }

  /**
   * Checks for minimum index pattern fields in a list of index patterns.
   * @param {Array<Object>} indexPatternList List of index patterns
   */
  validateIndexPattern(indexPatternList) {
    const minimum = ['timestamp', 'rule.groups', 'manager.name', 'agent.id'];
    let list = [];
    for (const index of indexPatternList) {
      let valid, parsed;
      try {
        parsed = JSON.parse(index._source['index-pattern'].fields);
      } catch (error) {
        continue;
      }

      valid = parsed.filter(item => minimum.includes(item.name));
      if (valid.length === 4) {
        list.push({
          id: index._id.split('index-pattern:')[1],
          title: index._source['index-pattern'].title
        });
      }
    }
    return list;
  }

  /**
   * This get the current space
   * @param {Object} req
   * @param {Object} reply
   * @returns {String} current namespace
   */
  async getCurrentSpace(req, reply) {
    try {
      const spaces = this._server.plugins.spaces;
      const namespace = spaces && spaces.getSpaceId(req);
      return { namespace };
    } catch (err) {
      log('wazuh-elastic:getCurrentSpace', error.message || error);
      return ErrorResponse(error.message || error, 4011, 500, reply);
    }
  }

  /**
   * This get the list of index-patterns
   * @param {Object} req
   * @param {Object} reply
   * @returns {Array<Object>} list of index-patterns or ErrorResponse
   */
  async getlist(req, reply) {
    try {
      const spaces = this._server.plugins.spaces;
      const namespace = spaces && spaces.getSpaceId(req);

      const config = getConfiguration();

      const usingCredentials = await this.wzWrapper.usingCredentials();

      const isXpackEnabled =
        typeof XPACK_RBAC_ENABLED !== 'undefined' &&
        XPACK_RBAC_ENABLED &&
        usingCredentials;

      const isSuperUser =
        isXpackEnabled &&
        req.auth &&
        req.auth.credentials &&
        req.auth.credentials.roles &&
        req.auth.credentials.roles.includes('superuser');

      const data = await this.wzWrapper.getAllIndexPatterns();

      // Default namespace index patterns have no prefix.
      // If it's a custom namespace, then filter by its name.
      if (namespace) {
        data.hits.hits = data.hits.hits.filter(item =>
          namespace !== 'default'
            ? (item._id || '').includes(namespace)
            : (item._id || '').startsWith('index-pattern:')
        );
      }

      if ((((data || {}).hits || {}).hits || []).length === 0) {
        throw new Error('There are no index patterns');
      }

      if (((data || {}).hits || {}).hits) {
        let list = this.validateIndexPattern(data.hits.hits);
        if (
          config &&
          config['ip.ignore'] &&
          Array.isArray(config['ip.ignore']) &&
          config['ip.ignore'].length
        ) {
          list = list.filter(
            item =>
              item && item.title && !config['ip.ignore'].includes(item.title)
          );
        }

        return {
          data:
            isXpackEnabled && !isSuperUser
              ? await this.filterAllowedIndexPatternList(list, req)
              : list
        };
      }

      throw new Error(
        "The Elasticsearch request didn't fetch the expected data"
      );
    } catch (error) {
      log('wazuh-elastic:getList', error.message || error);
      return ErrorResponse(error.message || error, 4006, 500, reply);
    }
  }

  async checkCustomSpaceMonitoring(namespace, monitoringPattern) {
    try {
      const patterns = await this.wzWrapper.getAllIndexPatterns();
      const exists = patterns.hits.hits.filter(
        item =>
          item._source['index-pattern'].title === monitoringPattern &&
          item._source.namespace === namespace
      );
      if (!exists.length) {
        const title = monitoringPattern;
        const id = `${namespace}:index-pattern:${monitoringPattern}`;
        await this.wzWrapper.createMonitoringIndexPattern(title, id, namespace);
        return id;
      } else {
        return exists[0]._id;
      }
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Replaces visualizations main fields to fit a certain pattern.
   * @param {Array<Object>} app_objects Object containing raw visualizations.
   * @param {String} id Index-pattern id to use in the visualizations. Eg: 'wazuh-alerts'
   */
  async buildVisualizationsRaw(app_objects, id, namespace = false) {
    try {
      const config = getConfiguration();
      let monitoringPattern =
        (config || {})['wazuh.monitoring.pattern'] || 'wazuh-monitoring-3.x-*';
      log(
        'wazuh-elastic:buildVisualizationsRaw',
        `Building ${app_objects.length} visualizations`,
        'debug'
      );
      log(
        'wazuh-elastic:buildVisualizationsRaw',
        `Index pattern ID: ${id}`,
        'debug'
      );
      const visArray = [];
      let aux_source, bulk_content;
      for (let element of app_objects) {
        aux_source = JSON.parse(JSON.stringify(element._source));

        // Replace index-pattern for visualizations
        if (
          aux_source &&
          aux_source.kibanaSavedObjectMeta &&
          aux_source.kibanaSavedObjectMeta.searchSourceJSON &&
          typeof aux_source.kibanaSavedObjectMeta.searchSourceJSON === 'string'
        ) {
          const defaultStr = aux_source.kibanaSavedObjectMeta.searchSourceJSON;

          const isMonitoring = defaultStr.includes('wazuh-monitoring');
          if (isMonitoring) {
            if (namespace && namespace !== 'default') {
              monitoringPattern = await this.checkCustomSpaceMonitoring(
                namespace,
                monitoringPattern
              );
              if (
                monitoringPattern.includes(namespace) &&
                monitoringPattern.includes('index-pattern:')
              ) {
                monitoringPattern = monitoringPattern.split(
                  'index-pattern:'
                )[1];
              }
            }
            aux_source.kibanaSavedObjectMeta.searchSourceJSON = defaultStr.replace(
              /wazuh-monitoring/g,
              monitoringPattern[monitoringPattern.length - 1] === '*' ||
                (namespace && namespace !== 'default')
                ? monitoringPattern
                : monitoringPattern + '*'
            );
          } else {
            aux_source.kibanaSavedObjectMeta.searchSourceJSON = defaultStr.replace(
              /wazuh-alerts/g,
              id
            );
          }
        }

        // Replace index-pattern for selector visualizations
        if (typeof (aux_source || {}).visState === 'string') {
          aux_source.visState = aux_source.visState.replace(
            /wazuh-alerts/g,
            id
          );
        }

        // Bulk source
        bulk_content = {};
        bulk_content[element._type] = aux_source;

        visArray.push({
          attributes: bulk_content.visualization,
          type: element._type,
          id: element._id,
          _version: bulk_content.visualization.version
        });
      }
      return visArray;
    } catch (error) {
      log('wazuh-elastic:buildVisualizationsRaw', error.message || error);
      return Promise.reject(error);
    }
  }

  /**
   * Replaces cluster visualizations main fields.
   * @param {Array<Object>} app_objects Object containing raw visualizations.
   * @param {String} id Index-pattern id to use in the visualizations. Eg: 'wazuh-alerts'
   * @param {Array<String>} nodes Array of node names. Eg: ['node01', 'node02']
   * @param {String} name Cluster name. Eg: 'wazuh'
   * @param {String} master_node Master node name. Eg: 'node01'
   */
  buildClusterVisualizationsRaw(
    app_objects,
    id,
    nodes = [],
    name,
    master_node,
    pattern_name = '*'
  ) {
    try {
      const visArray = [];
      let aux_source, bulk_content;

      for (const element of app_objects) {
        // Stringify and replace index-pattern for visualizations
        aux_source = JSON.stringify(element._source);
        aux_source = aux_source.replace(/wazuh-alerts/g, id);
        aux_source = JSON.parse(aux_source);

        // Bulk source
        bulk_content = {};
        bulk_content[element._type] = aux_source;

        const visState = JSON.parse(bulk_content.visualization.visState);
        const title = visState.title;

        if (visState.type && visState.type === 'timelion') {
          let query = '';
          if (title === 'Wazuh App Cluster Overview') {
            for (const node of nodes) {
              query += `.es(index=${pattern_name},q="cluster.name: ${name} AND cluster.node: ${node.name}").label("${node.name}"),`;
            }
            query = query.substring(0, query.length - 1);
          } else if (title === 'Wazuh App Cluster Overview Manager') {
            query += `.es(index=${pattern_name},q="cluster.name: ${name}").label("${name} cluster")`;
          }

          visState.params.expression = query;
          bulk_content.visualization.visState = JSON.stringify(visState);
        }

        visArray.push({
          attributes: bulk_content.visualization,
          type: element._type,
          id: element._id,
          _version: bulk_content.visualization.version
        });
      }

      return visArray;
    } catch (error) {
      log(
        'wazuh-elastic:buildClusterVisualizationsRaw',
        error.message || error
      );
      return Promise.reject(error);
    }
  }

  /**
   * This creates a visualization of data in req
   * @param {Object} req
   * @param {Object} reply
   * @returns {Object} vis obj or ErrorResponse
   */
  async createVis(req, reply) {
    try {
      if (
        !req.params.pattern ||
        !req.params.tab ||
        (req.params.tab &&
          !req.params.tab.includes('overview-') &&
          !req.params.tab.includes('agents-'))
      ) {
        throw new Error('Missing parameters creating visualizations');
      }

      const tabPrefix = req.params.tab.includes('overview')
        ? 'overview'
        : 'agents';

      const tabSplit = req.params.tab.split('-');
      const tabSufix = tabSplit[1];

      const file =
        tabPrefix === 'overview'
          ? OverviewVisualizations[tabSufix]
          : AgentsVisualizations[tabSufix];
      log('wazuh-elastic:createVis', `${tabPrefix}[${tabSufix}]`, 'debug');
      log(
        'wazuh-elastic:createVis',
        `Index pattern: ${req.params.pattern}`,
        'debug'
      );
      const spaces = this._server.plugins.spaces;
      const namespace = spaces && spaces.getSpaceId(req);
      const raw = await this.buildVisualizationsRaw(
        file,
        req.params.pattern,
        namespace
      );
      return { acknowledge: true, raw: raw };
    } catch (error) {
      log('wazuh-elastic:createVis', error.message || error);
      return ErrorResponse(error.message || error, 4007, 500, reply);
    }
  }

  /**
   * This creates a visualization of cluster
   * @param {Object} req
   * @param {Object} reply
   * @returns {Object} vis obj or ErrorResponse
   */
  async createClusterVis(req, reply) {
    try {
      if (
        !req.params.pattern ||
        !req.params.tab ||
        !req.payload ||
        !req.payload.nodes ||
        !req.payload.nodes.items ||
        !req.payload.nodes.name ||
        (req.params.tab && !req.params.tab.includes('cluster-'))
      ) {
        throw new Error('Missing parameters creating visualizations');
      }

      const file = ClusterVisualizations['monitoring'];
      const nodes = req.payload.nodes.items;
      const name = req.payload.nodes.name;
      const masterNode = req.payload.nodes.master_node;

      const spaces = this._server.plugins.spaces;
      const namespace = spaces && spaces.getSpaceId(req);

      const patternDoc = await this.wzWrapper.getIndexPatternUsingGet(
        req.params.pattern,
        namespace
      );

      const patternName = patternDoc._source['index-pattern'].title;

      const raw = await this.buildClusterVisualizationsRaw(
        file,
        req.params.pattern,
        nodes,
        name,
        masterNode,
        patternName
      );

      return { acknowledge: true, raw: raw };
    } catch (error) {
      log('wazuh-elastic:createClusterVis', error.message || error);
      return ErrorResponse(error.message || error, 4009, 500, reply);
    }
  }

  /**
   * Reload elastic index
   * @param {Object} req
   * @param {Object} reply
   * @returns {Object} status obj or ErrorResponse
   */
  async refreshIndex(req, reply) {
    try {
      if (!req.params.pattern) throw new Error('Missing parameters');
      log(
        'wazuh-elastic:refreshIndex',
        `Index pattern: ${req.params.pattern}`,
        'debug'
      );
      const output =
        ((req || {}).params || {}).pattern === 'all'
          ? await checkKnownFields(this.wzWrapper, false, false, false, true)
          : await this.wzWrapper.updateIndexPatternKnownFields(
              req.params.pattern
            );

      return { acknowledge: true, output: output };
    } catch (error) {
      log('wazuh-elastic:refreshIndex', error.message || error);
      return ErrorResponse(error.message || error, 4008, 500, reply);
    }
  }

  /**
   * This returns the alerts of an agent
   * @param {*} req
   * POST /elastic/alerts
   * {
   *   elasticQuery: {bool: {must: [], filter: [{match_all: {}}], should: [], must_not: []}}
   *   filters: [{rule.groups: "syscheck"}, {agent.id: "001"} ]
   *   from: "now-1y"
   *   offset: 0
   *   pattern: "wazuh-alerts-3.x-*"
   *   sort: {timestamp: {order: "asc"}}
   *   to: "now"
   * }
   * @param {*} reply
   * {alerts: [...]} or ErrorResponse
   */
  async alerts(req, reply) {
    try {
      const pattern = req.payload.pattern || 'wazuh-alerts-3.x-*';
      const from = req.payload.from || 'now-1d';
      const to = req.payload.to || 'now';
      const size = req.payload.size || 500;
      const sort = req.payload.sort || { timestamp: { order: 'asc' } };
      const payload = Base(pattern, [], from, to);

      payload.query = req.payload.elasticQuery || { bool: { must: [] } }; // if an already formatted elastic query is received we use it as a base otherwise we create a simple elastic query

      const range = {
        range: {
          timestamp: {
            gte: from,
            lte: to,
            format: 'epoch_millis'
          }
        }
      };

      payload.query.bool.must.push(range);

      // add custom key:value filters to the elastic query
      if (req.payload.filters) {
        req.payload.filters.map(item => {
          payload.query.bool.must.push({
            match: item
          });
        });
      }
      payload.sort.push(sort);
      payload.size = size;
      payload.from = req.payload.offset || 0;
      const spaces = this._server.plugins.spaces;
      const namespace = spaces && spaces.getSpaceId(req);
      const data = await this.wzWrapper.searchWazuhAlertsWithPayload(payload, namespace);
      return { alerts: data.hits.hits, hits: data.hits.total.value };
    } catch (error) {
      log('wazuh-elastic:alerts', error.message || error);
      return ErrorResponse(error.message || error, 4010, 500, reply);
    }
  }
  /**
   * This checks if there is sample alerts
   * @param {*} req
   * GET /elastic/samplealerts/{pattern}
   *
   * @param {*} reply
   * {alerts: [...]} or ErrorResponse
   */
  async haveSampleAlerts(req, reply){
    try{
      // Check if wazuh sample alerts index exists
      const results = await Promise.all(Object.keys(this.wzSampleAlertsCaterories)
        .map((category) => this.wzWrapper.checkIfIndexExists(this.buildSampleIndexByCategory(category))));
      
      return { sampleAlertsInstalled: results.some(result => result) }
    }catch(error){
      return ErrorResponse('Sample Alerts category not valid', 1000, 500, reply);
    }
  }
  /**
   * This creates sample alerts in wazuh-sample-alerts
   * @param {*} req
   * GET /elastic/samplealerts/{pattern}/{category}
   *
   * @param {*} reply
   * {alerts: [...]} or ErrorResponse
   */
  async haveSampleAlertsOfCategory(req, reply){
    if(!req.params || typeof req.params !== 'object'){
      return ErrorResponse('Missing params', 1000, 500, reply);
    };
    if(!req.params.category || !Object.keys(this.wzSampleAlertsCaterories).includes(req.params.category)){
      return ErrorResponse('Sample Alerts category not valid', 1000, 500, reply);
    };
    try{
      const sampleAlertsIndex = this.buildSampleIndexByCategory(req.params.category);
      // Check if wazuh sample alerts index exists
      const existsSampleIndex = await this.wzWrapper.checkIfIndexExists(sampleAlertsIndex);
      return { index: sampleAlertsIndex, exists: existsSampleIndex }
    }catch(error){
      ErrorResponse('Sample Alerts category not valid', 1000, 500, reply);
    }
  }
  /**
   * This creates sample alerts in wazuh-sample-alerts
   * @param {*} req
   * POST /elastic/samplealerts/{pattern}/{category}
   * {
   *   "manager": {
   *      "name": "manager_name"
   *    },
   *    cluster: {
   *      name: "mycluster",
   *      node: "mynode"
   *    }
   * }
   *
   * @param {*} reply
   * {index: string, alerts: [...], count: number} or ErrorResponse
   */
  async createSampleAlerts(req, reply){
    if(!req.params || typeof req.params !== 'object'){
      return ErrorResponse('Missing params', 1000, 500, reply);
    };
    if(!req.params.category || !Object.keys(this.wzSampleAlertsCaterories).includes(req.params.category)){
      return ErrorResponse('Sample Alerts category not valid', 1000, 500, reply);
    };
    
    const sampleAlertsIndex = this.buildSampleIndexByCategory(req.params.category);
    const bulkPrefix = JSON.stringify({
      index: {
        _index: sampleAlertsIndex
      }
    });
    const alertGenerateParams = req.payload && req.payload.params || {};

    const sampleAlerts = this.wzSampleAlertsCaterories[req.params.category].map((typeAlert) => generateAlerts({...typeAlert, ...alertGenerateParams}, req.payload.alerts || typeAlert.alerts || this.defaultNumSampleAlerts)).flat();
    const bulk = sampleAlerts.map(sampleAlert => `${bulkPrefix}\n${JSON.stringify(sampleAlert)}`).join('\n');
    // Index alerts
    try{
      // Check if wazuh sample alerts index exists
      const existsSampleIndex = await this.wzWrapper.checkIfIndexExists(sampleAlertsIndex);
      if(!existsSampleIndex){
        // Create wazuh sample alerts index
        const configFile = getConfiguration();

        const shards =
          typeof (configFile || {})['wazuh.alerts.shards'] !== 'undefined'
            ? configFile['wazuh.alerts.shards']
            : 3;

        const replicas =
          typeof (configFile || {})['wazuh.alerts.replicas'] !== 'undefined'
            ? configFile['wazuh.alerts.replicas']
            : 0;

        const configuration = {
          settings: {
            index: {
              number_of_shards: shards,
              number_of_replicas: replicas
            }
          }
        };
        await this.wzWrapper.createIndexByName(sampleAlertsIndex, configuration);
        log(
          'wazuh-elastic:createSampleAlerts',
          `Created ${sampleAlertsIndex} index`,
          'debug'
        );
      }
      await this.wzWrapper.elasticRequest.callWithInternalUser('bulk',{ body: bulk });
      log(
        'wazuh-elastic:createSampleAlerts',
        `Added sample alerts to ${sampleAlertsIndex} index`,
        'debug'
      );
      return { index: sampleAlertsIndex, alerts: sampleAlerts, count: sampleAlerts.length }
    }catch(error){
      log(
        'wazuh-elastic:createSampleAlerts',
        `Error adding sample alerts to ${sampleAlertsIndex} index`
      );
      return ErrorResponse(error.message || error, 1000, 400, reply);
    }
  }
  /**
   * This deletes sample alerts
   * @param {*} req
   * @param {*} reply
   * {result: "deleted", index: string} or ErrorResponse
   */
  async deleteSampleAlerts(req, reply){
    // Delete Wazuh sample alert index
    if(!req.params || typeof req.params !== 'object'){
      return ErrorResponse('Missing params', 1000, 500, reply);
    };
    if(!req.params.category || !Object.keys(this.wzSampleAlertsCaterories).includes(req.params.category)){
      return ErrorResponse('Sample Alerts category not valid', 1000, 500, reply);
    };
    const sampleAlertsIndex = this.buildSampleIndexByCategory(req.params.category);
    try{
      // Check if Wazuh sample alerts index exists
      const existsSampleIndex = await this.wzWrapper.checkIfIndexExists(sampleAlertsIndex);
      if(existsSampleIndex){
        // Delete Wazuh sample alerts index
        await this.wzWrapper.elasticRequest.callWithInternalUser('indices.delete',{index: sampleAlertsIndex});
        log(
          'wazuh-elastic:deleteSampleAlerts',
          `Deleted ${sampleAlertsIndex} index`,
          'debug'
        );
        return { result: 'deleted', index: sampleAlertsIndex };
      }else{
        return ErrorResponse(`${sampleAlertsIndex} index doesn't exist`, 1000, 500, reply)
      }
    }catch(error){
      log(
        'wazuh-elastic:deleteSampleAlerts',
        `Error deleting sample alerts of ${sampleAlertsIndex} index`
      );
      return ErrorResponse(error.message || error, 1000, 500, reply);
    }
  }

  async esAlerts(req, reply) {
    try {
      const data = await this.wzWrapper.searchWazuhAlertsWithRequest(req, req.payload);
      return data;
    } catch (error) {
      log('wazuh-elastic:esAlerts', error.message || error);
      return ErrorResponse(error.message || error, 4010, 500, reply);
    }
  }
}
