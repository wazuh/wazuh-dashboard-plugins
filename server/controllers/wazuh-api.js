/*
 * Wazuh app - Class for Wazuh-API functions
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

// Require some libraries
import needle from 'needle';
import { pciRequirementsFile } from '../integration-files/pci-requirements';
import { gdprRequirementsFile } from '../integration-files/gdpr-requirements';
import { ElasticWrapper } from '../lib/elastic-wrapper';
import { getPath } from '../../util/get-path';
import { Monitoring } from '../monitoring';
import { ErrorResponse } from './error-response';
import { Parser } from 'json2csv';
import { getConfiguration } from '../lib/get-configuration';
import { log } from '../logger';
import { KeyEquivalenece } from '../../util/csv-key-equivalence';
import { ApiErrorEquivalence } from '../../util/api-errors-equivalence';
import { cleanKeys } from '../../util/remove-key';
import { apiRequestList } from '../../util/api-request-list';
import * as ApiHelper from '../lib/api-helper';
import { Queue } from '../jobs/queue';

export class WazuhApiCtrl {
  /**
   * Constructor
   * @param {*} server
   */
  constructor(server) {
    this.queue = Queue;
    this.wzWrapper = new ElasticWrapper(server);
    this.monitoringInstance = new Monitoring(server, true);
  }

  /**
   * Returns if the wazuh-api configuration is working
   * @param {Object} req
   * @param {Object} reply
   * @returns {Object} status obj or ErrorResponse
   */
  async checkStoredAPI(req, reply) {
    try {
      // Get config from elasticsearch
      const api = await this.wzWrapper.getWazuhConfigurationById(req.payload);
      if (api.error_code > 1) {
        throw new Error(`Could not find Wazuh API entry on Elasticsearch.`);
      } else if (api.error_code > 0) {
        throw new Error(
          'Valid credentials not found in Elasticsearch. It seems the credentials were not saved.'
        );
      }

      const credInfo = ApiHelper.buildOptionsObject(api);

      let response = await needle(
        'get',
        `${api.url}:${api.port}/version`,
        {},
        credInfo
      );

      if (parseInt(response.body.error) === 0 && response.body.data) {
        // Checking the cluster status
        response = await needle(
          'get',
          `${api.url}:${api.port}/cluster/status`,
          {},
          credInfo
        );

        if (!response.body.error) {
          try {
            const managerInfo = await needle(
              'get',
              `${api.url}:${api.port}/agents/000`,
              {},
              credInfo
            );
            const updatedManagerName = managerInfo.body.data.name;
            api.cluster_info.manager = updatedManagerName;
            await this.wzWrapper.updateWazuhIndexDocument(null, req.payload, {
              doc: { cluster_info: api.cluster_info }
            });
          } catch (error) {
            log(
              'POST /api/check-stored-api :: Error updating Wazuh manager name.',
              error.message || error
            );
          }

          // If cluster mode is active
          if (response.body.data.enabled === 'yes') {
            response = await needle(
              'get',
              `${api.url}:${api.port}/cluster/node`,
              {},
              credInfo
            );

            if (!response.body.error) {
              let managerName = api.cluster_info.manager;
              delete api.cluster_info;
              api.cluster_info = {};
              api.cluster_info.status = 'enabled';
              api.cluster_info.manager = managerName;
              api.cluster_info.node = response.body.data.node;
              api.cluster_info.cluster = response.body.data.cluster;
              api.password = '****';
              return {
                statusCode: 200,
                data: api,
                idChanged: req.idChanged || null
              };
            } else if (response.body.error) {
              const tmpMsg =
                ((response || {}).body || {}).message ||
                'Unexpected error from /cluster/node';
              throw new Error(tmpMsg);
            }
          } else {
            // Cluster mode is not active
            let managerName = api.cluster_info.manager;
            delete api.cluster_info;
            api.cluster_info = {};
            api.cluster_info.status = 'disabled';
            api.cluster_info.cluster = 'Disabled';
            api.cluster_info.manager = managerName;
            api.password = '****';

            return {
              statusCode: 200,
              data: api,
              idChanged: req.idChanged || null
            };
          }
        } else {
          const tmpMsg =
            ((response || {}).body || {}).message ||
            'Unexpected error from /cluster/status';

          throw new Error(tmpMsg);
        }
      } else {
        if (((response || {}).body || {}).message) {
          throw new Error(response.body.message);
        }

        throw new Error(`${api.url}:${api.port}/version is unreachable`);
      }
    } catch (error) {
      if (error.code === 'EPROTO') {
        log(
          'POST /api/check-stored-api',
          'Wrong protocol being used to connect to the Wazuh API'
        );
        return {
          statusCode: 200,
          data: { password: '****', apiIsDown: true }
        };
      } else if (error.code === 'ECONNREFUSED') {
        log('POST /api/check-stored-api', error.message || error);
        return {
          statusCode: 200,
          data: { password: '****', apiIsDown: true }
        };
      } else {
        // Check if we can connect to a different API
        if (
          error &&
          error.body &&
          typeof error.body.found !== 'undefined' &&
          !error.body.found
        ) {
          try {
            const apis = await this.wzWrapper.getWazuhAPIEntries();
            for (const api of apis.hits.hits) {
              try {
                const options = ApiHelper.buildOptionsObject(api);

                options.password = Buffer.from(
                  api._source.api_password,
                  'base64'
                ).toString('ascii');

                const response = await needle(
                  'get',
                  `${api._source.url}:${api._source.api_port}/version`,
                  {},
                  options
                );
                if (
                  ((response || {}).body || {}).error === 0 &&
                  ((response || {}).body || {}).data
                ) {
                  req.payload = api._id;
                  req.idChanged = api._id;
                  return this.checkStoredAPI(req, reply);
                }
              } catch (error) {} // eslint-disable-line
            }
          } catch (error) {
            log('POST /api/check-stored-api', error.message || error);
            return ErrorResponse(error.message || error, 3020, 500, reply);
          }
        }
        log('POST /api/check-stored-api', error.message || error);
        return ErrorResponse(error.message || error, 3002, 500, reply);
      }
    }
  }

  /**
   * This perfoms a validation of API params
   * @param {Object} payload API params
   */
  validateCheckApiParams(payload) {
    if (!('user' in payload)) {
      return 'Missing param: API USER';
    }

    if (!('password' in payload) && !('id' in payload)) {
      return 'Missing param: API PASSWORD';
    }

    if (!('url' in payload)) {
      return 'Missing param: API URL';
    }

    if (!('port' in payload)) {
      return 'Missing param: API PORT';
    }

    if (!payload.url.includes('https://') && !payload.url.includes('http://')) {
      return 'protocol_error';
    }

    return false;
  }

  /**
   * This check the wazuh-api configuration received in the POST body will work
   * @param {Object} req
   * @param {Object} reply
   * @returns {Object} status obj or ErrorResponse
   */
  async checkAPI(req, reply) {
    try {
      let apiAvailable = null;

      const notValid = this.validateCheckApiParams(req.payload);
      if (notValid) return ErrorResponse(notValid, 3003, 500, reply);

      // Check if a Wazuh API id is given (already stored API)
      if (req.payload && req.payload.id && !req.payload.password) {
        const data = await this.wzWrapper.getWazuhConfigurationById(
          req.payload.id
        );
        if (data) apiAvailable = data;
        else
          return ErrorResponse(
            `The API ${req.payload.id} was not found`,
            3029,
            500,
            reply
          );

        // Check if a password is given
      } else if (req.payload && req.payload.password) {
        apiAvailable = req.payload;
        apiAvailable.password = Buffer.from(
          req.payload.password,
          'base64'
        ).toString('ascii');
      }

      let response = await needle(
        'get',
        `${apiAvailable.url}:${apiAvailable.port}/version`,
        {},
        ApiHelper.buildOptionsObject(apiAvailable)
      );

      // Check wrong credentials
      if (parseInt(response.statusCode) === 401) {
        return ErrorResponse('Wrong credentials', 3004, 500, reply);
      }

      if (parseInt(response.body.error) === 0 && response.body.data) {
        response = await needle(
          'get',
          `${apiAvailable.url}:${apiAvailable.port}/agents/000`,
          {},
          ApiHelper.buildOptionsObject(apiAvailable)
        );

        if (!response.body.error) {
          const managerName = response.body.data.name;

          response = await needle(
            'get',
            `${apiAvailable.url}:${apiAvailable.port}/cluster/status`,
            {},
            ApiHelper.buildOptionsObject(apiAvailable)
          );

          if (!response.body.error) {
            if (response.body.data.enabled === 'yes') {
              // If cluster mode is active
              response = await needle(
                'get',
                `${apiAvailable.url}:${apiAvailable.port}/cluster/node`,
                {},
                ApiHelper.buildOptionsObject(apiAvailable)
              );

              if (!response.body.error) {
                return {
                  manager: managerName,
                  node: response.body.data.node,
                  cluster: response.body.data.cluster,
                  status: 'enabled'
                };
              }
            } else {
              // Cluster mode is not active
              return {
                manager: managerName,
                cluster: 'Disabled',
                status: 'disabled'
              };
            }
          }
        }
      }

      const tmpMsg =
        ((response || {}).body || {}).message ||
        'Unexpected error checking the Wazuh API';

      throw new Error(tmpMsg);
    } catch (error) {
      if (error.code === 'EPROTO') {
        log(
          'POST /api/check-api',
          'Wrong protocol being used to connect to the Wazuh API'
        );
        return ErrorResponse(
          'Wrong protocol being used to connect to the Wazuh API',
          3005,
          500,
          reply
        );
      }
      log('POST /api/check-api', error.message || error);
      return ErrorResponse(error.message || error, 3005, 500, reply);
    }
  }

  /**
   * This get PCI requirements
   * @param {Object} req
   * @param {Object} reply
   * @returns {Array<Object>} requirements or ErrorResponse
   */
  async getPciRequirement(req, reply) {
    try {
      let pci_description = '';

      if (req.params.requirement === 'all') {
        if (!req.headers.id) {
          return pciRequirementsFile;
        }
        let api = await this.wzWrapper.getWazuhConfigurationById(
          req.headers.id
        );

        if (api.error_code > 1) {
          // Can not connect to elasticsearch
          return ErrorResponse(
            'Elasticsearch unexpected error or cannot connect',
            3007,
            400,
            reply
          );
        } else if (api.error_code > 0) {
          // Credentials not found
          return ErrorResponse('Credentials does not exists', 3008, 400, reply);
        }

        const response = await needle(
          'get',
          `${api.url}:${api.port}/rules/pci`,
          {},
          ApiHelper.buildOptionsObject(api)
        );

        if ((((response || {}).body || {}).data || {}).items) {
          let PCIobject = {};
          for (const item of response.body.data.items) {
            if (typeof pciRequirementsFile[item] !== 'undefined')
              PCIobject[item] = pciRequirementsFile[item];
          }
          return PCIobject;
        } else {
          return ErrorResponse(
            'An error occurred trying to parse PCI DSS requirements',
            3009,
            400,
            reply
          );
        }
      } else {
        if (
          typeof pciRequirementsFile[req.params.requirement] !== 'undefined'
        ) {
          pci_description = pciRequirementsFile[req.params.requirement];
        }

        return {
          pci: {
            requirement: req.params.requirement,
            description: pci_description
          }
        };
      }
    } catch (error) {
      return ErrorResponse(error.message || error, 3010, 400, reply);
    }
  }

  /**
   * This get GDPR Requirements
   * @param {Object} req
   * @param {Object} reply
   * @returns {Array<Object>} requirements or ErrorResponse
   */
  async getGdprRequirement(req, reply) {
    try {
      let gdpr_description = '';

      if (req.params.requirement === 'all') {
        if (!req.headers.id) {
          return gdprRequirementsFile;
        }
        const api = await this.wzWrapper.getWazuhConfigurationById(
          req.headers.id
        );

        // Checking for GDPR
        const version = await needle(
          'get',
          `${api.url}:${api.port}/version`,
          {},
          ApiHelper.buildOptionsObject(api)
        );

        const number = version.body.data;

        const major = number.split('v')[1].split('.')[0];
        const minor = number
          .split('v')[1]
          .split('.')[1]
          .split('.')[0];
        const patch = number
          .split('v')[1]
          .split('.')[1]
          .split('.')[1];

        if (
          (major >= 3 && minor < 2) ||
          (major >= 3 && minor >= 2 && patch < 3)
        ) {
          return {};
        }

        if (api.error_code > 1) {
          // Can not connect to elasticsearch
          return ErrorResponse(
            'Elasticsearch unexpected error or cannot connect',
            3024,
            400,
            reply
          );
        } else if (api.error_code > 0) {
          // Credentials not found
          return ErrorResponse('Credentials does not exists', 3025, 400, reply);
        }

        const response = await needle(
          'get',
          `${api.url}:${api.port}/rules/gdpr`,
          {},
          ApiHelper.buildOptionsObject(api)
        );

        if ((((response || {}).body || {}).data || {}).items) {
          let GDPRobject = {};
          for (const item of response.body.data.items) {
            if (typeof gdprRequirementsFile[item] !== 'undefined')
              GDPRobject[item] = gdprRequirementsFile[item];
          }
          return GDPRobject;
        } else {
          return ErrorResponse(
            'An error occurred trying to parse GDPR requirements',
            3026,
            400,
            reply
          );
        }
      } else {
        if (
          typeof gdprRequirementsFile[req.params.requirement] !== 'undefined'
        ) {
          gdpr_description = gdprRequirementsFile[req.params.requirement];
        }

        return {
          gdpr: {
            requirement: req.params.requirement,
            description: gdpr_description
          }
        };
      }
    } catch (error) {
      return ErrorResponse(error.message || error, 3027, 400, reply);
    }
  }

  /**
   * This performs a request over Wazuh API and returns its response
   * @param {String} method Method: GET, PUT, POST, DELETE
   * @param {String} path API route
   * @param {Object} data data and params to perform the request
   * @param {String} id API id
   * @param {Object} reply
   * @returns {Object} API response or ErrorResponse
   */
  async makeRequest(method, path, data, id, reply) {
    const devTools = !!(data || {}).devTools;
    try {
      const api = await this.wzWrapper.getWazuhConfigurationById(id);

      if (devTools) {
        delete data.devTools;
      }

      if (api.error_code > 1) {
        //Can not connect to elasticsearch
        return ErrorResponse(
          'Could not connect with elasticsearch',
          3011,
          404,
          reply
        );
      } else if (api.error_code > 0) {
        //Credentials not found
        return ErrorResponse('Credentials does not exists', 3012, 404, reply);
      }

      if (!data) {
        data = {};
      }

      const options = ApiHelper.buildOptionsObject(api);

      // Set content type application/xml if needed
      if (
        typeof (data || {}).content === 'string' &&
        (data || {}).origin === 'xmleditor'
      ) {
        options.content_type = 'application/xml';
        data = data.content.replace(new RegExp('\\n', 'g'), '');
      }

      if (
        typeof (data || {}).content === 'string' &&
        (data || {}).origin === 'json'
      ) {
        options.content_type = 'application/json';
        data = data.content.replace(new RegExp('\\n', 'g'), '');
      }

      if (
        typeof (data || {}).content === 'string' &&
        (data || {}).origin === 'raw'
      ) {
        options.content_type = 'application/octet-stream';
        data = data.content;
      }
      const delay = (data || {}).delay || 0;
      const fullUrl = getPath(api) + path;
      if (delay) {
        const current = new Date();
        this.queue.addJob({
          startAt: new Date(current.getTime() + delay),
          type: 'request',
          method,
          fullUrl,
          data,
          options
        });
        return { error: 0, message: 'Success' };
      }
      const response = await needle(method, fullUrl, data, options);

      if (
        !((response || {}).body || {}).error &&
        ((response || {}).body || {}).data
      ) {
        cleanKeys(response);
        return response.body;
      }

      if (((response || {}).body || {}).error && devTools) {
        return response.body;
      }

      throw ((response || {}).body || {}).error &&
      ((response || {}).body || {}).message
        ? { message: response.body.message, code: response.body.error }
        : new Error('Unexpected error fetching data from the Wazuh API');
    } catch (error) {
      if (devTools) {
        return { error: '3013', message: error.message || error };
      } else {
        if ((error || {}).code && ApiErrorEquivalence[error.code]) {
          error.message = ApiErrorEquivalence[error.code];
        }
        return ErrorResponse(
          error.message || error,
          `Wazuh API error: ${error.code}` || 3013,
          500,
          reply
        );
      }
    }
  }

  /**
   * This performs a generic request and returs its response
   * @param {String} method Method: GET, PUT, POST, DELETE
   * @param {String} path API route
   * @param {Object} data data and params to perform the request
   * @param {String} id API id
   */
  async makeGenericRequest(method, path, data, id) {
    try {
      const api = await this.wzWrapper.getWazuhConfigurationById(id);

      if (api.error_code > 1) {
        //Can not connect to elasticsearch
        throw new Error('Could not connect with elasticsearch');
      } else if (api.error_code > 0) {
        //Credentials not found
        throw new Error('Credentials does not exists');
      }

      if (!data) {
        data = {};
      }

      const options = ApiHelper.buildOptionsObject(api);

      const fullUrl = getPath(api) + path;
      const response = await needle(method, fullUrl, data, options);

      if (
        response &&
        response.body &&
        !response.body.error &&
        response.body.data
      ) {
        cleanKeys(response);
        return response.body;
      }

      throw ((response || {}).body || {}).error &&
      ((response || {}).body || {}).message
        ? { message: response.body.message, code: response.body.error }
        : new Error('Unexpected error fetching data from the Wazuh API');
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * This make a request to API
   * @param {Object} req
   * @param {Object} reply
   * @returns {Object} api response or ErrorResponse
   */
  requestApi(req, reply) {
    const configuration = getConfiguration();
    const adminMode = !(
      configuration &&
      typeof configuration.admin !== 'undefined' &&
      !configuration.admin
    );

    if (!req.payload.method) {
      return ErrorResponse('Missing param: method', 3015, 400, reply);
    } else if (!req.payload.path) {
      return ErrorResponse('Missing param: path', 3016, 400, reply);
    } else {
      if (req.payload.method !== 'GET' && !adminMode) {
        return ErrorResponse(
          req.payload.body && req.payload.body.devTools
            ? 'Allowed method: [GET]'
            : `Forbidden (${req.payload.method} ${req.payload.path}`,
          3029,
          400,
          reply
        );
      }
      if (req.payload.body.devTools) {
        //delete req.payload.body.devTools;
        const keyRegex = new RegExp(/.*agents\/\d*\/key.*/);
        if (
          typeof req.payload.path === 'string' &&
          keyRegex.test(req.payload.path) &&
          !adminMode
        ) {
          return ErrorResponse(
            'Forbidden route /agents/<id>/key',
            3028,
            400,
            reply
          );
        }
      }
      return this.makeRequest(
        req.payload.method,
        req.payload.path,
        req.payload.body,
        req.payload.id,
        reply
      );
    }
  }

  /**
   * Fetch agent status and insert it directly on demand
   * @param {Object} req
   * @param {Object} reply
   * @returns {Object} status obj or ErrorResponse
   */
  async fetchAgents(req, reply) {
    try {
      const output = await this.monitoringInstance.fetchAgentsExternal();
      return {
        statusCode: 200,
        error: '0',
        data: '',
        output
      };
    } catch (error) {
      return ErrorResponse(error.message || error, 3018, 500, reply);
    }
  }

  /**
   * Get full data on CSV format from a list Wazuh API endpoint
   * @param {Object} req
   * @param {Object} res
   * @returns {Object} csv or ErrorResponse
   */
  async csv(req, reply) {
    try {
      if (!req.payload || !req.payload.path)
        throw new Error('Field path is required');
      if (!req.payload.id) throw new Error('Field id is required');

      const filters = Array.isArray(((req || {}).payload || {}).filters)
        ? req.payload.filters
        : [];

      const config = await this.wzWrapper.getWazuhConfigurationById(
        req.payload.id
      );

      let path_tmp = req.payload.path;

      if (path_tmp && typeof path_tmp === 'string') {
        path_tmp = path_tmp[0] === '/' ? path_tmp.substr(1) : path_tmp;
      }

      if (!path_tmp) throw new Error('An error occurred parsing path field');

      // Real limit, regardless the user query
      const params = { limit: 500 };

      if (filters.length) {
        for (const filter of filters) {
          if (!filter.name || !filter.value) continue;
          params[filter.name] = filter.value;
        }
      }

      const cred = ApiHelper.buildOptionsObject(config);

      const itemsArray = [];
      const output = await needle(
        'get',
        `${config.url}:${config.port}/${path_tmp}`,
        params,
        cred
      );
      if ((((output || {}).body || {}).data || {}).totalItems) {
        params.offset = 0;
        const { totalItems } = output.body.data;
        itemsArray.push(...output.body.data.items);
        while (itemsArray.length < totalItems && params.offset < totalItems) {
          params.offset += params.limit;
          const tmpData = await needle(
            'get',
            `${config.url}:${config.port}/${path_tmp}`,
            params,
            cred
          );
          itemsArray.push(...tmpData.body.data.items);
        }
      }

      if ((((output || {}).body || {}).data || {}).totalItems) {
        const fields = req.payload.path.includes('/agents')
          ? [
              'id',
              'status',
              'name',
              'ip',
              'group',
              'manager',
              'node_name',
              'dateAdd',
              'version',
              'lastKeepAlive',
              'os'
            ]
          : Object.keys(output.body.data.items[0]);

        const json2csvParser = new Parser({ fields });
        let csv = json2csvParser.parse(itemsArray);

        for (const field of fields) {
          if (csv.includes(field)) {
            csv = csv.replace(field, KeyEquivalenece[field] || field);
          }
        }

        return reply.response(csv).type('text/csv');
      } else if (
        output &&
        output.body &&
        output.body.data &&
        !output.body.data.totalItems
      ) {
        throw new Error('No results');
      } else {
        throw new Error('An error occurred fetching data from the Wazuh API');
      }
    } catch (error) {
      return ErrorResponse(error.message || error, 3034, 500, reply);
    }
  }

  /**
   * Get the each filed unique values of agents
   * @param {Object} req
   * @param {Object} reply
   * @returns {Array<Object>} unique fileds or ErrorResponse
   */
  async getAgentsFieldsUniqueCount(req, reply) {
    try {
      if (!req.params || !req.params.api)
        throw new Error('Field api is required');

      const config = await this.wzWrapper.getWazuhConfigurationById(
        req.params.api
      );

      const headers = ApiHelper.buildOptionsObject(config);

      const distinctUrl = `${config.url}:${config.port}/agents/stats/distinct`;

      const data = await Promise.all([
        needle(
          'get',
          distinctUrl,
          { fields: 'node_name', select: 'node_name' },
          headers
        ),
        needle(
          'get',
          `${config.url}:${config.port}/agents/groups`,
          {},
          headers
        ),
        needle(
          'get',
          distinctUrl,
          {
            fields: 'os.name,os.platform,os.version',
            select: 'os.name,os.platform,os.version'
          },
          headers
        ),
        needle(
          'get',
          distinctUrl,
          { fields: 'version', select: 'version' },
          headers
        ),
        needle(
          'get',
          `${config.url}:${config.port}/agents/summary`,
          {},
          headers
        ),
        needle(
          'get',
          `${config.url}:${config.port}/agents`,
          { limit: 1, sort: '-dateAdd' },
          headers
        )
      ]);

      const parsedResponses = data.map(item =>
        item && item.body && item.body.data && !item.body.error
          ? item.body.data
          : false
      );

      const [
        nodes,
        groups,
        osPlatforms,
        versions,
        summary,
        lastAgent
      ] = parsedResponses;

      const result = {
        groups: [],
        nodes: [],
        versions: [],
        osPlatforms: [],
        lastAgent: {},
        summary: {
          agentsCountActive: 0,
          agentsCountDisconnected: 0,
          agentsCountNeverConnected: 0,
          agentsCountTotal: 0,
          agentsCoverity: 0
        }
      };

      if (nodes && nodes.items) {
        result.nodes = nodes.items
          .filter(item => !!item.node_name && item.node_name !== 'unknown')
          .map(item => item.node_name);
      }

      if (groups && groups.items) {
        result.groups = groups.items.map(item => item.name);
      }

      if (osPlatforms && osPlatforms.items) {
        result.osPlatforms = osPlatforms.items
          .filter(
            item =>
              !!item.os && item.os.platform && item.os.name && item.os.version
          )
          .map(item => item.os);
      }

      if (versions && versions.items) {
        result.versions = versions.items
          .filter(item => !!item.version)
          .map(item => item.version);
      }

      if (summary) {
        Object.assign(result.summary, {
          agentsCountActive: summary.Active - 1,
          agentsCountDisconnected: summary.Disconnected,
          agentsCountNeverConnected: summary['Never connected'],
          agentsCountTotal: summary.Total - 1,
          agentsCoverity:
            summary.Total - 1
              ? ((summary.Active - 1) / (summary.Total - 1)) * 100
              : 0
        });
      }

      if (lastAgent && lastAgent.items && lastAgent.items.length) {
        Object.assign(result.lastAgent, lastAgent.items[0]);
      }

      return { error: 0, result };
    } catch (error) {
      return ErrorResponse(error.message || error, 3035, 500, reply);
    }
  }

  // Get de list of available requests in the API
  getRequestList() {
    //Read a static JSON until the api call has implemented
    return apiRequestList;
  }
}
