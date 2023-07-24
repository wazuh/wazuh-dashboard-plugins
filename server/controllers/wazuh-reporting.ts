/*
 * Wazuh app - Class for Wazuh reporting controller
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import path from 'path';
import fs from 'fs';
import { WAZUH_MODULES } from '../../common/wazuh-modules';
import * as TimSort from 'timsort';
import { ErrorResponse } from '../lib/error-response';
import ProcessEquivalence from '../lib/process-state-equivalence';
import { KeyEquivalence } from '../../common/csv-key-equivalence';
import { AgentConfiguration } from '../lib/reporting/agent-configuration';
import { extendedInformation, buildAgentsTable } from '../lib/reporting/extended-information';
import { ReportPrinter } from '../lib/reporting/printer';
import { log } from '../lib/logger';
import { KibanaRequest, RequestHandlerContext, KibanaResponseFactory } from 'src/core/server';
import {
  WAZUH_DATA_DOWNLOADS_DIRECTORY_PATH,
  WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH,
  AUTHORIZED_AGENTS,
  API_NAME_AGENT_STATUS,
} from '../../common/constants';
import { createDirectoryIfNotExists, createDataDirectoryIfNotExists } from '../lib/filesystem';
import { agentStatusLabelByAgentStatus } from '../../common/services/wz_agent_status';

interface AgentsFilter {
  query: any;
  agentsText: string;
}

export class WazuhReportingCtrl {
  constructor() {}
  /**
   * This do format to filters
   * @param {String} filters E.g: cluster.name: wazuh AND rule.groups: vulnerability
   * @param {String} searchBar search term
   */
  private sanitizeKibanaFilters(filters: any, searchBar?: string): [string, AgentsFilter] {
    log('reporting:sanitizeKibanaFilters', `Started to sanitize filters`, 'info');
    log(
      'reporting:sanitizeKibanaFilters',
      `filters: ${filters.length}, searchBar: ${searchBar}`,
      'debug'
    );
    let str = '';

    const agentsFilter: AgentsFilter = { query: {}, agentsText: '' };
    const agentsList: string[] = [];

    //separate agents filter
    filters = filters.filter((filter) => {
      if (filter.meta.controlledBy === AUTHORIZED_AGENTS) {
        agentsFilter.query = filter.query;
        agentsList.push(filter);
        return false;
      }
      return filter;
    });

    const len = filters.length;

    for (let i = 0; i < len; i++) {
      const { negate, key, value, params, type } = filters[i].meta;
      str += `${negate ? 'NOT ' : ''}`;
      str += `${key}: `;
      str += `${
        type === 'range'
          ? `${params.gte}-${params.lt}`
          : type === 'phrases'
            ? '(' + params.join(" OR ") + ')'
            : type === 'exists'
              ? '*'
              : !!value
          ? value
          : (params || {}).query
      }`;
      str += `${i === len - 1 ? '' : ' AND '}`;
    }

    if (searchBar) {
      str += ` AND (${ searchBar})`;
    }

    agentsFilter.agentsText = agentsList.map((filter) => filter.meta.value).join(',');

    log(
      'reporting:sanitizeKibanaFilters',
      `str: ${str}, agentsFilterStr: ${agentsFilter.agentsText}`,
      'debug'
    );

    return [str, agentsFilter];
  }

  /**
   * This performs the rendering of given header
   * @param {String} printer section target
   * @param {String} section section target
   * @param {Object} tab tab target
   * @param {Boolean} isAgents is agents section
   * @param {String} apiId ID of API
   */
  private async renderHeader(context, printer, section, tab, isAgents, apiId) {
    try {
      log(
        'reporting:renderHeader',
        `section: ${section}, tab: ${tab}, isAgents: ${isAgents}, apiId: ${apiId}`,
        'debug'
      );
      if (section && typeof section === 'string') {
        if (!['agentConfig', 'groupConfig'].includes(section)) {
          printer.addContent({
            text: WAZUH_MODULES[tab].title + ' report',
            style: 'h1',
          });
        } else if (section === 'agentConfig') {
          printer.addContent({
            text: `Agent ${isAgents} configuration`,
            style: 'h1',
          });
        } else if (section === 'groupConfig') {
          printer.addContent({
            text: 'Agents in group',
            style: 'h1',
          });
        }
        printer.addNewLine();
      }

      if (isAgents && typeof isAgents === 'object') {
        await buildAgentsTable(
          context,
          printer,
          isAgents,
          apiId,
          section === 'groupConfig' ? tab : ''
        );
      }

      if (isAgents && typeof isAgents === 'string') {
        const agentResponse = await context.wazuh.api.client.asCurrentUser.request(
          'GET',
          `/agents`,
          { params: { agents_list: isAgents } },
          { apiHostID: apiId }
        );
        const agentData = agentResponse.data.data.affected_items[0];
        if (agentData && agentData.status !== API_NAME_AGENT_STATUS.ACTIVE) {
          printer.addContentWithNewLine({
            text: `Warning. Agent is ${agentStatusLabelByAgentStatus(agentData.status).toLowerCase()}`,
            style: 'standard',
          });
        }
        await buildAgentsTable(context, printer, [isAgents], apiId);

        if (agentData && agentData.group) {
          const agentGroups = agentData.group.join(', ');
          printer.addContentWithNewLine({
            text: `Group${agentData.group.length > 1 ? 's' : ''}: ${agentGroups}`,
            style: 'standard',
          });
        }
      }
      if (WAZUH_MODULES[tab] && WAZUH_MODULES[tab].description) {
        printer.addContentWithNewLine({
          text: WAZUH_MODULES[tab].description,
          style: 'standard',
        });
      }
    } catch (error) {
      log('reporting:renderHeader', error.message || error);
      return Promise.reject(error);
    }
  }

  private getConfigRows(data, labels) {
    log('reporting:getConfigRows', `Building configuration rows`, 'info');
    const result = [];
    for (let prop in data || []) {
      if (Array.isArray(data[prop])) {
        data[prop].forEach((x, idx) => {
          if (typeof x === 'object') data[prop][idx] = JSON.stringify(x);
        });
      }
      result.push([(labels || {})[prop] || KeyEquivalence[prop] || prop, data[prop] || '-']);
    }
    return result;
  }

  private getConfigTables(data, section, tab, array = []) {
    log('reporting:getConfigTables', `Building configuration tables`, 'info');
    let plainData = {};
    const nestedData = [];
    const tableData = [];

    if (data.length === 1 && Array.isArray(data)) {
      tableData[section.config[tab].configuration] = data;
    } else {
      for (let key in data) {
        if (
          (typeof data[key] !== 'object' && !Array.isArray(data[key])) ||
          (Array.isArray(data[key]) && typeof data[key][0] !== 'object')
        ) {
          plainData[key] =
            Array.isArray(data[key]) && typeof data[key][0] !== 'object'
              ? data[key].map((x) => {
                  return typeof x === 'object' ? JSON.stringify(x) : x + '\n';
                })
              : data[key];
        } else if (Array.isArray(data[key]) && typeof data[key][0] === 'object') {
          tableData[key] = data[key];
        } else {
          if (section.isGroupConfig && ['pack', 'content'].includes(key)) {
            tableData[key] = [data[key]];
          } else {
            nestedData.push(data[key]);
          }
        }
      }
    }
    array.push({
      title: (section.options || {}).hideHeader
        ? ''
        : (section.tabs || [])[tab] ||
          (section.isGroupConfig ? ((section.labels || [])[0] || [])[tab] : ''),
      columns: ['', ''],
      type: 'config',
      rows: this.getConfigRows(plainData, (section.labels || [])[0]),
    });
    for (let key in tableData) {
      const columns = Object.keys(tableData[key][0]);
      columns.forEach((col, i) => {
        columns[i] = col[0].toUpperCase() + col.slice(1);
      });

      const rows = tableData[key].map((x) => {
        let row = [];
        for (let key in x) {
          row.push(
            typeof x[key] !== 'object'
              ? x[key]
              : Array.isArray(x[key])
              ? x[key].map((x) => {
                  return x + '\n';
                })
              : JSON.stringify(x[key])
          );
        }
        while (row.length < columns.length) {
          row.push('-');
        }
        return row;
      });
      array.push({
        title: ((section.labels || [])[0] || [])[key] || '',
        type: 'table',
        columns,
        rows,
      });
    }
    nestedData.forEach(nest => {
      this.getConfigTables(nest, section, tab + 1, array);
    });
    return array;
  }

  /**
   * Create a report for the modules
   * @param {Object} context
   * @param {Object} request
   * @param {Object} response
   * @returns {*} reports list or ErrorResponse
   */
  createReportsModules = this.checkReportsUserDirectoryIsValidRouteDecorator(async (
    context: RequestHandlerContext,
    request: KibanaRequest,
    response: KibanaResponseFactory
  ) => {
    try {
      log('reporting:createReportsModules', `Report started`, 'info');
      const {
        array,
        agents,
        browserTimezone,
        searchBar,
        filters,
        serverSideQuery,
        time,
        tables,
        section,
        indexPatternTitle,
        apiId
      } = request.body;
      const { moduleID } = request.params;
      const { from, to } = time || {};
      let additionalTables = [];
      // Init
      const printer = new ReportPrinter();

      createDataDirectoryIfNotExists();
      createDirectoryIfNotExists(WAZUH_DATA_DOWNLOADS_DIRECTORY_PATH);
      createDirectoryIfNotExists(WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH);
      createDirectoryIfNotExists(path.join(WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH, context.wazuhEndpointParams.hashUsername));

      await this.renderHeader(context, printer, section, moduleID, agents, apiId);

      const [sanitizedFilters, agentsFilter] = filters
        ? this.sanitizeKibanaFilters(filters, searchBar)
        : [false, null];

      if (time && sanitizedFilters) {
        printer.addTimeRangeAndFilters(from, to, sanitizedFilters, browserTimezone);
      }

      if (time) {
        additionalTables = await extendedInformation(
          context,
          printer,
          section,
          moduleID,
          apiId,
          new Date(from).getTime(),
          new Date(to).getTime(),
          serverSideQuery,
          agentsFilter,
          indexPatternTitle,
          agents
        );
      }

      printer.addVisualizations(array, agents, moduleID);

      if (tables) {
        printer.addTables([...tables, ...(additionalTables || [])]);
      }

      //add authorized agents
      if (agentsFilter?.agentsText) {
        printer.addAgentsFilters(agentsFilter.agentsText);
      }

      await printer.print(context.wazuhEndpointParams.pathFilename);

      return response.ok({
        body: {
          success: true,
          message: `Report ${context.wazuhEndpointParams.filename} was created`,
        },
      });
    } catch (error) {
      return ErrorResponse(error.message || error, 5029, 500, response);
    }
  },({body:{ agents }, params: { moduleID }}) => `wazuh-module-${agents ? `agents-${agents}` : 'overview'}-${moduleID}-${this.generateReportTimestamp()}.pdf`)

  /**
   * Create a report for the groups
   * @param {Object} context
   * @param {Object} request
   * @param {Object} response
   * @returns {*} reports list or ErrorResponse
   */
  createReportsGroups = this.checkReportsUserDirectoryIsValidRouteDecorator(async(
    context: RequestHandlerContext,
    request: KibanaRequest,
    response: KibanaResponseFactory
  ) => {
    try {
      log('reporting:createReportsGroups', `Report started`, 'info');
      const { components, apiId } = request.body;
      const { groupID } = request.params;
      // Init
      const printer = new ReportPrinter();

      createDataDirectoryIfNotExists();
      createDirectoryIfNotExists(WAZUH_DATA_DOWNLOADS_DIRECTORY_PATH);
      createDirectoryIfNotExists(WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH);
      createDirectoryIfNotExists(path.join(WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH, context.wazuhEndpointParams.hashUsername));

      let tables = [];
      const equivalences = {
        localfile: 'Local files',
        osquery: 'Osquery',
        command: 'Command',
        syscheck: 'Syscheck',
        'open-scap': 'OpenSCAP',
        'cis-cat': 'CIS-CAT',
        syscollector: 'Syscollector',
        rootcheck: 'Rootcheck',
        labels: 'Labels',
        sca: 'Security configuration assessment',
      };
      printer.addContent({
        text: `Group ${groupID} configuration`,
        style: 'h1',
      });

      // Group configuration
      if (components['0']) {

        const { data: { data: configuration } } = await context.wazuh.api.client.asCurrentUser.request(
          'GET',
          `/groups/${groupID}/configuration`,
          {},
          { apiHostID: apiId }
        );

        if (
          configuration.affected_items.length > 0 &&
          Object.keys(configuration.affected_items[0].config).length
        ) {
          printer.addContent({
            text: 'Configurations',
            style: { fontSize: 14, color: '#000' },
            margin: [0, 10, 0, 15],
          });
          const section = {
            labels: [],
            isGroupConfig: true,
          };
          for (let config of configuration.affected_items) {
            let filterTitle = '';
            let index = 0;
            for (let filter of Object.keys(config.filters)) {
              filterTitle = filterTitle.concat(`${filter}: ${config.filters[filter]}`);
              if (index < Object.keys(config.filters).length - 1) {
                filterTitle = filterTitle.concat(' | ');
              }
              index++;
            }
            printer.addContent({
              text: filterTitle,
              style: 'h4',
              margin: [0, 0, 0, 10],
            });
            let idx = 0;
            section.tabs = [];
            for (let _d of Object.keys(config.config)) {
              for (let c of AgentConfiguration.configurations) {
                for (let s of c.sections) {
                  section.opts = s.opts || {};
                  for (let cn of s.config || []) {
                    if (cn.configuration === _d) {
                      section.labels = s.labels || [[]];
                    }
                  }
                  for (let wo of s.wodle || []) {
                    if (wo.name === _d) {
                      section.labels = s.labels || [[]];
                    }
                  }
                }
              }
              section.labels[0]['pack'] = 'Packs';
              section.labels[0]['content'] = 'Evaluations';
              section.labels[0]['7'] = 'Scan listening netwotk ports';
              section.tabs.push(equivalences[_d]);

              if (Array.isArray(config.config[_d])) {
                /* LOG COLLECTOR */
                if (_d === 'localfile') {
                  let groups = [];
                  config.config[_d].forEach((obj) => {
                    if (!groups[obj.logformat]) {
                      groups[obj.logformat] = [];
                    }
                    groups[obj.logformat].push(obj);
                  });
                  Object.keys(groups).forEach((group) => {
                    let saveidx = 0;
                    groups[group].forEach((x, i) => {
                      if (Object.keys(x).length > Object.keys(groups[group][saveidx]).length) {
                        saveidx = i;
                      }
                    });
                    const columns = Object.keys(groups[group][saveidx]);
                    const rows = groups[group].map((x) => {
                      let row = [];
                      columns.forEach((key) => {
                        row.push(
                          typeof x[key] !== 'object'
                            ? x[key]
                            : Array.isArray(x[key])
                            ? x[key].map((x) => {
                                return x + '\n';
                              })
                            : JSON.stringify(x[key])
                        );
                      });
                      return row;
                    });
                    columns.forEach((col, i) => {
                      columns[i] = col[0].toUpperCase() + col.slice(1);
                    });
                    tables.push({
                      title: 'Local files',
                      type: 'table',
                      columns,
                      rows,
                    });
                  });
                } else if (_d === 'labels') {
                  const obj = config.config[_d][0].label;
                  const columns = Object.keys(obj[0]);
                  if (!columns.includes('hidden')) {
                    columns.push('hidden');
                  }
                  const rows = obj.map((x) => {
                    let row = [];
                    columns.forEach((key) => {
                      row.push(x[key]);
                    });
                    return row;
                  });
                  columns.forEach((col, i) => {
                    columns[i] = col[0].toUpperCase() + col.slice(1);
                  });
                  tables.push({
                    title: 'Labels',
                    type: 'table',
                    columns,
                    rows,
                  });
                } else {
                  for (let _d2 of config.config[_d]) {
                    tables.push(...this.getConfigTables(_d2, section, idx));
                  }
                }
              } else {
                /*INTEGRITY MONITORING MONITORED DIRECTORIES */
                if (config.config[_d].directories) {
                  const directories = config.config[_d].directories;
                  delete config.config[_d].directories;
                  tables.push(...this.getConfigTables(config.config[_d], section, idx));
                  let diffOpts = [];
                  Object.keys(section.opts).forEach((x) => {
                    diffOpts.push(x);
                  });
                  const columns = [
                    '',
                    ...diffOpts.filter((x) => x !== 'check_all' && x !== 'check_sum'),
                  ];
                  let rows = [];
                  directories.forEach((x) => {
                    let row = [];
                    row.push(x.path);
                    columns.forEach((y) => {
                      if (y !== '') {
                        y = y !== 'check_whodata' ? y : 'whodata';
                        row.push(x[y] ? x[y] : 'no');
                      }
                    });
                    row.push(x.recursion_level);
                    rows.push(row);
                  });
                  columns.forEach((x, idx) => {
                    columns[idx] = section.opts[x];
                  });
                  columns.push('RL');
                  tables.push({
                    title: 'Monitored directories',
                    type: 'table',
                    columns,
                    rows,
                  });
                } else {
                  tables.push(...this.getConfigTables(config.config[_d], section, idx));
                }
              }
              for (const table of tables) {
                printer.addConfigTables([table]);
              }
              idx++;
              tables = [];
            }
            tables = [];
          }
        } else {
          printer.addContent({
            text: 'A configuration for this group has not yet been set up.',
            style: { fontSize: 12, color: '#000' },
            margin: [0, 10, 0, 15],
          });
        }
      }

      // Agents in group
      if (components['1']) {
        await this.renderHeader(
          context,
          printer,
          'groupConfig',
          groupID,
          [],
          apiId
        );
      }

      await printer.print(context.wazuhEndpointParams.pathFilename);

      return response.ok({
        body: {
          success: true,
          message: `Report ${context.wazuhEndpointParams.filename} was created`,
        },
      });
    } catch (error) {
      log('reporting:createReportsGroups', error.message || error);
      return ErrorResponse(error.message || error, 5029, 500, response);
    }
  }, ({params: { groupID }}) => `wazuh-group-configuration-${groupID}-${this.generateReportTimestamp()}.pdf`)

  /**
   * Create a report for the agents
   * @param {Object} context
   * @param {Object} request
   * @param {Object} response
   * @returns {*} reports list or ErrorResponse
   */
  createReportsAgentsConfiguration = this.checkReportsUserDirectoryIsValidRouteDecorator( async (
    context: RequestHandlerContext,
    request: KibanaRequest,
    response: KibanaResponseFactory
  ) => {
    try {
      log('reporting:createReportsAgentsConfiguration', `Report started`, 'info');
      const { components, apiId } = request.body;
      const { agentID } = request.params;

      const printer = new ReportPrinter();
      createDataDirectoryIfNotExists();
      createDirectoryIfNotExists(WAZUH_DATA_DOWNLOADS_DIRECTORY_PATH);
      createDirectoryIfNotExists(WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH);
      createDirectoryIfNotExists(path.join(WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH, context.wazuhEndpointParams.hashUsername));

      let wmodulesResponse = {};
      let tables = [];
      try {
        wmodulesResponse = await context.wazuh.api.client.asCurrentUser.request(
          'GET',
          `/agents/${agentID}/config/wmodules/wmodules`,
          {},
          { apiHostID: apiId }
        );
      } catch (error) {
        log('reporting:report', error.message || error, 'debug');
      }

      await this.renderHeader(context, printer, 'agentConfig', 'agentConfig', agentID, apiId);

      let idxComponent = 0;
      for (let config of AgentConfiguration.configurations) {
        let titleOfSection = false;
        log(
          'reporting:createReportsAgentsConfiguration',
          `Iterate over ${config.sections.length} configuration sections`,
          'debug'
        );
        for (let section of config.sections) {
          let titleOfSubsection = false;
          if (
            components[idxComponent] &&
            (section.config || section.wodle)
          ) {
            let idx = 0;
            const configs = (section.config || []).concat(section.wodle || []);
            log(
              'reporting:createReportsAgentsConfiguration',
              `Iterate over ${configs.length} configuration blocks`,
              'debug'
            );
            for (let conf of configs) {
              let agentConfigResponse = {};
              try {
                if (!conf['name']) {
                  agentConfigResponse = await context.wazuh.api.client.asCurrentUser.request(
                    'GET',
                    `/agents/${agentID}/config/${conf.component}/${conf.configuration}`,
                    {},
                    { apiHostID: apiId }
                  );
                } else {
                  for (let wodle of wmodulesResponse.data.data['wmodules']) {
                    if (Object.keys(wodle)[0] === conf['name']) {
                      agentConfigResponse.data = {
                        data: wodle,
                      };
                    }
                  }
                }

                const agentConfig =
                  agentConfigResponse && agentConfigResponse.data && agentConfigResponse.data.data;
                if (!titleOfSection) {
                  printer.addContent({
                    text: config.title,
                    style: 'h1',
                    margin: [0, 0, 0, 15],
                  });
                  titleOfSection = true;
                }
                if (!titleOfSubsection) {
                  printer.addContent({
                    text: section.subtitle,
                    style: 'h4',
                  });
                  printer.addContent({
                    text: section.desc,
                    style: { fontSize: 12, color: '#000' },
                    margin: [0, 0, 0, 10],
                  });
                  titleOfSubsection = true;
                }
                if (agentConfig) {
                  for (let agentConfigKey of Object.keys(agentConfig)) {
                    if (Array.isArray(agentConfig[agentConfigKey])) {
                      /* LOG COLLECTOR */
                      if (conf.filterBy) {
                        let groups = [];
                        agentConfig[agentConfigKey].forEach((obj) => {
                          if (!groups[obj.logformat]) {
                            groups[obj.logformat] = [];
                          }
                          groups[obj.logformat].push(obj);
                        });
                        Object.keys(groups).forEach((group) => {
                          let saveidx = 0;
                          groups[group].forEach((x, i) => {
                            if (
                              Object.keys(x).length > Object.keys(groups[group][saveidx]).length
                            ) {
                              saveidx = i;
                            }
                          });
                          const columns = Object.keys(groups[group][saveidx]);
                          const rows = groups[group].map((x) => {
                            let row = [];
                            columns.forEach((key) => {
                              row.push(
                                typeof x[key] !== 'object'
                                  ? x[key]
                                  : Array.isArray(x[key])
                                  ? x[key].map((x) => {
                                      return x + '\n';
                                    })
                                  : JSON.stringify(x[key])
                              );
                            });
                            return row;
                          });
                          columns.forEach((col, i) => {
                            columns[i] = col[0].toUpperCase() + col.slice(1);
                          });
                          tables.push({
                            title: section.labels[0][group],
                            type: 'table',
                            columns,
                            rows,
                          });
                        });
                      } else if (agentConfigKey.configuration !== 'socket') {
                        tables.push(
                          ...this.getConfigTables(agentConfig[agentConfigKey], section, idx)
                        );
                      } else {
                        for (let _d2 of agentConfig[agentConfigKey]) {
                          tables.push(...this.getConfigTables(_d2, section, idx));
                        }
                      }
                    } else {
                      /*INTEGRITY MONITORING MONITORED DIRECTORIES */
                      if (conf.matrix) {
                        const {directories,diff,synchronization,file_limit,...rest} = agentConfig[agentConfigKey];
                        tables.push(
                          ...this.getConfigTables(rest, section, idx),
                          ...(diff && diff.disk_quota ? this.getConfigTables(diff.disk_quota, {tabs:['Disk quota']}, 0 ): []),
                          ...(diff && diff.file_size ? this.getConfigTables(diff.file_size, {tabs:['File size']}, 0 ): []),
                          ...(synchronization ? this.getConfigTables(synchronization, {tabs:['Synchronization']}, 0 ): []),
                          ...(file_limit ? this.getConfigTables(file_limit, {tabs:['File limit']}, 0 ): []),
                        );
                        let diffOpts = [];
                        Object.keys(section.opts).forEach((x) => {
                          diffOpts.push(x);
                        });
                        const columns = [
                          '',
                          ...diffOpts.filter((x) => x !== 'check_all' && x !== 'check_sum'),
                        ];
                        let rows = [];
                        directories.forEach((x) => {
                          let row = [];
                          row.push(x.dir);
                          columns.forEach((y) => {
                            if (y !== '') {
                              row.push(x.opts.indexOf(y) > -1 ? 'yes' : 'no');
                            }
                          });
                          row.push(x.recursion_level);
                          rows.push(row);
                        });
                        columns.forEach((x, idx) => {
                          columns[idx] = section.opts[x];
                        });
                        columns.push('RL');
                        tables.push({
                          title: 'Monitored directories',
                          type: 'table',
                          columns,
                          rows,
                        });
                      } else {
                        tables.push(
                          ...this.getConfigTables(agentConfig[agentConfigKey], section, idx)
                        );
                      }
                    }
                  }
                } else {
                  // Print no configured module and link to the documentation
                  printer.addContent({
                    text: [
                      'This module is not configured. Please take a look on how to configure it in ',
                      {
                        text: `${section.subtitle.toLowerCase()} configuration.`,
                        link: section.docuLink,
                        style: { fontSize: 12, color: '#1a0dab' },
                      },
                    ],
                    margin: [0, 0, 0, 20],
                  });
                }
              } catch (error) {
                log('reporting:report', error.message || error, 'debug');
              }
              idx++;
            }
            for (const table of tables) {
              printer.addConfigTables([table]);
            }
          }
          idxComponent++;
          tables = [];
        }
      }

      await printer.print(context.wazuhEndpointParams.pathFilename);

      return response.ok({
        body: {
          success: true,
          message: `Report ${context.wazuhEndpointParams.filename} was created`,
        },
      });
    } catch (error) {
      log('reporting:createReportsAgentsConfiguration', error.message || error);
      return ErrorResponse(error.message || error, 5029, 500, response);
    }
  }, ({ params: { agentID }}) => `wazuh-agent-configuration-${agentID}-${this.generateReportTimestamp()}.pdf`)

  /**
   * Create a report for the agents
   * @param {Object} context
   * @param {Object} request
   * @param {Object} response
   * @returns {*} reports list or ErrorResponse
   */
  createReportsAgentsInventory = this.checkReportsUserDirectoryIsValidRouteDecorator( async (
    context: RequestHandlerContext,
    request: KibanaRequest,
    response: KibanaResponseFactory
  ) => {
    try {
      log('reporting:createReportsAgentsInventory', `Report started`, 'info');
      const { searchBar, filters, time, indexPatternTitle, apiId, serverSideQuery } = request.body;
      const { agentID } = request.params;
      const { from, to } = time || {};
      // Init
      const printer = new ReportPrinter();

      const { hashUsername } = await context.wazuh.security.getCurrentUser(request, context);
      createDataDirectoryIfNotExists();
      createDirectoryIfNotExists(WAZUH_DATA_DOWNLOADS_DIRECTORY_PATH);
      createDirectoryIfNotExists(WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH);
      createDirectoryIfNotExists(path.join(WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH, hashUsername));

      log('reporting:createReportsAgentsInventory', `Syscollector report`, 'debug');
      const [sanitizedFilters, agentsFilter] = filters ? this.sanitizeKibanaFilters(filters, searchBar) : [false, null];

      // Get the agent OS
      let agentOs = '';
      try {
        const agentResponse = await context.wazuh.api.client.asCurrentUser.request(
          'GET',
          '/agents',
          { params: { q: `id=${agentID}` } },
          { apiHostID: apiId }
        );
        agentOs = agentResponse.data.data.affected_items[0].os.platform;
      } catch (error) {
        log('reporting:createReportsAgentsInventory', error.message || error, 'debug');
      }

      // Add title
      printer.addContentWithNewLine({
        text: 'Inventory data report',
        style: 'h1',
      });

      // Add table with the agent info
      await buildAgentsTable(context, printer, [agentID], apiId);

      // Get syscollector packages and processes
      const agentRequestsInventory = [
        {
          endpoint: `/syscollector/${agentID}/packages`,
          loggerMessage: `Fetching packages for agent ${agentID}`,
          table: {
            title: 'Packages',
            columns:
              agentOs === 'windows'
                ? [
                    { id: 'name', label: 'Name' },
                    { id: 'architecture', label: 'Architecture' },
                    { id: 'version', label: 'Version' },
                    { id: 'vendor', label: 'Vendor' },
                  ]
                : [
                    { id: 'name', label: 'Name' },
                    { id: 'architecture', label: 'Architecture' },
                    { id: 'version', label: 'Version' },
                    { id: 'vendor', label: 'Vendor' },
                    { id: 'description', label: 'Description' },
                  ],
          },
        },
        {
          endpoint: `/syscollector/${agentID}/processes`,
          loggerMessage: `Fetching processes for agent ${agentID}`,
          table: {
            title: 'Processes',
            columns:
              agentOs === 'windows'
                ? [
                    { id: 'name', label: 'Name' },
                    { id: 'cmd', label: 'CMD' },
                    { id: 'priority', label: 'Priority' },
                    { id: 'nlwp', label: 'NLWP' },
                  ]
                : [
                    { id: 'name', label: 'Name' },
                    { id: 'euser', label: 'Effective user' },
                    { id: 'nice', label: 'Priority' },
                    { id: 'state', label: 'State' },
                  ],
          },
          mapResponseItems: (item) =>
            agentOs === 'windows' ? item : { ...item, state: ProcessEquivalence[item.state] },
        },
        {
          endpoint: `/syscollector/${agentID}/ports`,
          loggerMessage: `Fetching ports for agent ${agentID}`,
          table: {
            title: 'Network ports',
            columns:
              agentOs === 'windows'
                ? [
                    { id: 'local_ip', label: 'Local IP address' },
                    { id: 'local_port', label: 'Local port' },
                    { id: 'process', label: 'Process' },
                    { id: 'state', label: 'State' },
                    { id: 'protocol', label: 'Protocol' },
                  ]
                : [
                    { id: 'local_ip', label: 'Local IP address' },
                    { id: 'local_port', label: 'Local port' },
                    { id: 'state', label: 'State' },
                    { id: 'protocol', label: 'Protocol' },
                  ],
          },
          mapResponseItems: (item) => ({
            ...item,
            local_ip: item.local.ip,
            local_port: item.local.port,
          }),
        },
        {
          endpoint: `/syscollector/${agentID}/netiface`,
          loggerMessage: `Fetching netiface for agent ${agentID}`,
          table: {
            title: 'Network interfaces',
            columns: [
              { id: 'name', label: 'Name' },
              { id: 'mac', label: 'Mac' },
              { id: 'state', label: 'State' },
              { id: 'mtu', label: 'MTU' },
              { id: 'type', label: 'Type' },
            ],
          },
        },
        {
          endpoint: `/syscollector/${agentID}/netaddr`,
          loggerMessage: `Fetching netaddr for agent ${agentID}`,
          table: {
            title: 'Network settings',
            columns: [
              { id: 'iface', label: 'Interface' },
              { id: 'address', label: 'Address' },
              { id: 'netmask', label: 'Netmask' },
              { id: 'proto', label: 'Protocol' },
              { id: 'broadcast', label: 'Broadcast' },
            ],
          },
        },
      ];

      agentOs === 'windows' &&
        agentRequestsInventory.push({
          endpoint: `/syscollector/${agentID}/hotfixes`,
          loggerMessage: `Fetching hotfixes for agent ${agentID}`,
          table: {
            title: 'Windows updates',
            columns: [{ id: 'hotfix', label: 'Update code' }],
          },
        });

      const requestInventory = async (agentRequestInventory) => {
        try {
          log(
            'reporting:createReportsAgentsInventory',
            agentRequestInventory.loggerMessage,
            'debug'
          );

          const inventoryResponse = await context.wazuh.api.client.asCurrentUser.request(
            'GET',
            agentRequestInventory.endpoint,
            {},
            { apiHostID: apiId }
          );

          const inventory =
            inventoryResponse &&
            inventoryResponse.data &&
            inventoryResponse.data.data &&
            inventoryResponse.data.data.affected_items;
          if (inventory) {
            return {
              ...agentRequestInventory.table,
              items: agentRequestInventory.mapResponseItems
                ? inventory.map(agentRequestInventory.mapResponseItems)
                : inventory,
            };
          }
        } catch (error) {
          log('reporting:createReportsAgentsInventory', error.message || error, 'debug');
        }
      };

      if (time) {
        // Add Vulnerability Detector filter to the Server Side Query
        serverSideQuery?.bool?.must?.push?.({
          match_phrase: {
            "rule.groups": {
              query: "vulnerability-detector"
            }
          }
        });

        await extendedInformation(
          context,
          printer,
          'agents',
          'syscollector',
          apiId,
          from,
          to,
          serverSideQuery,
          agentsFilter,
          indexPatternTitle,
          agentID
        );
      }

      // Add inventory tables
      (await Promise.all(agentRequestsInventory.map(requestInventory)))
        .filter((table) => table)
        .forEach((table) => printer.addSimpleTable(table));

      // Print the document
      await printer.print(context.wazuhEndpointParams.pathFilename);

      return response.ok({
        body: {
          success: true,
          message: `Report ${context.wazuhEndpointParams.filename} was created`,
        },
      });
    } catch (error) {
      log('reporting:createReportsAgents', error.message || error);
      return ErrorResponse(error.message || error, 5029, 500, response);
    }
  }, ({params: { agentID }}) => `wazuh-agent-inventory-${agentID}-${this.generateReportTimestamp()}.pdf`)

  /**
   * Fetch the reports list
   * @param {Object} context
   * @param {Object} request
   * @param {Object} response
   * @returns {Array<Object>} reports list or ErrorResponse
   */
  async getReports(
    context: RequestHandlerContext,
    request: KibanaRequest,
    response: KibanaResponseFactory
  ) {
    try {
      log('reporting:getReports', `Fetching created reports`, 'info');
      const { hashUsername } = await context.wazuh.security.getCurrentUser(request, context);
      createDataDirectoryIfNotExists();
      createDirectoryIfNotExists(WAZUH_DATA_DOWNLOADS_DIRECTORY_PATH);
      createDirectoryIfNotExists(WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH);
      const userReportsDirectoryPath = path.join(WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH, hashUsername);
      createDirectoryIfNotExists(userReportsDirectoryPath);
      log('reporting:getReports', `Directory: ${userReportsDirectoryPath}`, 'debug');

      const sortReportsByDate = (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0);

      const reports = fs.readdirSync(userReportsDirectoryPath).map((file) => {
        const stats = fs.statSync(userReportsDirectoryPath + '/' + file);
        // Get the file creation time (bithtime). It returns the first value that is a truthy value of next file stats: birthtime, mtime, ctime and atime.
        // This solves some OSs can have the bithtimeMs equal to 0 and returns the date like 1970-01-01
        const birthTimeField = ['birthtime', 'mtime', 'ctime', 'atime'].find(
          (time) => stats[`${time}Ms`]
        );
        return {
          name: file,
          size: stats.size,
          date: stats[birthTimeField],
        };
      });
      log('reporting:getReports', `Using TimSort for sorting ${reports.length} items`, 'debug');
      TimSort.sort(reports, sortReportsByDate);
      log('reporting:getReports', `Total reports: ${reports.length}`, 'debug');
      return response.ok({
        body: { reports },
      });
    } catch (error) {
      log('reporting:getReports', error.message || error);
      return ErrorResponse(error.message || error, 5031, 500, response);
    }
  }

  /**
   * Fetch specific report
   * @param {Object} context
   * @param {Object} request
   * @param {Object} response
   * @returns {Object} report or ErrorResponse
   */
  getReportByName = this.checkReportsUserDirectoryIsValidRouteDecorator(async (
    context: RequestHandlerContext,
    request: KibanaRequest,
    response: KibanaResponseFactory
  ) => {
    try {
      log('reporting:getReportByName', `Getting ${context.wazuhEndpointParams.pathFilename} report`, 'debug');
      const reportFileBuffer = fs.readFileSync(context.wazuhEndpointParams.pathFilename);
      return response.ok({
        headers: { 'Content-Type': 'application/pdf' },
        body: reportFileBuffer,
      });
    } catch (error) {
      log('reporting:getReportByName', error.message || error);
      return ErrorResponse(error.message || error, 5030, 500, response);
    }
  }, (request) => request.params.name)

  /**
   * Delete specific report
   * @param {Object} context
   * @param {Object} request
   * @param {Object} response
   * @returns {Object} status obj or ErrorResponse
   */
  deleteReportByName = this.checkReportsUserDirectoryIsValidRouteDecorator(async (
    context: RequestHandlerContext,
    request: KibanaRequest,
    response: KibanaResponseFactory
  ) => {
    try {
      log('reporting:deleteReportByName', `Deleting ${context.wazuhEndpointParams.pathFilename} report`, 'debug');
      fs.unlinkSync(context.wazuhEndpointParams.pathFilename);
      log('reporting:deleteReportByName', `${context.wazuhEndpointParams.pathFilename} report was deleted`, 'info');
      return response.ok({
        body: { error: 0 },
      });
    } catch (error) {
      log('reporting:deleteReportByName', error.message || error);
      return ErrorResponse(error.message || error, 5032, 500, response);
    }
  },(request) => request.params.name)

  checkReportsUserDirectoryIsValidRouteDecorator(routeHandler, reportFileNameAccessor){
    return (async (
      context: RequestHandlerContext,
      request: KibanaRequest,
      response: KibanaResponseFactory
    ) => {
      try{
        const { username, hashUsername } = await context.wazuh.security.getCurrentUser(request, context);
        const userReportsDirectoryPath = path.join(WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH, hashUsername);
        const filename = reportFileNameAccessor(request);
        const pathFilename = path.join(userReportsDirectoryPath, filename);
        log('reporting:checkReportsUserDirectoryIsValidRouteDecorator', `Checking the user ${username}(${hashUsername}) can do actions in the reports file: ${pathFilename}`, 'debug');
        if(!pathFilename.startsWith(userReportsDirectoryPath) || pathFilename.includes('../')){
          log('security:reporting:checkReportsUserDirectoryIsValidRouteDecorator', `User ${username}(${hashUsername}) tried to access to a non user report file: ${pathFilename}`, 'warn');
          return response.badRequest({
            body: {
              message: '5040 - You shall not pass!'
            }
          });
        };
        log('reporting:checkReportsUserDirectoryIsValidRouteDecorator', 'Checking the user can do actions in the reports file', 'debug');
        return await routeHandler.bind(this)({...context, wazuhEndpointParams: { hashUsername, filename, pathFilename }}, request, response);
      }catch(error){
        log('reporting:checkReportsUserDirectoryIsValidRouteDecorator', error.message || error);
        return ErrorResponse(error.message || error, 5040, 500, response);
      }
    })
  }

  private generateReportTimestamp(){
    return `${(Date.now() / 1000) | 0}`;
  }
}
