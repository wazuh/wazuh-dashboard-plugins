/*
 * Wazuh app - Class for Wazuh reporting controller
 * Copyright (C) 2015-2020 Wazuh, Inc.
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
import { TabDescription as descriptions } from '../reporting/tab-description';
import * as TimSort from 'timsort';
import PdfPrinter from 'pdfmake/src/printer';
import { ErrorResponse } from './error-response';
import { VulnerabilityRequest } from '../reporting/vulnerability-request';
import { OverviewRequest } from '../reporting/overview-request';
import { RootcheckRequest } from '../reporting/rootcheck-request';
import { PciRequest } from '../reporting/pci-request';
import { GdprRequest } from '../reporting/gdpr-request';
import { TSCRequest } from '../reporting/tsc-request';
import { AuditRequest } from '../reporting/audit-request';
import { SyscheckRequest } from '../reporting/syscheck-request';
import PCI from '../integration-files/pci-requirements-pdfmake';
import GDPR from '../integration-files/gdpr-requirements-pdfmake';
import TSC from '../integration-files/tsc-requirements-pdfmake';
import PdfTable from '../reporting/generic-table';
import { WazuhApiCtrl } from './wazuh-api';
import clockIconRaw from '../reporting/clock-icon-raw';
import filterIconRaw from '../reporting/filter-icon-raw';
import ProcessEquivalence from '../../util/process-state-equivalence';
import { KeyEquivalence } from '../../util/csv-key-equivalence';
import { AgentConfiguration } from '../reporting/agent-configuration';

import {
  AgentsVisualizations,
  OverviewVisualizations
} from '../integration-files/visualizations';

import { log } from '../logger';
import { WAZUH_ALERTS_PATTERN } from '../../util/constants';

const BASE_OPTIMIZE_PATH = '../../../../optimize';
const REPORTING_PATH = `${BASE_OPTIMIZE_PATH}/wazuh/downloads/reports`;

export class WazuhReportingCtrl {
  /**
   * Constructor
   * @param {*} server
   */
  constructor(server) {
    log('reporting', 'Class constructor started', 'debug');
    this.server = server;
    this.fonts = {
      Roboto: {
        normal: path.join(
          __dirname,
          '../../public/utils/opensans/OpenSans-Light.ttf'
        ),
        bold: path.join(
          __dirname,
          '../../public/utils/opensans/OpenSans-Bold.ttf'
        ),
        italics: path.join(
          __dirname,
          '../../public/utils/opensans/OpenSans-Italic.ttf'
        ),
        bolditalics: path.join(
          __dirname,
          '../../public/utils/opensans/OpenSans-BoldItalic.ttf'
        ),
        monslight: path.join(
          __dirname,
          '../../public/utils/opensans/Montserrat-Light.ttf'
        )
      }
    };

    this.vulnerabilityRequest = new VulnerabilityRequest(this.server);
    this.overviewRequest = new OverviewRequest(this.server);
    this.rootcheckRequest = new RootcheckRequest(this.server);
    this.pciRequest = new PciRequest(this.server);
    this.gdprRequest = new GdprRequest(this.server);
    this.TSCRequest = new TSCRequest(this.server);
    this.auditRequest = new AuditRequest(this.server);
    this.syscheckRequest = new SyscheckRequest(this.server);

    this.printer = new PdfPrinter(this.fonts);

    this.dd = {
      styles: {
        h1: {
          fontSize: 22,
          monslight: true,
          color: '#00a9e5'
        },
        h2: {
          fontSize: 18,
          monslight: true,
          color: '#00a9e5'
        },
        h3: {
          fontSize: 16,
          monslight: true,
          color: '#00a9e5'
        },
        h4: {
          fontSize: 14,
          monslight: true,
          color: '#00a9e5'
        },
        standard: {
          color: '#333'
        },
        whiteColorFilters: {
          color: '#FFF',
          fontSize: 14
        },
        whiteColor: {
          color: '#FFF'
        }
      },
      pageMargins: [40, 80, 40, 80],
      header: {
        margin: [40, 20, 0, 0],
        columns: [
          {
            image: path.join(__dirname, '../../public/img/logo.png'),
            width: 190
          },
          {
            text: 'info@wazuh.com\nhttps://wazuh.com',
            alignment: 'right',
            margin: [0, 0, 40, 0],
            color: '#00a9e5'
          }
        ]
      },
      content: [],
      footer(currentPage, pageCount) {
        return {
          columns: [
            {
              text: 'Copyright © 2020 Wazuh, Inc.',
              color: '#00a9e5',
              margin: [40, 40, 0, 0]
            },
            {
              text: 'Page ' + currentPage.toString() + ' of ' + pageCount,
              alignment: 'right',
              margin: [0, 40, 40, 0],
              color: '#00a9e5'
            }
          ]
        };
      },
      pageBreakBefore(currentNode, followingNodesOnPage) {
        if (currentNode.id && currentNode.id.includes('splitvis')) {
          return (
            followingNodesOnPage.length === 6 ||
            followingNodesOnPage.length === 7
          );
        }
        if (
          (currentNode.id && currentNode.id.includes('splitsinglevis')) ||
          (currentNode.id && currentNode.id.includes('singlevis'))
        ) {
          return followingNodesOnPage.length === 6;
        }

        return false;
      }
    };

    this.apiRequest = new WazuhApiCtrl(server);

    log('reporting', 'Class constructor finished properly', 'debug');
  }

  /**
   * This performs the rendering of given tables
   * @param {Array<Object>} tables tables to render
   */
  renderTables(tables, isVis = true) {
    log('reporting:renderTables', 'Started to render tables', 'info');
    log('reporting:renderTables', `tables: ${tables.length}`, 'debug');
    log('reporting:renderTables', `isVis: ${isVis}`, 'debug');
    for (const table of tables) {
      let rowsparsed = [];
      rowsparsed = table.rows;
      if (Array.isArray(rowsparsed) && rowsparsed.length) {
        const rows =
          rowsparsed.length > 100 ? rowsparsed.slice(0, 99) : rowsparsed;
        this.dd.content.push({
          text: table.title,
          style: 'h3',
          pageBreak: 'before'
        });
        this.dd.content.push('\n');
        const full_body = [];
        const sortFunction = (a, b) =>
          parseInt(a[a.length - 1]) < parseInt(b[b.length - 1])
            ? 1
            : parseInt(a[a.length - 1]) > parseInt(b[b.length - 1])
            ? -1
            : 0;

        TimSort.sort(rows, sortFunction);

        const modifiedRows = [];
        for (const row of rows) {
          modifiedRows.push(
            row.map(cell => ({ text: cell || '-', style: 'standard' }))
          );
        }

        const widths = Array(table.columns.length - 1).fill('auto');
        widths.push('*');

        full_body.push(
          table.columns.map(col => ({
            text: col || '-',
            style: 'whiteColor',
            border: [0, 0, 0, 0]
          })),
          ...modifiedRows
        );
        this.dd.content.push({
          fontSize: 8,
          table: {
            headerRows: 1,
            widths,
            body: full_body
          },
          layout: {
            fillColor: i => (i === 0 ? '#00a9e5' : null),
            hLineColor: () => '#00a9e5',
            hLineWidth: () => 1,
            vLineWidth: () => 0
          }
        });
        this.dd.content.push('\n');
        log('reporting:renderTables', `Table rendered`, 'debug');
      }
    }
  }

  /**
   * This performs the rendering of given tables
   * @param {Array<Object>} tables tables to render
   */
  renderConfigTables(tables) {
    log(
      'reporting:renderConfigTables',
      'Started to render configuration tables',
      'info'
    );
    log('reporting:renderConfigTables', `tables: ${tables.length}`, 'debug');
    for (const table of tables) {
      let rowsparsed = table.rows;
      if (Array.isArray(rowsparsed) && rowsparsed.length) {
        const rows =
          rowsparsed.length > 100 ? rowsparsed.slice(0, 99) : rowsparsed;
        this.dd.content.push({
          text: table.title,
          style: { fontSize: 11, color: '#000' },
          margin: table.title && table.type === 'table' ? [0, 0, 0, 5] : ''
        });

        if (table.title === 'Monitored directories') {
          this.dd.content.push({
            text:
              'RT: Real time | WD: Who-data | Per.: Permission | MT: Modification time | SL: Symbolic link | RL: Recursion level',
            style: { fontSize: 8, color: '#00a9e5' },
            margin: [0, 0, 0, 5]
          });
        }

        const full_body = [];

        const modifiedRows = [];
        for (const row of rows) {
          modifiedRows.push(
            row.map(cell => ({ text: cell || '-', style: 'standard' }))
          );
        }
        let widths = [];
        widths = Array(table.columns.length - 1).fill('auto');
        widths.push('*');

        if (table.type === 'config') {
          full_body.push(
            table.columns.map(col => ({
              text: col || '-',
              border: [0, 0, 0, 20],
              fontSize: 0,
              colSpan: 2
            })),
            ...modifiedRows
          );
          this.dd.content.push({
            fontSize: 8,
            table: {
              headerRows: 0,
              widths,
              body: full_body,
              dontBreakRows: true
            },
            layout: {
              fillColor: i => (i === 0 ? '#fff' : null),
              hLineColor: () => '#D3DAE6',
              hLineWidth: () => 1,
              vLineWidth: () => 0
            }
          });
        } else if (table.type === 'table') {
          full_body.push(
            table.columns.map(col => ({
              text: col || '-',
              style: 'whiteColor',
              border: [0, 0, 0, 0]
            })),
            ...modifiedRows
          );
          this.dd.content.push({
            fontSize: 8,
            table: {
              headerRows: 1,
              widths,
              body: full_body
            },
            layout: {
              fillColor: i => (i === 0 ? '#00a9e5' : null),
              hLineColor: () => '#00a9e5',
              hLineWidth: () => 1,
              vLineWidth: () => 0
            }
          });
        }
        this.dd.content.push('\n');
      }
      log('reporting:renderConfigTables', `Table rendered`, 'debug');
    }
  }

  /**
   * Format Date to string YYYY-mm-ddTHH:mm:ss
   * @param {*} date JavaScript Date
   */
  formatDate(date) {
    log('reporting:formatDate', `Format date ${date}`, 'info');
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const str = `${year}-${month < 10 ? '0' + month : month}-${
      day < 10 ? '0' + day : day
    }T${hours < 10 ? '0' + hours : hours}:${
      minutes < 10 ? '0' + minutes : minutes
    }:${seconds < 10 ? '0' + seconds : seconds}`;
    log('reporting:formatDate', `str: ${str}`, 'debug');
    return str;
  }

  /**
   * This performs the rendering of given time range and filters
   * @param {Number} from Timestamp (ms) from
   * @param {Number} to Timestamp (ms) to
   * @param {String} filters E.g: cluster.name: wazuh AND rule.groups: vulnerability
   */
  renderTimeRangeAndFilters(from, to, filters, timeZone) {
    log(
      'reporting:renderTimeRangeAndFilters',
      `Started to render the time range and the filters`,
      'info'
    );
    log(
      'reporting:renderTimeRangeAndFilters',
      `from: ${from}, to: ${to}, filters: ${filters}, timeZone: ${timeZone}`,
      'debug'
    );
    const fromDate = new Date(
      new Date(from).toLocaleString('en-US', { timeZone })
    );
    const toDate = new Date(new Date(to).toLocaleString('en-US', { timeZone }));
    const str = `${this.formatDate(fromDate)} to ${this.formatDate(toDate)}`;

    this.dd.content.push({
      fontSize: 8,
      table: {
        widths: ['*'],
        body: [
          [
            {
              columns: [
                {
                  svg: clockIconRaw,
                  width: 10,
                  height: 10,
                  margin: [40, 5, 0, 0]
                },
                {
                  text: str || '-',
                  margin: [43, 0, 0, 0],
                  style: 'whiteColorFilters'
                }
              ]
            }
          ],
          [
            {
              columns: [
                {
                  svg: filterIconRaw,
                  width: 10,
                  height: 10,
                  margin: [40, 6, 0, 0]
                },
                {
                  text: filters || '-',
                  margin: [43, 0, 0, 0],
                  style: 'whiteColorFilters'
                }
              ]
            }
          ]
        ]
      },
      margin: [-40, 0, -40, 0],
      layout: {
        fillColor: () => '#00a9e5',
        hLineWidth: () => 0,
        vLineWidth: () => 0
      }
    });

    this.dd.content.push({ text: '\n' });
    log(
      'reporting:renderTimeRangeAndFilters',
      'Time range and filters rendered',
      'debug'
    );
  }

  /**
   * This do format to filters
   * @param {String} filters E.g: cluster.name: wazuh AND rule.groups: vulnerability
   * @param {String} searchBar search term
   */
  sanitizeFilters(filters, searchBar) {
    log('reporting:sanitizeFilters', `Started to sanitize filters`, 'info');
    log(
      'reporting:sanitizeFilters',
      `filters: ${filters.length}, searchBar: ${searchBar}`,
      'debug'
    );
    let str = '';

    const len = filters.length;
    for (let i = 0; i < len; i++) {
      const { negate, key, value, params, type } = filters[i].meta;
      str += `${negate ? 'NOT ' : ''}`;
      str += `${key}: `;
      str += `${
        type === 'range'
          ? `${params.gte}-${params.lt}`
          : !!value
          ? value
          : (params || {}).query
      }`;
      str += `${i === len - 1 ? '' : ' AND '}`;
    }

    if (searchBar) {
      str += ' AND ' + searchBar;
    }
    log('reporting:sanitizeFilters', `str: ${str}`, 'debug');
    return str;
  }

  /**
   * This performs the rendering of given header
   * @param {String} section section target
   * @param {Object} tab tab target
   * @param {Boolean} isAgents is agents section
   * @param {String} apiId ID of API
   */
  async renderHeader(section, tab, isAgents, apiId) {
    try {
      log(
        'reporting:renderHeader',
        `section: ${section}, tab: ${tab}, isAgents: ${isAgents}, apiId: ${apiId}`,
        'debug'
      );
      if (section && typeof section === 'string') {
        if (section !== 'agentConfig' && section !== 'groupConfig') {
          this.dd.content.push({
            text: descriptions[tab].title + ' report',
            style: 'h1'
          });
        } else if (section === 'agentConfig') {
          this.dd.content.push({
            text: `Agent ${isAgents} configuration`,
            style: 'h1'
          });
        } else if (section === 'groupConfig') {
          this.dd.content.push({
            text: 'Agents in group',
            style: { fontSize: 14, color: '#000' },
            margin: [0, 20, 0, 0]
          });
          if (section === 'groupConfig' && !Object.keys(isAgents).length) {
            this.dd.content.push({
              text: 'There are still no agents in this group.',
              style: { fontSize: 12, color: '#000' },
              margin: [0, 10, 0, 0]
            });
          }
        }
        this.dd.content.push('\n');
      }

      if (isAgents && typeof isAgents === 'object') {
        await this.buildAgentsTable(
          isAgents,
          apiId,
          section === 'groupConfig' ? tab : false
        );
      }

      if (isAgents && typeof isAgents === 'string') {
        const agent = await this.apiRequest.makeGenericRequest(
          'GET',
          `/agents`,
          { params: { agents_list: isAgents }},
          apiId
        );
        if (
          typeof ((((agent || {}).data || {}).affected_items || [])[0] || {}).status === 'string' &&
          ((((agent || {}).data || {}).affected_items || [])[0] || {}).status !== 'active'
        ) {
          this.dd.content.push({
            text: `Warning. Agent is ${agent.data.affected_items[0].status.toLowerCase()}`,
            style: 'standard'
          });
          this.dd.content.push('\n');
        }
        await this.buildAgentsTable([isAgents], apiId);

        if (((agent || {}).data || {}).group) {
          let agGroups = '';
          let index = 0;
          for (let ag of agent.data.group) {
            agGroups = agGroups.concat(ag);
            if (index < agent.data.group.length - 1) {
              agGroups = agGroups.concat(', ');
            }
            index++;
          }
          this.dd.content.push({
            text: `Group${agent.data.group.length > 1 ? 's' : ''}: ${agGroups}`,
            style: 'standard'
          });
          this.dd.content.push('\n');
        }
      }
      if (descriptions[tab] && descriptions[tab].description) {
        this.dd.content.push({
          text: descriptions[tab].description,
          style: 'standard'
        });
        this.dd.content.push('\n');
      }

      return;
    } catch (error) {
      log('reporting:renderHeader', error.message || error);
      return Promise.reject(error);
    }
  }

  /**
   * This check if title is suitable
   * @param {Object} item item of the title
   * @param {Boolean} isAgents is agents section
   * @param {Object} tab tab target
   */
  checkTitle(item, isAgents, tab) {
    log(
      'reporting:checkTitle',
      `Item ID ${item.id}, from ${
        isAgents ? 'agents' : 'overview'
      } and tab ${tab}`,
      'info'
    );

    const title = isAgents
      ? AgentsVisualizations[tab].filter(v => v._id === item.id)
      : OverviewVisualizations[tab].filter(v => v._id === item.id);
    return title;
  }

  /**
   * This performs the rendering of given visualizations
   * @param {Array<Objecys>} array Array of visualizations
   * @param {Boolean} isAgents is agents section
   * @param {Object} tab tab target
   */
  renderVisualizations(array, isAgents, tab) {
    log(
      'reporting:renderVisualizations',
      `${array.length} visualizations for tab ${tab}`,
      'info'
    );
    const single_vis = array.filter(item => item.width >= 600);
    const double_vis = array.filter(item => item.width < 600);

    for (const item of single_vis) {
      const title = this.checkTitle(item, isAgents, tab);
      this.dd.content.push({
        id: 'singlevis' + title[0]._source.title,
        text: title[0]._source.title,
        style: 'h3'
      });
      this.dd.content.push({ columns: [{ image: item.element, width: 500 }] });
      this.dd.content.push('\n');
    }

    let pair = [];

    for (const item of double_vis) {
      pair.push(item);
      if (pair.length === 2) {
        const title_1 = this.checkTitle(pair[0], isAgents, tab);
        const title_2 = this.checkTitle(pair[1], isAgents, tab);

        this.dd.content.push({
          columns: [
            {
              id: 'splitvis' + title_1[0]._source.title,
              text: title_1[0]._source.title,
              style: 'h3',
              width: 280
            },
            {
              id: 'splitvis' + title_2[0]._source.title,
              text: title_2[0]._source.title,
              style: 'h3',
              width: 280
            }
          ]
        });

        this.dd.content.push({
          columns: [
            { image: pair[0].element, width: 270 },
            { image: pair[1].element, width: 270 }
          ]
        });

        this.dd.content.push('\n');
        pair = [];
      }
    }

    if (double_vis.length % 2 !== 0) {
      const item = double_vis[double_vis.length - 1];
      const title = this.checkTitle(item, isAgents, tab);
      this.dd.content.push({
        columns: [
          {
            id: 'splitsinglevis' + title[0]._source.title,
            text: title[0]._source.title,
            style: 'h3',
            width: 280
          }
        ]
      });
      this.dd.content.push({ columns: [{ image: item.element, width: 280 }] });
      this.dd.content.push('\n');
    }
  }

  /**
   * This build the agents table
   * @param {Array<Strings>} ids ids of agents
   * @param {String} apiId API id
   */
  async buildAgentsTable(ids, apiId, multi = false) {
    if (!ids || !ids.length) return;
    log(
      'reporting:buildAgentsTable',
      `${ids.length} agents for API ${apiId}`,
      'info'
    );
    try {
      const rows = [];
      if (multi) {
        const agents = await this.apiRequest.makeGenericRequest(
          'GET',
          `/groups/${multi}/agents`,
          {},
          apiId
        );

        for (let item of ((agents || {}).data || {}).affected_items || []) {
          const str = Array(6).fill('-');
          if ((item || {}).id) str[0] = item.id;
          if ((item || {}).name) str[1] = item.name;
          if ((item || {}).ip) str[2] = item.ip;
          if ((item || {}).version) str[3] = item.version;
          // 3.7 <
          if ((item || {}).manager_host) str[4] = item.manager_host;
          // 3.7 >=
          if ((item || {}).manager) str[4] = item.manager;
          if ((item || {}).os && item.os.name && item.os.version)
            str[5] = `${item.os.name} ${item.os.version}`;
          str[6] = (item || {}).dateAdd ? item.dateAdd : '-';
          str[7] = (item || {}).lastKeepAlive ? item.lastKeepAlive : '-';
          rows.push(str);
        }
      } else {
        for (const item of ids) {
          let data = false;
          try {
            const agent = await this.apiRequest.makeGenericRequest(
              'GET',
              `/agents`,
              {params: {q:`id=${item}`}},
              apiId
              );
            if (agent && agent.data.affected_items[0]) {
              data = {};
              Object.assign(data, agent.data.affected_items[0]);
            }
          } catch (error) {
            log(
              'reporting:buildAgentsTable',
              `Skip agent due to: ${error.message || error}`,
              'debug'
            );
            continue;
          }
          const str = Array(6).fill('-');
          str[0] = item;
          if ((data || {}).name) str[1] = data.name;
          if ((data || {}).ip) str[2] = data.ip;
          if ((data || {}).version) str[3] = data.version;
          // 3.7 <
          if ((data || {}).manager_host) str[4] = data.manager_host;
          // 3.7 >=
          if ((data || {}).manager) str[4] = data.manager;
          if ((data || {}).os && data.os.name && data.os.version)
            str[5] = `${data.os.name} ${data.os.version}`;
          str[6] = (data || {}).dateAdd ? data.dateAdd : '-';
          str[7] = (data || {}).lastKeepAlive ? data.lastKeepAlive : '-';
          rows.push(str);
        }
      }
      PdfTable(
        this.dd,
        rows,
        [
          'ID',
          'Name',
          'IP',
          'Version',
          'Manager',
          'OS',
          'Registration date',
          'Last keep alive'
        ],
        null,
        null,
        true
      );

      this.dd.content.push('\n');
    } catch (error) {
      log('reporting:buildAgentsTable', error.message || error);
      return Promise.reject(error);
    }
  }

  /**
   * This load more information
   * @param {String} section section target
   * @param {Object} tab tab target
   * @param {String} apiId ID of API
   * @param {Number} from Timestamp (ms) from
   * @param {Number} to Timestamp (ms) to
   * @param {String} filters E.g: cluster.name: wazuh AND rule.groups: vulnerability
   * @param {String} pattern
   * @param {Object} agent agent target
   * @returns {Object} Extended information
   */
  async extendedInformation(
    section,
    tab,
    apiId,
    from,
    to,
    filters,
    pattern = WAZUH_ALERTS_PATTERN,
    agent = null
  ) {
    try {
      log(
        'reporting:extendedInformation',
        `Section ${section} and tab ${tab}, API is ${apiId}. From ${from} to ${to}. Filters ${filters}. Index pattern ${pattern}`,
        'info'
      );
      if (section === 'agents' && !agent) {
        throw new Error(
          'Reporting for specific agent needs an agent ID in order to work properly'
        );
      }

      const agents = await this.apiRequest.makeGenericRequest(
        'GET',
        '/agents',
        { params: {limit: 1 }},
        apiId
      );
      const totalAgents = agents.data.total_affected_items;

      if (section === 'overview' && tab === 'vuls') {
        log(
          'reporting:extendedInformation',
          'Fetching overview vulnerability detector metrics',
          'debug'
        );
        const low = await this.vulnerabilityRequest.uniqueSeverityCount(
          from,
          to,
          'Low',
          filters,
          pattern
        );
        const medium = await this.vulnerabilityRequest.uniqueSeverityCount(
          from,
          to,
          'Medium',
          filters,
          pattern
        );
        const high = await this.vulnerabilityRequest.uniqueSeverityCount(
          from,
          to,
          'High',
          filters,
          pattern
        );
        const critical = await this.vulnerabilityRequest.uniqueSeverityCount(
          from,
          to,
          'Critical',
          filters,
          pattern
        );

        this.dd.content.push({ text: 'Summary', style: 'h2' });
        this.dd.content.push('\n');
        const ulcustom = [];
        log(
          'reporting:extendedInformation',
          'Adding overview vulnerability detector metrics',
          'debug'
        );
        if (critical)
          ulcustom.push(
            `${critical} of ${totalAgents} agents have critical vulnerabilities.`
          );
        if (high)
          ulcustom.push(
            `${high} of ${totalAgents} agents have high vulnerabilities.`
          );
        if (medium)
          ulcustom.push(
            `${medium} of ${totalAgents} agents have medium vulnerabilities.`
          );
        if (low)
          ulcustom.push(
            `${low} of ${totalAgents} agents have low vulnerabilities.`
          );

        this.dd.content.push({
          ul: ulcustom
        });
        this.dd.content.push('\n');
        log(
          'reporting:extendedInformation',
          'Fetching overview vulnerability detector top 3 agents by category',
          'debug'
        );
        const lowRank = await this.vulnerabilityRequest.topAgentCount(
          from,
          to,
          'Low',
          filters,
          pattern
        );
        const mediumRank = await this.vulnerabilityRequest.topAgentCount(
          from,
          to,
          'Medium',
          filters,
          pattern
        );
        const highRank = await this.vulnerabilityRequest.topAgentCount(
          from,
          to,
          'High',
          filters,
          pattern
        );
        const criticalRank = await this.vulnerabilityRequest.topAgentCount(
          from,
          to,
          'Critical',
          filters,
          pattern
        );
        log(
          'reporting:extendedInformation',
          'Adding overview vulnerability detector top 3 agents by category',
          'debug'
        );
        if (criticalRank && criticalRank.length) {
          this.dd.content.push({
            text: 'Top 3 agents with critical severity vulnerabilities',
            style: 'h3'
          });
          this.dd.content.push('\n');
          await this.buildAgentsTable(criticalRank, apiId);
          this.dd.content.push('\n');
        }

        if (highRank && highRank.length) {
          this.dd.content.push({
            text: 'Top 3 agents with high severity vulnerabilities',
            style: 'h3'
          });
          this.dd.content.push('\n');
          await this.buildAgentsTable(highRank, apiId);
          this.dd.content.push('\n');
        }

        if (mediumRank && mediumRank.length) {
          this.dd.content.push({
            text: 'Top 3 agents with medium severity vulnerabilities',
            style: 'h3'
          });
          this.dd.content.push('\n');
          await this.buildAgentsTable(mediumRank, apiId);
          this.dd.content.push('\n');
        }

        if (lowRank && lowRank.length) {
          this.dd.content.push({
            text: 'Top 3 agents with low severity vulnerabilities',
            style: 'h3'
          });
          this.dd.content.push('\n');
          await this.buildAgentsTable(lowRank, apiId);
          this.dd.content.push('\n');
        }

        log(
          'reporting:extendedInformation',
          'Fetching overview vulnerability detector top 3 CVEs',
          'debug'
        );
        const cveRank = await this.vulnerabilityRequest.topCVECount(
          from,
          to,
          filters,
          pattern
        );
        log(
          'reporting:extendedInformation',
          'Adding overview vulnerability detector top 3 CVEs',
          'debug'
        );
        if (cveRank && cveRank.length) {
          this.dd.content.push({ text: 'Top 3 CVE', style: 'h2' });
          this.dd.content.push('\n');
          PdfTable(
            this.dd,
            cveRank.map(item => {
              return { top: cveRank.indexOf(item) + 1, name: item };
            }),
            ['Top', 'CVE'],
            ['top', 'name']
          );
          this.dd.content.push('\n');
        }
      }

      if (section === 'overview' && tab === 'general') {
        log(
          'reporting:extendedInformation',
          'Fetching top 3 agents with level 15 alerts',
          'debug'
        );
        const level15Rank = await this.overviewRequest.topLevel15(
          from,
          to,
          filters,
          pattern
        );
        log(
          'reporting:extendedInformation',
          'Adding top 3 agents with level 15 alerts',
          'debug'
        );
        if (level15Rank.length) {
          this.dd.content.push({
            text: 'Top 3 agents with level 15 alerts',
            style: 'h2'
          });
          await this.buildAgentsTable(level15Rank, apiId);
        }
      }

      if (section === 'overview' && tab === 'pm') {
        log(
          'reporting:extendedInformation',
          'Fetching most common rootkits',
          'debug'
        );
        const top5RootkitsRank = await this.rootcheckRequest.top5RootkitsDetected(
          from,
          to,
          filters,
          pattern
        );
        log(
          'reporting:extendedInformation',
          'Adding most common rootkits',
          'debug'
        );
        if (top5RootkitsRank && top5RootkitsRank.length) {
          this.dd.content.push({
            text: 'Most common rootkits found among your agents',
            style: 'h2'
          });
          this.dd.content.push('\n');
          this.dd.content.push({
            text:
              'Rootkits are a set of software tools that enable an unauthorized user to gain control of a computer system without being detected.',
            style: 'standard'
          });
          this.dd.content.push('\n');
          PdfTable(
            this.dd,
            top5RootkitsRank.map(item => {
              return { top: top5RootkitsRank.indexOf(item) + 1, name: item };
            }),
            ['Top', 'Rootkit'],
            ['top', 'name']
          );
          this.dd.content.push('\n');
        }
        log('reporting:extendedInformation', 'Fetching hidden pids', 'debug');
        const hiddenPids = await this.rootcheckRequest.agentsWithHiddenPids(
          from,
          to,
          filters,
          pattern
        );
        hiddenPids &&
          this.dd.content.push({
            text: `${hiddenPids} of ${totalAgents} agents have hidden processes`,
            style: 'h3'
          });
        !hiddenPids &&
          this.dd.content.push({
            text: `No agents have hidden processes`,
            style: 'h3'
          });
        this.dd.content.push('\n');

        const hiddenPorts = await this.rootcheckRequest.agentsWithHiddenPorts(
          from,
          to,
          filters,
          pattern
        );
        hiddenPorts &&
          this.dd.content.push({
            text: `${hiddenPorts} of ${totalAgents} agents have hidden ports`,
            style: 'h3'
          });
        !hiddenPorts &&
          this.dd.content.push({
            text: `No agents have hidden ports`,
            style: 'h3'
          });
        this.dd.content.push('\n');
      }

      if (['overview', 'agents'].includes(section) && tab === 'pci') {
        log(
          'reporting:extendedInformation',
          'Fetching top PCI DSS requirements',
          'debug'
        );
        const topPciRequirements = await this.pciRequest.topPCIRequirements(
          from,
          to,
          filters,
          pattern
        );
        this.dd.content.push({
          text: 'Most common PCI DSS requirements alerts found',
          style: 'h2'
        });
        this.dd.content.push('\n');
        for (const item of topPciRequirements) {
          const rules = await this.pciRequest.getRulesByRequirement(
            from,
            to,
            filters,
            item,
            pattern
          );
          this.dd.content.push({ text: `Requirement ${item}`, style: 'h3' });
          this.dd.content.push('\n');

          if (PCI[item]) {
            const content =
              typeof PCI[item] === 'string'
                ? { text: PCI[item], style: 'standard' }
                : PCI[item];
            this.dd.content.push(content);
            this.dd.content.push('\n');
          }

          rules &&
            rules.length &&
            PdfTable(
              this.dd,
              rules,
              ['Rule ID', 'Description'],
              ['ruleId', 'ruleDescription'],
              `Top rules for ${item} requirement`
            );
          this.dd.content.push('\n');
        }
      }

      if (['overview', 'agents'].includes(section) && tab === 'tsc') {
        log(
          'reporting:extendedInformation',
          'Fetching top TSC requirements',
          'debug'
        );
        const topTSCRequirements = await this.TSCRequest.topTSCRequirements(
          from,
          to,
          filters,
          pattern
        );
        this.dd.content.push({
          text: 'Most common TSC requirements alerts found',
          style: 'h2'
        });
        this.dd.content.push('\n');
        for (const item of topTSCRequirements) {
          const rules = await this.TSCRequest.getRulesByRequirement(
            from,
            to,
            filters,
            item,
            pattern
          );
          this.dd.content.push({ text: `Requirement ${item}`, style: 'h3' });
          this.dd.content.push('\n');

          if (TSC[item]) {
            const content =
              typeof TSC[item] === 'string'
                ? { text: TSC[item], style: 'standard' }
                : TSC[item];
            this.dd.content.push(content);
            this.dd.content.push('\n');
          }

          rules &&
            rules.length &&
            PdfTable(
              this.dd,
              rules,
              ['Rule ID', 'Description'],
              ['ruleId', 'ruleDescription'],
              `Top rules for ${item} requirement`
            );
          this.dd.content.push('\n');
        }
      }

      if (['overview', 'agents'].includes(section) && tab === 'gdpr') {
        log(
          'reporting:extendedInformation',
          'Fetching top GDPR requirements',
          'debug'
        );
        const topGdprRequirements = await this.gdprRequest.topGDPRRequirements(
          from,
          to,
          filters,
          pattern
        );
        this.dd.content.push({
          text: 'Most common GDPR requirements alerts found',
          style: 'h2'
        });
        this.dd.content.push('\n');
        for (const item of topGdprRequirements) {
          const rules = await this.gdprRequest.getRulesByRequirement(
            from,
            to,
            filters,
            item,
            pattern
          );
          this.dd.content.push({ text: `Requirement ${item}`, style: 'h3' });
          this.dd.content.push('\n');

          if (GDPR && GDPR[item]) {
            const content =
              typeof GDPR[item] === 'string'
                ? { text: GDPR[item], style: 'standard' }
                : GDPR[item];
            this.dd.content.push(content);
            this.dd.content.push('\n');
          }

          rules &&
            rules.length &&
            PdfTable(
              this.dd,
              rules,
              ['Rule ID', 'Description'],
              ['ruleId', 'ruleDescription'],
              `Top rules for ${item} requirement`
            );
          this.dd.content.push('\n');
        }
        this.dd.content.push('\n');
      }

      if (section === 'overview' && tab === 'audit') {
        log(
          'reporting:extendedInformation',
          'Fetching agents with high number of failed sudo commands',
          'debug'
        );
        const auditAgentsNonSuccess = await this.auditRequest.getTop3AgentsSudoNonSuccessful(
          from,
          to,
          filters,
          pattern
        );
        if (auditAgentsNonSuccess && auditAgentsNonSuccess.length) {
          this.dd.content.push({
            text: 'Agents with high number of failed sudo commands',
            style: 'h2'
          });
          await this.buildAgentsTable(auditAgentsNonSuccess, apiId);
        }
        const auditAgentsFailedSyscall = await this.auditRequest.getTop3AgentsFailedSyscalls(
          from,
          to,
          filters,
          pattern
        );
        if (auditAgentsFailedSyscall && auditAgentsFailedSyscall.length) {
          this.dd.content.push({
            text: 'Most common failing syscalls',
            style: 'h2'
          });
          this.dd.content.push('\n');
          PdfTable(
            this.dd,
            auditAgentsFailedSyscall,
            ['Agent ID', 'Syscall ID', 'Syscall'],
            ['agent', 'syscall.id', 'syscall.syscall'],
            null,
            false
          );
          this.dd.content.push('\n');
        }
      }

      if (section === 'overview' && tab === 'fim') {
        log(
          'reporting:extendedInformation',
          'Fetching top 3 rules for FIM',
          'debug'
        );
        const rules = await this.syscheckRequest.top3Rules(
          from,
          to,
          filters,
          pattern
        );

        if (rules && rules.length) {
          this.dd.content.push({ text: 'Top 3 FIM rules', style: 'h2' });
          this.dd.content.push('\n');
          this.dd.content.push({
            text: 'Top 3 rules that are generating most alerts.',
            style: 'standard'
          });
          this.dd.content.push('\n');
          PdfTable(
            this.dd,
            rules,
            ['Rule ID', 'Description'],
            ['ruleId', 'ruleDescription'],
            null
          );
          this.dd.content.push('\n');
        }

        log(
          'reporting:extendedInformation',
          'Fetching top 3 agents for FIM',
          'debug'
        );
        const agents = await this.syscheckRequest.top3agents(
          from,
          to,
          filters,
          pattern
        );

        if (agents && agents.length) {
          this.dd.content.push({
            text: 'Agents with suspicious FIM activity',
            style: 'h2'
          });
          this.dd.content.push('\n');
          this.dd.content.push({
            text:
              'Top 3 agents that have most FIM alerts from level 7 to level 15. Take care about them.',
            style: 'standard'
          });
          this.dd.content.push('\n');
          await this.buildAgentsTable(agents, apiId);
        }
      }



      if (section === 'agents' && tab === 'audit') {
        log(
          'reporting:extendedInformation',
          `Fetching most common failed syscalls`,
          'debug'
        );
        const auditFailedSyscall = await this.auditRequest.getTopFailedSyscalls(
          from,
          to,
          filters,
          pattern
        );
        auditFailedSyscall &&
          auditFailedSyscall.length &&
          PdfTable(
            this.dd,
            auditFailedSyscall,
            ['Syscall ID', 'Syscall'],
            ['id', 'syscall'],
            'Most common failing syscalls'
          );
        this.dd.content.push('\n');
      }

      if (section === 'agents' && tab === 'fim') {
        log(
          'reporting:extendedInformation',
          `Fetching syscheck database for agent ${agent}`,
          'debug'
        );
        const lastScan = await this.apiRequest.makeGenericRequest(
          'GET',
          `/syscheck/${agent}/last_scan`,
          {},
          apiId
        );

        if (lastScan && lastScan.data) {
          if (lastScan.data.affected_items[0].start && lastScan.data.affected_items[0].end) {
            this.dd.content.push({
              text: `Last file integrity monitoring scan was executed from ${lastScan.data.start} to ${lastScan.data.end}.`
            });
          } else if (lastScan.data.affected_items[0].start) {
            this.dd.content.push({
              text: `File integrity monitoring scan is currently in progress for this agent (started on ${lastScan.data.affected_items[0].start}).`
            });
          } else {
            this.dd.content.push({
              text: `File integrity monitoring scan is currently in progress for this agent.`
            });
          }
          this.dd.content.push('\n');
        }

        log(
          'reporting:extendedInformation',
          `Fetching last 10 deleted files for FIM`,
          'debug'
        );
        const lastTenDeleted = await this.syscheckRequest.lastTenDeletedFiles(
          from,
          to,
          filters,
          pattern
        );
        lastTenDeleted &&
          lastTenDeleted.length &&
          PdfTable(
            this.dd,
            lastTenDeleted,
            ['Path', 'Date'],
            ['path', 'date'],
            'Last 10 deleted files'
          );
        this.dd.content.push('\n');

        log(
          'reporting:extendedInformation',
          `Fetching last 10 modified files`,
          'debug'
        );
        const lastTenModified = await this.syscheckRequest.lastTenModifiedFiles(
          from,
          to,
          filters,
          pattern
        );
        lastTenModified &&
          lastTenModified.length &&
          PdfTable(
            this.dd,
            lastTenModified,
            ['Path', 'Date'],
            ['path', 'date'],
            'Last 10 modified files'
          );
        this.dd.content.push('\n');
      }

      if (section === 'agents' && tab === 'syscollector') {
        log(
          'reporting:extendedInformation',
          `Fetching hardware information for agent ${agent}`,
          'debug'
        );
        const hardware = await this.apiRequest.makeGenericRequest(
          'GET',
          `/syscollector/${agent}/hardware`,
          {},
          apiId
        );

        if (hardware && hardware.data) {
          this.dd.content.push({ text: 'Hardware information', style: 'h2' });
          this.dd.content.push('\n');
          const ulcustom = [];
          if (hardware.data.affected_items[0].cpu && hardware.data.affected_items[0].cpu.cores)
            ulcustom.push(hardware.data.affected_items[0].cpu.cores + ' cores ');
          if (hardware.data.affected_items[0].cpu && hardware.data.affected_items[0].cpu.name)
            ulcustom.push(hardware.data.affected_items[0].cpu.name);
          if (hardware.data.affected_items[0].ram && hardware.data.affected_items[0].ram.total)
            ulcustom.push(
              Number(hardware.data.affected_items[0].ram.total / 1024 / 1024).toFixed(2) +
              'GB RAM'
            );
          ulcustom &&
            ulcustom.length &&
            this.dd.content.push({
              ul: ulcustom
            });
          this.dd.content.push('\n');
        }

        log(
          'reporting:extendedInformation',
          `Fetching OS information for agent ${agent}`,
          'debug'
        );
        const os = await this.apiRequest.makeGenericRequest(
          'GET',
          `/syscollector/${agent}/os`,
          {},
          apiId
        );

        if (os && os.data) {
          const osData = os.data.affected_items[0];
          this.dd.content.push({ text: 'OS information', style: 'h2' });
          this.dd.content.push('\n');
          const ulcustom = [];
          if (osData.sysname) ulcustom.push(osData.sysname);
          if (osData.version) ulcustom.push(osData.version);
          if (osData.architecture) ulcustom.push(osData.architecture);
          if (osData.release) ulcustom.push(osData.release);
          if (osData.os && osData.os.name && osData.os.version)
            ulcustom.push(osData.os.name + ' ' + osData.os.version);
          ulcustom &&
            ulcustom.length &&
            this.dd.content.push({
              ul: ulcustom
            });
          this.dd.content.push('\n');
        }
        log(
          'reporting:extendedInformation',
          `Fetching top critical packages`,
          'debug'
        );
        const topCriticalPackages = await this.vulnerabilityRequest.topPackages(
          from,
          to,
          'Critical',
          filters,
          pattern
        );
        log(
          'reporting:extendedInformation',
          `Fetching top high packages`,
          'debug'
        );
        const topHighPackages = await this.vulnerabilityRequest.topPackages(
          from,
          to,
          'High',
          filters,
          pattern
        );

        const affected = [];
        affected.push(...topCriticalPackages, ...topHighPackages);
        if (affected && affected.length) {
          this.dd.content.push({
            text: 'Vulnerable packages found (last 24 hours)',
            style: 'h2'
          });
          this.dd.content.push('\n');
          PdfTable(
            this.dd,
            affected,
            ['Package', 'Severity'],
            ['package', 'severity'],
            null
          );
          this.dd.content.push('\n');
        }
      }

      if (section === 'agents' && tab === 'vuls') {
        const topCriticalPackages = await this.vulnerabilityRequest.topPackagesWithCVE(
          from,
          to,
          'Critical',
          filters,
          pattern
        );
        if (topCriticalPackages && topCriticalPackages.length) {
          this.dd.content.push({ text: 'Critical severity', style: 'h2' });
          this.dd.content.push('\n');
          this.dd.content.push({
            text:
              'These vulnerabilties are critical, please review your agent. Click on each link to read more about each found vulnerability.',
            style: 'standard'
          });
          this.dd.content.push('\n');
          const customul = [];
          for (const critical of topCriticalPackages) {
            customul.push({ text: critical.package, style: 'standard' });
            customul.push({
              ul: critical.references.map(item => ({
                text: item.substring(0,80) + '...',
                link: item,
                color: '#1EA5C8',
              }))
            });
          }
          this.dd.content.push({ ul: customul });
          this.dd.content.push('\n');
        }

        const topHighPackages = await this.vulnerabilityRequest.topPackagesWithCVE(
          from,
          to,
          'High',
          filters,
          pattern
        );
        if (topHighPackages && topHighPackages.length) {
          this.dd.content.push({ text: 'High severity', style: 'h2' });
          this.dd.content.push('\n');
          this.dd.content.push({
            text:
              'Click on each link to read more about each found vulnerability.',
            style: 'standard'
          });
          this.dd.content.push('\n');
          const customul = [];
          for (const critical of topHighPackages) {
            customul.push({ text: critical.package, style: 'standard' });
            customul.push({
              ul: critical.references.map(item => ({
                text: item,
                color: '#1EA5C8'
              }))
            });
          }
          customul && customul.length && this.dd.content.push({ ul: customul });
          this.dd.content.push('\n');
        }
      }

      return false;
    } catch (error) {
      log('reporting:extendedInformation', error.message || error);
      return Promise.reject(error);
    }
  }

  getConfigRows(data, labels) {
    log('reporting:getConfigRows', `Building configuration rows`, 'info');
    const result = [];
    for (let prop in data || []) {
      if (Array.isArray(data[prop])) {
        data[prop].forEach((x, idx) => {
          if (typeof x === 'object') data[prop][idx] = JSON.stringify(x);
        });
      }
      result.push([
        (labels || {})[prop] || KeyEquivalence[prop] || prop,
        data[prop] || '-'
      ]);
    }
    return result;
  }

  getConfigTables(data, section, tab, array = []) {
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
              ? data[key].map(x => {
                  return typeof x === 'object' ? JSON.stringify(x) : x + '\n';
                })
              : data[key];
        } else if (
          Array.isArray(data[key]) &&
          typeof data[key][0] === 'object'
        ) {
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
      rows: this.getConfigRows(plainData, (section.labels || [])[0])
    });
    for (let key in tableData) {
      const columns = Object.keys(tableData[key][0]);
      columns.forEach((col, i) => {
        columns[i] = col[0].toUpperCase() + col.slice(1);
      });

      const rows = tableData[key].map(x => {
        let row = [];
        for (let key in x) {
          row.push(
            typeof x[key] !== 'object'
              ? x[key]
              : Array.isArray(x[key])
              ? x[key].map(x => {
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
        rows
      });
    }

    nestedData.forEach(nest => {
      this.getConfigTables(nest, section, tab + 1, array);
    });

    return array;
  }

  /**
   * Builds a PDF report from multiple PNG images
   * @param {Object} req
   * @param {Object} reply
   * @returns {Object} pdf or ErrorResponse
   */
  async report(req, reply) {
    try {
      log('reporting:report', `Report started`, 'info');
      // Init
      this.printer = new PdfPrinter(this.fonts);
      this.dd.content = [];
      if (!fs.existsSync(path.join(__dirname, `${BASE_OPTIMIZE_PATH}/wazuh`))) {
        fs.mkdirSync(path.join(__dirname, `${BASE_OPTIMIZE_PATH}/wazuh`));
      }
      if (
        !fs.existsSync(
          path.join(__dirname, `${BASE_OPTIMIZE_PATH}/wazuh/downloads`)
        )
      ) {
        fs.mkdirSync(
          path.join(__dirname, `${BASE_OPTIMIZE_PATH}/wazuh/downloads`)
        );
      }
      if (!fs.existsSync(path.join(__dirname, REPORTING_PATH))) {
        fs.mkdirSync(path.join(__dirname, REPORTING_PATH));
      }

      if (req.payload && req.payload.array) {
        const payload = (req || {}).payload || {};
        const headers = (req || {}).headers || {};
        const { name, tab, section, isAgents, browserTimezone } = payload;
        const apiId = headers.id || false;
        const pattern = headers.pattern || false;
        const from = (payload.time || {}).from || false;
        const to = (payload.time || {}).to || false;
        let kfilters = req.payload.filters;
        const isAgentConfig = tab === 'agentConfig';
        const isGroupConfig = tab === 'groupConfig';

        // Pass the namespace if present to all the requesters
        if (pattern) {
          const spaces = this.server.plugins.spaces;
          const namespace = spaces && spaces.getSpaceId(req);
          this.vulnerabilityRequest.namespace = namespace;
          this.overviewRequest.namespace = namespace;
          this.rootcheckRequest.namespace = namespace;
          this.pciRequest.namespace = namespace;
          this.TSCRequest.namespace = namespace;
          this.gdprRequest.namespace = namespace;
          this.auditRequest.namespace = namespace;
          this.syscheckRequest.namespace = namespace;
        }

        if (!tab)
          throw new Error(
            'Reporting needs a valid app tab in order to work properly'
          );
        if (!section && !isAgentConfig && !isGroupConfig)
          throw new Error(
            'Reporting needs a valid app section in order to work properly'
          );
        if (!apiId)
          throw new Error(
            'Reporting needs a valid Wazuh API ID in order to work properly'
          );
        if (!name)
          throw new Error(
            'Reporting needs a valid file name in order to work properly'
          );

        let tables = [];
        if (isGroupConfig) {
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
            sca: 'Security configuration assessment'
          };
          const g_id = kfilters[0].group;
          kfilters = [];
          const enabledComponents = req.payload.components;
          this.dd.content.push({
            text: `Group ${g_id} configuration`,
            style: 'h1'
          });
          if (enabledComponents['0']) {
            let configuration = {};
            try {
              configuration = await this.apiRequest.makeGenericRequest(
                'GET',
                `/groups/${g_id}/configuration`, 
                {},
                apiId
              );
            } catch (error) {
              log('reporting:report', error.message || error, 'debug');
            }
            if (Object.keys(configuration.data.affected_items[0].config).length) {
              this.dd.content.push({
                text: 'Configurations',
                style: { fontSize: 14, color: '#000' },
                margin: [0, 10, 0, 15]
              });
              const section = {
                labels: [],
                isGroupConfig: true
              };
              for (let config of configuration.data.affected_items) {
                let filterTitle = '';
                let index = 0;
                for (let filter of Object.keys(config.filters)) {
                  filterTitle = filterTitle.concat(
                    `${filter}: ${config.filters[filter]}`
                  );
                  if (index < Object.keys(config.filters).length - 1) {
                    filterTitle = filterTitle.concat(' | ');
                  }
                  index++;
                }
                this.dd.content.push({
                  text: filterTitle,
                  style: 'h4',
                  margin: [0, 0, 0, 10]
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
                      config.config[_d].forEach(obj => {
                        if (!groups[obj.logformat]) {
                          groups[obj.logformat] = [];
                        }
                        groups[obj.logformat].push(obj);
                      });
                      Object.keys(groups).forEach(group => {
                        let saveidx = 0;
                        groups[group].forEach((x, i) => {
                          if (
                            Object.keys(x).length >
                            Object.keys(groups[group][saveidx]).length
                          ) {
                            saveidx = i;
                          }
                        });
                        const columns = Object.keys(groups[group][saveidx]);
                        const rows = groups[group].map(x => {
                          let row = [];
                          columns.forEach(key => {
                            row.push(
                              typeof x[key] !== 'object'
                                ? x[key]
                                : Array.isArray(x[key])
                                ? x[key].map(x => {
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
                          rows
                        });
                      });
                    } else if (_d === 'labels') {
                      const obj = config.config[_d][0].label;
                      const columns = Object.keys(obj[0]);
                      if (!columns.includes('hidden')) {
                        columns.push('hidden');
                      }
                      const rows = obj.map(x => {
                        let row = [];
                        columns.forEach(key => {
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
                        rows
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
                      tables.push(
                        ...this.getConfigTables(config.config[_d], section, idx)
                      );
                      let diffOpts = [];
                      Object.keys(section.opts).forEach(x => {
                        diffOpts.push(x);
                      });
                      const columns = [
                        '',
                        ...diffOpts.filter(
                          x => x !== 'check_all' && x !== 'check_sum'
                        )
                      ];
                      let rows = [];
                      directories.forEach(x => {
                        let row = [];
                        row.push(x.path);
                        columns.forEach(y => {
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
                        rows
                      });
                    } else {
                      tables.push(
                        ...this.getConfigTables(config.config[_d], section, idx)
                      );
                    }
                  }
                  for (const table of tables) {
                    this.renderConfigTables([table]);
                  }
                  idx++;
                  tables = [];
                }
                tables = [];
              }
            } else {
              this.dd.content.push({
                text: 'A configuration for this group has not yet been set up.',
                style: { fontSize: 12, color: '#000' },
                margin: [0, 10, 0, 15]
              });
            }
          }
          if (enabledComponents['1']) {
            let agentsInGroup = [];
            try {
              agentsInGroup = await this.apiRequest.makeGenericRequest(
                'GET',
                `/groups/${g_id}/agents`,
                {},
                apiId
              );
            } catch (error) {
              log('reporting:report', error.message || error, 'debug');
            }
            await this.renderHeader(
              tab,
              g_id,
              (((agentsInGroup || []).data || []).affected_items || []).map(x => x.id),
              apiId
            );
          }
        }
        if (isAgentConfig) {
          const configurations = AgentConfiguration.configurations;
          const enabledComponents = req.payload.components;
          const a_id = kfilters[0].agent;
          let wmodules = {};
          try {
            wmodules = await this.apiRequest.makeGenericRequest(
              'GET',
              `/agents/${a_id}/config/wmodules/wmodules`,
              {},
              apiId
            );
          } catch (error) {
            log('reporting:report', error.message || error, 'debug');
          }

          kfilters = [];
          await this.renderHeader(tab, tab, a_id, apiId);
          let idxComponent = 0;
          for (let config of configurations) {
            let titleOfSection = false;
            log(
              'reporting:report',
              `Iterate over ${config.sections.length} configuration sections`,
              'debug'
            );
            for (let section of config.sections) {
              if (
                enabledComponents[idxComponent] &&
                (section.config || section.wodle)
              ) {
                let idx = 0;
                const configs = (section.config || []).concat(
                  section.wodle || []
                );
                log(
                  'reporting:report',
                  `Iterate over ${configs.length} configuration blocks`,
                  'debug'
                );
                for (let conf of configs) {
                  let data = {};
                  try {
                    if (!conf['name']) {
                      data = await this.apiRequest.makeGenericRequest(
                        'GET',
                        `/agents/${a_id}/config/${conf.component}/${conf.configuration}`,
                        {},
                        apiId
                      );
                    } else {
                      for (let wodle of wmodules.data['wmodules']) {
                        if (Object.keys(wodle)[0] === conf['name']) {
                          data.data = wodle;
                        }
                      }
                    }
                    if (
                      data &&
                      data.data &&
                      Object.keys(data.data[Object.keys(data.data)[0]]).length >
                        0
                    ) {
                      if (!titleOfSection) {
                        this.dd.content.push({
                          text: config.title,
                          style: 'h1',
                          margin: [0, 0, 0, 15]
                        });
                        titleOfSection = true;
                      }
                      for (let _d of Object.keys(data.data)) {
                        if (idx === 0) {
                          this.dd.content.push({
                            text: section.subtitle,
                            style: 'h4'
                          });
                          this.dd.content.push({
                            text: section.desc,
                            style: { fontSize: 12, color: '#000' },
                            margin: [0, 0, 0, 10]
                          });
                        }
                        if (Array.isArray(data.data[_d])) {
                          /* LOG COLLECTOR */
                          if (conf.filterBy) {
                            let groups = [];
                            data.data[_d].forEach(obj => {
                              if (!groups[obj.logformat]) {
                                groups[obj.logformat] = [];
                              }
                              groups[obj.logformat].push(obj);
                            });
                            Object.keys(groups).forEach(group => {
                              let saveidx = 0;
                              groups[group].forEach((x, i) => {
                                if (
                                  Object.keys(x).length >
                                  Object.keys(groups[group][saveidx]).length
                                ) {
                                  saveidx = i;
                                }
                              });
                              const columns = Object.keys(
                                groups[group][saveidx]
                              );
                              const rows = groups[group].map(x => {
                                let row = [];
                                columns.forEach(key => {
                                  row.push(
                                    typeof x[key] !== 'object'
                                      ? x[key]
                                      : Array.isArray(x[key])
                                      ? x[key].map(x => {
                                          return x + '\n';
                                        })
                                      : JSON.stringify(x[key])
                                  );
                                });
                                return row;
                              });
                              columns.forEach((col, i) => {
                                columns[i] =
                                  col[0].toUpperCase() + col.slice(1);
                              });
                              tables.push({
                                title: section.labels[0][group],
                                type: 'table',
                                columns,
                                rows
                              });
                            });
                          } else if (_d.configuration !== 'socket') {
                            tables.push(
                              ...this.getConfigTables(
                                data.data[_d],
                                section,
                                idx
                              )
                            );
                          } else {
                            for (let _d2 of data.data[_d]) {
                              tables.push(
                                ...this.getConfigTables(_d2, section, idx)
                              );
                            }
                          }
                        } else {
                          /*INTEGRITY MONITORING MONITORED DIRECTORIES */
                          if (conf.matrix) {
                            const directories = data.data[_d].directories;
                            delete data.data[_d].directories;
                            tables.push(
                              ...this.getConfigTables(
                                data.data[_d],
                                section,
                                idx
                              )
                            );
                            let diffOpts = [];
                            Object.keys(section.opts).forEach(x => {
                              diffOpts.push(x);
                            });
                            const columns = [
                              '',
                              ...diffOpts.filter(
                                x => x !== 'check_all' && x !== 'check_sum'
                              )
                            ];
                            let rows = [];
                            directories.forEach(x => {
                              let row = [];
                              row.push(x.dir);
                              columns.forEach(y => {
                                if (y !== '') {
                                  row.push(
                                    x.opts.indexOf(y) > -1 ? 'yes' : 'no'
                                  );
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
                              rows
                            });
                          } else {
                            tables.push(
                              ...this.getConfigTables(
                                data.data[_d],
                                section,
                                idx
                              )
                            );
                          }
                        }
                      }
                    } else {
                      // Print the section title
                      if (!titleOfSection) {
                        this.dd.content.push({
                          text: config.title,
                          style: 'h1',
                          margin: [0, 0, 0, 15]
                        });
                        titleOfSection = true;
                      }
                      //Print the subtitle
                      this.dd.content.push({
                        text: section.subtitle,
                        style: 'h4'
                      });
                      // Print no configured module and link to the documentation
                      this.dd.content.push({
                        text: [
                          'This module is not configured. Please take a look on how to configure it in ',
                          {
                            text: `${section.subtitle.toLowerCase()} configuration.`,
                            link: section.docuLink,
                            style: { fontSize: 12, color: '#1a0dab' }
                          }
                        ],
                        margin: [0, 0, 0, 20]
                      });
                    }
                  } catch (error) {
                    log('reporting:report', error.message || error, 'debug');
                  }
                  idx++;
                }
                for (const table of tables) {
                  this.renderConfigTables([table]);
                }
              }
              idxComponent++;
              tables = [];
            }
          }
        }
        const isSycollector = tab === 'syscollector';
        if (isSycollector) {
          log('reporting:report', `Syscollector report`, 'debug');
          const agentId = ((((req || {}).payload || {}).filters[1] || {}).meta || {}).value;
          let agentOs = '';
          try {
            if ( !agentId ) {
              throw new Error(
                'Syscollector reporting needs a valid agent in order to work properly'
              );
            }
            const agent = await this.apiRequest.makeGenericRequest(
              'GET',
              '/agents',
              {params: {q: `id=${agentId}`}},
              apiId
            );
            agentOs = ((((agent || {}).data || {}).affected_items[0] || {}).os || {}).platform || '';
          } catch (error) {
            log('reporting:report', error.message || error, 'debug');
          }
          try {
            log(
              'reporting:report',
              `Fetching packages for agent ${agentId}`,
              'debug'
            );
            const packages = await this.apiRequest.makeGenericRequest(
              'GET',
              `/syscollector/${agentId}/packages`,
              {},
              apiId
            );
            if (packages && packages.data && packages.data.affected_items) {
              tables.push({
                title: 'Packages',
                columns:
                  agentOs === 'windows'
                    ? ['Name', 'Architecture', 'Version', 'Vendor']
                    : [
                        'Name',
                        'Architecture',
                        'Version',
                        'Vendor',
                        'Description'
                      ],
                rows: packages.data.affected_items.map(x => {
                  return agentOs === 'windows'
                    ? [x['name'], x['architecture'], x['version'], x['vendor']]
                    : [
                        x['name'],
                        x['architecture'],
                        x['version'],
                        x['vendor'],
                        x['description']
                      ];
                })
              });
            }
          } catch (error) {
            log('reporting:report', error.message || error, 'debug');
          }
          try {
            log(
              'reporting:report',
              `Fetching processes for agent ${agentId}`,
              'debug'
            );
            const processes = await this.apiRequest.makeGenericRequest(
              'GET',
              `/syscollector/${agentId}/processes`,
              {},
              apiId
            );
            if (processes && processes.data && processes.data.affected_items) {
              tables.push({
                title: 'Processes',
                columns:
                  agentOs === 'windows'
                    ? ['Name', 'CMD', 'Priority', 'NLWP']
                    : ['Name', 'Effective user', 'Priority', 'State'],
                rows: processes.data.affected_items.map(x => {
                  return agentOs === 'windows'
                    ? [x['name'], x['cmd'], x['priority'], x['nlwp']]
                    : [
                        x['name'],
                        x['euser'],
                        x['nice'],
                        ProcessEquivalence[x.state]
                      ];
                })
              });
            }
          } catch (error) {
            log('reporting:report', error.message || error, 'debug');
          }

          try {
            log(
              'reporting:report',
              `Fetching ports for agent ${agentId}`,
              'debug'
            );
            const ports = await this.apiRequest.makeGenericRequest(
              'GET',
              `/syscollector/${agentId}/ports`,
              {},
              apiId
            );
            if (ports && ports.data && ports.data.affected_items) {
              tables.push({
                title: 'Network ports',
                columns:
                  agentOs === 'windows'
                    ? ['Local IP', 'Local port', 'Process', 'State', 'Protocol']
                    : ['Local IP', 'Local port', 'State', 'Protocol'],
                rows: ports.data.affected_items.map(x => {
                  return agentOs === 'windows'
                    ? [
                        x['local']['ip'],
                        x['local']['port'],
                        x['process'],
                        x['state'],
                        x['protocol']
                      ]
                    : [
                        x['local']['ip'],
                        x['local']['port'],
                        x['state'],
                        x['protocol']
                      ];
                })
              });
            }
          } catch (error) {
            log('reporting:report', error.message || error, 'debug');
          }

          try {
            log(
              'reporting:report',
              `Fetching netiface for agent ${agentId}`,
              'debug'
            );
            const netiface = await this.apiRequest.makeGenericRequest(
              'GET',
              `/syscollector/${agentId}/netiface`,
              {},
              apiId
            );
            if (netiface && netiface.data && netiface.data.affected_items) {
              tables.push({
                title: 'Network interfaces',
                columns: ['Name', 'Mac', 'State', 'MTU', 'Type'],
                rows: netiface.data.affected_items.map(x => {
                  return [x['name'], x['mac'], x['state'], x['mtu'], x['type']];
                })
              });
            }
          } catch (error) {
            log('reporting:report', error.message || error, 'debug');
          }
          try {
            log(
              'reporting:report',
              `Fetching netaddr for agent ${agentId}`,
              'debug'
            );
            const netaddr = await this.apiRequest.makeGenericRequest(
              'GET',
              `/syscollector/${agentId}/netaddr`,
              {},
              apiId
            );
            if (netaddr && netaddr.data && netaddr.data.affected_items) {
              tables.push({
                title: 'Network settings',
                columns: [
                  'Interface',
                  'Address',
                  'Netmask',
                  'Protocol',
                  'Broadcast'
                ],
                rows: netaddr.data.affected_items.map(x => {
                  return [
                    x['iface'],
                    x['address'],
                    x['netmask'],
                    x['proto'],
                    x['broadcast']
                  ];
                })
              });
            }
          } catch (error) {
            log('reporting:report', error.message || error, 'debug');
          }

          try {
            log(
              'reporting:report',
              `Fetching hotfixes for agent ${agentId}`,
              'debug'
            );
            const hotfixes = await this.apiRequest.makeGenericRequest(
              'GET',
              `/syscollector/${agentId}/hotfixes`,
              {},
              apiId
            );
            if (hotfixes && hotfixes.data && hotfixes.data.affected_items) {
              tables.push({
                title: 'Windows updates',
                columns: ['Update code'],
                rows: hotfixes.data.affected_items.map(x => {
                  return [x['hotfix']];
                })
              });
            }
          } catch (error) {
            log('reporting:report', error.message || error, 'debug');
          }
        }

        if (!isAgentConfig && !isGroupConfig) {
          await this.renderHeader(section, tab, isAgents, apiId);
        }
        let filters = false;
        if (kfilters) {
          filters = this.sanitizeFilters(kfilters, req.payload.searchBar);
        }

        if (!isSycollector && req.payload.time && filters) {
          this.renderTimeRangeAndFilters(from, to, filters, browserTimezone);
        }

        if (req.payload.time || isSycollector) {
          await this.extendedInformation(
            section,
            tab,
            apiId,
            isSycollector ? from : new Date(from) - 1,
            isSycollector ? to : new Date(to) - 1,
            isSycollector
              ? filters + ' AND rule.groups: "vulnerability-detector"'
              : filters,
            pattern,
            isAgents
          );
        }

        if (!isSycollector && !isAgentConfig && !isGroupConfig) {
          this.renderVisualizations(req.payload.array, isAgents, tab);
        }
        if (isSycollector) {
          this.renderTables(tables, false);
        }
        if (
          !isSycollector &&
          !isAgentConfig &&
          !isGroupConfig &&
          req.payload.tables
        ) {
          this.renderTables(req.payload.tables);
        }

        const pdfDoc = this.printer.createPdfKitDocument(this.dd);
        await pdfDoc.pipe(
          fs.createWriteStream(
            path.join(__dirname, REPORTING_PATH + '/' + req.payload.name)
          )
        );
        pdfDoc.end();
      }
      return { error: 0, data: null };
    } catch (error) {
      log('reporting:report', error.message || error);
      // Delete generated file if an error occurred
      if (
        ((req || {}).payload || {}).name &&
        fs.existsSync(
          path.join(__dirname, REPORTING_PATH + '/' + req.payload.name)
        )
      ) {
        fs.unlinkSync(
          path.join(__dirname, REPORTING_PATH + '/' + req.payload.name)
        );
      }
      return ErrorResponse(error.message || error, 5029, 500, reply);
    }
  }

  /**
   * Fetch the reports list
   * @param {Object} req
   * @param {Object} reply
   * @returns {Array<Object>}reports list or ErrorResponse
   */
  async getReports(req, reply) {
    try {
      log('reporting:report', `Fetching created reports`, 'info');
      if (!fs.existsSync(path.join(__dirname, REPORTING_PATH))) {
        fs.mkdirSync(path.join(__dirname, REPORTING_PATH));
      }
      const list = [];
      const reportDir = path.join(__dirname, REPORTING_PATH);
      log('reporting:getReports', `Directory: ${reportDir}`, 'debug');
      const sortFunction = (a, b) =>
        a.date < b.date ? 1 : a.date > b.date ? -1 : 0;
      fs.readdirSync(reportDir).forEach(file => {
        const stats = fs.statSync(reportDir + '/' + file);
        file = {
          name: file,
          size: stats.size,
          date: stats.birthtime
        };
        list.push(file);
      });
      log(
        'reporting:getReports',
        `Using TimSort for sorting ${list.length} items`,
        'debug'
      );
      TimSort.sort(list, sortFunction);
      log('reporting:getReports', `Total: ${list.length}`, 'debug');
      return { list };
    } catch (error) {
      log('reporting:getReports', error.message || error);
      return ErrorResponse(error.message || error, 5031, 500, reply);
    }
  }

  /**
   * Fetch specific report
   * @param {Object} req
   * @param {Object} reply
   * @returns {Object} report or ErrorResponse
   */
  async getReportByName(req, reply) {
    try {
      log('reporting:getReportByName', `Fetching report by name`, 'info');
      if (!req.params || !req.params.name) throw new Error('Invalid file name');
      log('reporting:getReportByName', `Name: ${req.params.name}`, 'debug');
      return reply.file(
        path.join(__dirname, REPORTING_PATH + '/' + req.params.name)
      );
    } catch (error) {
      log('reporting:getReportByName', error.message || error);
      return ErrorResponse(error.message || error, 5030, 500, reply);
    }
  }

  /**
   * Delete specific report
   * @param {Object} req
   * @param {Object} reply
   * @returns {Object} status obj or ErrorResponse
   */
  async deleteReportByName(req, reply) {
    try {
      log('reporting:deleteReportByName', `Deleting report by name`, 'info');
      if (!req.params || !req.params.name) throw new Error('Invalid file name');
      log('reporting:deleteReportByName', `Name: ${req.params.name}`, 'debug');
      fs.unlinkSync(
        path.join(__dirname, REPORTING_PATH + '/' + req.params.name)
      );
      return { error: 0 };
    } catch (error) {
      log('reporting:deleteReportByName', error.message || error);
      return ErrorResponse(error.message || error, 5032, 500, reply);
    }
  }
}
