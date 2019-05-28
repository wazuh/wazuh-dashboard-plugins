/*
 * Wazuh app - Class for Wazuh reporting controller
 * Copyright (C) 2015-2019 Wazuh, Inc.
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
import rawParser from '../reporting/raw-parser';
import PdfPrinter from 'pdfmake/src/printer';
import { ErrorResponse } from './error-response';
import { VulnerabilityRequest } from '../reporting/vulnerability-request';
import { OverviewRequest } from '../reporting/overview-request';
import { RootcheckRequest } from '../reporting/rootcheck-request';
import { PciRequest } from '../reporting/pci-request';
import { GdprRequest } from '../reporting/gdpr-request';
import { AuditRequest } from '../reporting/audit-request';
import { SyscheckRequest } from '../reporting/syscheck-request';
import PCI from '../integration-files/pci-requirements-pdfmake';
import GDPR from '../integration-files/gdpr-requirements-pdfmake';
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

const REPORTING_PATH = '../../../../optimize/wazuh-reporting';

export class WazuhReportingCtrl {
  /**
   * Constructor
   * @param {*} server
   */
  constructor(server) {
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
    this.auditRequest = new AuditRequest(this.server);
    this.syscheckRequest = new SyscheckRequest(this.server);

    this.printer = new PdfPrinter(this.fonts);

    this.dd = {
      styles: {
        h1: {
          fontSize: 22,
          monslight: true,
          color: '#1ea5c8'
        },
        h2: {
          fontSize: 18,
          monslight: true,
          color: '#1ea5c8'
        },
        h3: {
          fontSize: 16,
          monslight: true,
          color: '#1ea5c8'
        },
        h4: {
          fontSize: 14,
          monslight: true,
          color: '#1ea5c8'
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
            color: '#1EA5C8'
          }
        ]
      },
      content: [],
      footer(currentPage, pageCount) {
        return {
          columns: [
            {
              text: 'Copyright © 2019 Wazuh, Inc.',
              color: '#1EA5C8',
              margin: [40, 40, 0, 0]
            },
            {
              text: 'Page ' + currentPage.toString() + ' of ' + pageCount,
              alignment: 'right',
              margin: [0, 40, 40, 0],
              color: '#1EA5C8'
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
  }

  /**
   * This performs the rendering of given tables
   * @param {Array<Object>} tables tables to render
   */
  renderTables(tables, isVis = true) {
    for (const table of tables) {
      let rowsparsed = [];
      if (isVis) {
        rowsparsed = rawParser(table.rawResponse, table.columns);
      } else {
        rowsparsed = table.rows;
      }
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
            row.map(cell => ({ text: cell, style: 'standard' }))
          );
        }

        const widths = Array(table.columns.length - 1).fill('auto');
        widths.push('*');

        full_body.push(
          table.columns.map(col => ({
            text: col,
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
            fillColor: i => (i === 0 ? '#78C8DE' : null),
            hLineColor: () => '#78C8DE',
            hLineWidth: () => 1,
            vLineWidth: () => 0
          }
        });
        this.dd.content.push('\n');
      }
    }
  }

  /**
   * This performs the rendering of given tables
   * @param {Array<Object>} tables tables to render
   */
  renderConfigTables(tables) {
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
            text: 'RT: Real time | WD: Who-data | Per.: Permission | MT: Modification time | SL: Symbolic link | RL: Recursion level',
            style: { fontSize: 8, color: '#78C8DE' },
            margin: [0, 0, 0, 5]
          });
        }

        const full_body = [];

        const modifiedRows = [];
        for (const row of rows) {
          modifiedRows.push(
            row.map(cell => ({ text: cell, style: 'standard' }))
          );
        }
        let widths = [];
        widths = Array(table.columns.length - 1).fill('auto');
        widths.push('*');

        if (table.type === 'config') {
          full_body.push(
            table.columns.map(col => ({
              text: col,
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
              text: col,
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
              fillColor: i => (i === 0 ? '#78C8DE' : null),
              hLineColor: () => '#78C8DE',
              hLineWidth: () => 1,
              vLineWidth: () => 0
            }
          });
        }
        this.dd.content.push('\n');
      }
    }
  }

  /**
   * Format Date to string YYYY-mm-ddTHH:mm:ss
   * @param {*} date JavaScript Date
   */
  formatDate(date) {
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
    return str;
  }

  /**
   * This performs the rendering of given time range and filters
   * @param {Number} from Timestamp (ms) from
   * @param {Number} to Timestamp (ms) to
   * @param {String} filters E.g: cluster.name: wazuh AND rule.groups: vulnerability
   */
  renderTimeRangeAndFilters(from, to, filters, timeZone) {
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
                  image: clockIconRaw,
                  width: 10,
                  height: 10,
                  margin: [40, 4, 0, 0]
                },
                {
                  text: str,
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
                  image: filterIconRaw,
                  width: 10,
                  height: 10,
                  margin: [40, 4, 0, 0]
                },
                {
                  text: filters,
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
        fillColor: () => '#78C8DE',
        hLineWidth: () => 0,
        vLineWidth: () => 0
      }
    });

    this.dd.content.push({ text: '\n' });
  }

  /**
   * This do format to filters
   * @param {String} filters E.g: cluster.name: wazuh AND rule.groups: vulnerability
   * @param {String} searchBar search term
   */
  sanitizeFilters(filters, searchBar) {
    let str = '';

    const len = filters.length;
    for (let i = 0; i < len; i++) {
      const filter = filters[i];

      str +=
        i === len - 1
          ? (filter.meta.negate ? 'NOT ' : '') +
          filter.meta.key +
          ': ' +
          filter.meta.value
          : (filter.meta.negate ? 'NOT ' : '') +
          filter.meta.key +
          ': ' +
          filter.meta.value +
          ' AND ';
    }

    if (searchBar) {
      str += ' AND ' + searchBar;
    }

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
            text: `Group ${tab} configuration`,
            style: 'h1'
          });
          this.dd.content.push({
            text: `${isAgents.length} Agents in group`,
            style: { fontSize: 14, color: '#000' },
            margin: [0, 20, 0, 0]
          });
        }
        this.dd.content.push('\n');
      }

      if (isAgents && typeof isAgents === 'object') {
        await this.buildAgentsTable(isAgents, apiId);
      }

      if (isAgents && typeof isAgents === 'string') {
        const agent = await this.apiRequest.makeGenericRequest(
          'GET',
          `/agents/${isAgents}`,
          {},
          apiId
        );
        if (
          typeof ((agent || {}).data || {}).status === 'string' &&
          ((agent || {}).data || {}).status !== 'Active'
        ) {
          this.dd.content.push({
            text: `Warning. Agent is ${agent.data.status.toLowerCase()}`,
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
  async buildAgentsTable(ids, apiId) {
    if (!ids || !ids.length) return;
    try {
      const rows = [];
      for (const item of ids) {
        let data = false;
        try {
          const agent = await this.apiRequest.makeGenericRequest(
            'GET',
            `/agents/${item}`,
            {},
            apiId
          );
          if (agent && agent.data) {
            data = {};
            Object.assign(data, agent.data);
          }
        } catch (error) {
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
    pattern = 'wazuh-alerts-3.x-*',
    agent = null
  ) {
    try {
      if (section === 'agents' && !agent) {
        throw new Error(
          'Reporting for specific agent needs an agent ID in order to work properly'
        );
      }

      const agents = await this.apiRequest.makeGenericRequest(
        'GET',
        '/agents',
        { limit: 1 },
        apiId
      );
      const totalAgents = agents.data.totalItems;

      if (section === 'overview' && tab === 'vuls') {
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

        const cveRank = await this.vulnerabilityRequest.topCVECount(
          from,
          to,
          filters,
          pattern
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
        const level15Rank = await this.overviewRequest.topLevel15(
          from,
          to,
          filters,
          pattern
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
        const top5RootkitsRank = await this.rootcheckRequest.top5RootkitsDetected(
          from,
          to,
          filters,
          pattern
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

      if (['overview', 'agents'].includes(section) && tab === 'gdpr') {
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

      if (section === 'agents' && tab === 'pm') {
        const database = await this.apiRequest.makeGenericRequest(
          'GET',
          `/rootcheck/${agent}`,
          { limit: 15 },
          apiId
        );
        //const cis = await this.apiRequest.makeGenericRequest('GET', `/rootcheck/${agent}/cis`, {}, apiId);
        const pci = await this.apiRequest.makeGenericRequest(
          'GET',
          `/rootcheck/${agent}/pci`,
          {},
          apiId
        );
        const lastScan = await this.apiRequest.makeGenericRequest(
          'GET',
          `/rootcheck/${agent}/last_scan`,
          {},
          apiId
        );

        if (lastScan && lastScan.data) {
          if (lastScan.data.start && lastScan.data.end) {
            this.dd.content.push({
              text: `Last policy monitoring scan was executed from ${
                lastScan.data.start
                } to ${lastScan.data.end}.`,
              style: 'standard'
            });
          } else if (lastScan.data.start) {
            this.dd.content.push({
              text: `Policy monitoring scan is currently in progress for this agent (started on ${
                lastScan.data.start
                }).`,
              style: 'standard'
            });
          } else {
            this.dd.content.push({
              text: `Policy monitoring scan is currently in progress for this agent.`,
              style: 'standard'
            });
          }
          this.dd.content.push('\n');
        }

        if (((database || {}).data || {}).items) {
          PdfTable(
            this.dd,
            database.data.items,
            ['Date', 'Status', 'Event'],
            ['readDay', 'status', 'event'],
            'Last entries from policy monitoring scan'
          );
          this.dd.content.push('\n');
        }

        if (((pci || {}).data || {}).items) {
          this.dd.content.push({
            text: 'Fired rules due to PCI requirements',
            style: 'h2',
            pageBreak: 'before'
          });
          this.dd.content.push('\n');
          for (const item of pci.data.items) {
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

            PdfTable(
              this.dd,
              rules,
              ['Rule ID', 'Description'],
              ['ruleId', 'ruleDescription']
            );
            this.dd.content.push('\n');
          }
        }

        const top5RootkitsRank = await this.rootcheckRequest.top5RootkitsDetected(
          from,
          to,
          filters,
          pattern,
          10
        );
        if (top5RootkitsRank && top5RootkitsRank.length) {
          this.dd.content.push({ text: 'Rootkits files found', style: 'h2' });
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
      }

      if (section === 'agents' && tab === 'audit') {
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
        const lastScan = await this.apiRequest.makeGenericRequest(
          'GET',
          `/syscheck/${agent}/last_scan`,
          {},
          apiId
        );

        if (lastScan && lastScan.data) {
          if (lastScan.data.start && lastScan.data.end) {
            this.dd.content.push({
              text: `Last file integrity monitoring scan was executed from ${
                lastScan.data.start
                } to ${lastScan.data.end}.`
            });
          } else if (lastScan.data.start) {
            this.dd.content.push({
              text: `File integrity monitoring scan is currently in progress for this agent (started on ${
                lastScan.data.start
                }).`
            });
          } else {
            this.dd.content.push({
              text: `File integrity monitoring scan is currently in progress for this agent.`
            });
          }
          this.dd.content.push('\n');
        }

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
          if (hardware.data.cpu && hardware.data.cpu.cores)
            ulcustom.push(hardware.data.cpu.cores + ' cores ');
          if (hardware.data.cpu && hardware.data.cpu.name)
            ulcustom.push(hardware.data.cpu.name);
          if (hardware.data.ram && hardware.data.ram.total)
            ulcustom.push(
              Number(hardware.data.ram.total / 1024 / 1024).toFixed(2) +
              'GB RAM'
            );
          ulcustom &&
            ulcustom.length &&
            this.dd.content.push({
              ul: ulcustom
            });
          this.dd.content.push('\n');
        }

        const os = await this.apiRequest.makeGenericRequest(
          'GET',
          `/syscollector/${agent}/os`,
          {},
          apiId
        );

        if (os && os.data) {
          this.dd.content.push({ text: 'OS information', style: 'h2' });
          this.dd.content.push('\n');
          const ulcustom = [];
          if (os.data.sysname) ulcustom.push(os.data.sysname);
          if (os.data.version) ulcustom.push(os.data.version);
          if (os.data.architecture) ulcustom.push(os.data.architecture);
          if (os.data.release) ulcustom.push(os.data.release);
          if (os.data.os && os.data.os.name && os.data.os.version)
            ulcustom.push(os.data.os.name + ' ' + os.data.os.version);
          ulcustom &&
            ulcustom.length &&
            this.dd.content.push({
              ul: ulcustom
            });
          this.dd.content.push('\n');
        }

        const topCriticalPackages = await this.vulnerabilityRequest.topPackages(
          from,
          to,
          'Critical',
          filters,
          pattern
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
                text: item,
                color: '#1EA5C8'
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
      return Promise.reject(error);
    }
  }

  getConfigRows = (data, labels) => {
    const result = [];
    for (let prop in data || []) {
      result.push([
        (labels || {})[prop] || KeyEquivalence[prop] || prop,
        data[prop] || '-'
      ]);
    }
    return result;
  };

  getConfigTables = (data, section, tab, array = []) => {
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
                return x + '\n';
              })
              : data[key];
        } else if (Array.isArray(data[key]) && typeof data[key][0] === 'object') {
          tableData[key] = data[key];
        } else {
          nestedData.push(data[key]);
        }
      }
    }
    array.push({
      title: (section.options || {}).hideHeader
        ? ''
        : (section.tabs || [])[tab] || '',
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
  };

  /**
   * Builds a PDF report from multiple PNG images
   * @param {Object} req
   * @param {Object} reply
   * @returns {Object} pdf or ErrorResponse
   */
  async report(req, reply) {
    try {
      // Init
      this.printer = new PdfPrinter(this.fonts);
      this.dd.content = [];
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
          const g_id = kfilters[0].group;
          let agentsInGroup = [];
          try {
            agentsInGroup = await this.apiRequest.makeGenericRequest(
              'GET',
              `/agents/groups/${g_id}`,
              {},
              apiId
            );
          } catch (err) { } //eslint-disable-line
          await this.renderHeader(
            tab,
            g_id,
            (((agentsInGroup || []).data || []).items || []).map(x => x.id),
            apiId
          );
          kfilters = [];
          let configuration = {};
          try {
            configuration = await this.apiRequest.makeGenericRequest(
              'GET',
              `/agents/groups/${g_id}/configuration`,
              {},
              apiId
            );
          } catch (err) { } //eslint-disable-line
          if (Object.keys(configuration.data.items[0].config).length) {
            this.dd.content.push({
              text: `${configuration.data.items.length} Configurations`,
              style: { fontSize: 14, color: '#000' },
              margin: [0, 10, 0, 15]
            });
            const section = {
              labels: []
            };
            for (let config of configuration.data.items) {
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
                    for (let cn of s.config || []) {
                      if (cn.configuration === _d) {
                        section.labels = s.labels;
                      }
                    }
                    for (let wo of s.wodle || []) {
                      if (wo.name === _d) {
                        section.labels = s.labels;
                      }
                    }
                  }
                }
                section.tabs.push(_d);
                if (Array.isArray(config.config[_d])) {
                  for (let _d2 of config.config[_d]) {
                    tables.push(...this.getConfigTables(_d2, section, idx));
                  }
                } else {
                  tables.push(
                    ...this.getConfigTables(config.config[_d], section, idx)
                  );
                }
                for (const table of tables) {
                  this.renderConfigTables([table]);
                }
                idx++;
              }
              tables = [];
            }
          }
        }
        if (isAgentConfig) {
          const configurations = AgentConfiguration.configurations;
          const a_id = kfilters[0].agent;
          let wmodules = {};
          try {
            wmodules = await this.apiRequest.makeGenericRequest(
              'GET',
              `/agents/${a_id}/config/wmodules/wmodules`,
              {},
              apiId
            );
          } catch (err) { } //eslint-disable-line
          kfilters = [];
          await this.renderHeader(tab, tab, a_id, apiId);
          for (let config of configurations) {
            this.dd.content.push({
              text: config.title,
              style: 'h1',
              margin: [0, 0, 0, 15]
            });
            for (let section of config.sections) {
              if (section.config || section.wodle) {
                let idx = 0;
                const configs = (section.config || []).concat(
                  section.wodle || []
                );
                for (let conf of configs) {
                  let data = {};
                  try {
                    if (!conf['name']) {
                      data = await this.apiRequest.makeGenericRequest(
                        'GET',
                        `/agents/${a_id}/config/${conf.component}/${
                        conf.configuration
                        }`,
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
                                columns[i] = col[0].toUpperCase() + col.slice(1);
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
                              ...this.getConfigTables(data.data[_d], section, idx)
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
                            const columns = ['', ...diffOpts.filter(x =>
                              (x !== 'check_all' && x !== 'check_sum'))];
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
                    }
                  } catch (err) { } //eslint-disable-line
                  idx++;
                }
                for (const table of tables) {
                  this.renderConfigTables([table]);
                }
              }
              tables = [];
            }
          }
        }
        const isSycollector = tab === 'syscollector';
        if (isSycollector) {
          let agentId = '';
          let agentOs = '';
          try {
            if (
              !req.payload.filters ||
              !req.payload.filters[1] ||
              !req.payload.filters[1].meta ||
              !req.payload.filters[1].meta.value
            ) {
              throw new Error(
                'Syscollector reporting needs a valid agent in order to work properly'
              );
            }
            const agent = await this.apiRequest.makeGenericRequest(
              'GET',
              `/agents/${req.payload.filters[1].meta.value}`,
              {},
              apiId
            );
            agentId =
              agent && agent.data && agent.data.id
                ? agent.data.id
                : req.payload.filters[1].meta.value;
            agentOs =
              agent && agent.data && agent.data.os && agent.data.os.platform
                ? agent.data.os.platform
                : '';
          } catch (err) { } //eslint-disable-line
          try {
            const packages = await this.apiRequest.makeGenericRequest(
              'GET',
              `/syscollector/${agentId}/packages`,
              {},
              apiId
            );
            if (packages && packages.data && packages.data.items) {
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
                rows: packages.data.items.map(x => {
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
          } catch (err) { } //eslint-disable-line
          try {
            const processes = await this.apiRequest.makeGenericRequest(
              'GET',
              `/syscollector/${agentId}/processes`,
              {},
              apiId
            );
            if (processes && processes.data && processes.data.items) {
              tables.push({
                title: 'Processes',
                columns:
                  agentOs === 'windows'
                    ? ['Name', 'CMD', 'Priority', 'NLWP']
                    : ['Name', 'Effective user', 'Priority', 'State'],
                rows: processes.data.items.map(x => {
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
          } catch (err) { } //eslint-disable-line

          try {
            const ports = await this.apiRequest.makeGenericRequest(
              'GET',
              `/syscollector/${agentId}/ports`,
              {},
              apiId
            );
            if (ports && ports.data && ports.data.items) {
              tables.push({
                title: 'Network ports',
                columns: [
                  'Local IP',
                  'Local port',
                  'Process',
                  'State',
                  'Protocol'
                ],
                rows: ports.data.items.map(x => {
                  return [
                    x['local']['ip'],
                    x['local']['port'],
                    x['process'],
                    x['state'],
                    x['protocol']
                  ];
                })
              });
            }
          } catch (err) { } //eslint-disable-line

          try {
            const netiface = await this.apiRequest.makeGenericRequest(
              'GET',
              `/syscollector/${agentId}/netiface`,
              {},
              apiId
            );
            if (netiface && netiface.data && netiface.data.items) {
              tables.push({
                title: 'Network interfaces',
                columns: ['Name', 'Mac', 'State', 'MTU', 'Type'],
                rows: netiface.data.items.map(x => {
                  return [x['name'], x['mac'], x['state'], x['mtu'], x['type']];
                })
              });
            }
          } catch (err) { } //eslint-disable-line
          try {
            const netaddr = await this.apiRequest.makeGenericRequest(
              'GET',
              `/syscollector/${agentId}/netaddr`,
              {},
              apiId
            );
            if (netaddr && netaddr.data && netaddr.data.items) {
              tables.push({
                title: 'Network settings',
                columns: [
                  'Interface',
                  'Address',
                  'Netmask',
                  'Protocol',
                  'Broadcast'
                ],
                rows: netaddr.data.items.map(x => {
                  return [
                    x['interface'],
                    x['address'],
                    x['netmask'],
                    x['protocol'],
                    x['broadcast']
                  ];
                })
              });
            }
          } catch (err) { } //eslint-disable-line
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
      if (!fs.existsSync(path.join(__dirname, REPORTING_PATH))) {
        fs.mkdirSync(path.join(__dirname, REPORTING_PATH));
      }
      const list = [];
      const reportDir = path.join(__dirname, REPORTING_PATH);
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
      TimSort.sort(list, sortFunction);
      return { list: list };
    } catch (error) {
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
      if (!req.params || !req.params.name) throw new Error('Invalid file name');
      return reply.file(
        path.join(__dirname, REPORTING_PATH + '/' + req.params.name)
      );
    } catch (error) {
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
      if (!req.params || !req.params.name) throw new Error('Invalid file name');
      fs.unlinkSync(
        path.join(__dirname, REPORTING_PATH + '/' + req.params.name)
      );
      return { error: 0 };
    } catch (error) {
      return ErrorResponse(error.message || error, 5032, 500, reply);
    }
  }
}
