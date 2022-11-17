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
import * as VulnerabilityRequest from '../lib/reporting/vulnerability-request';
import * as OverviewRequest from '../lib/reporting/overview-request';
import * as RootcheckRequest from '../lib/reporting/rootcheck-request';
import * as PCIRequest from '../lib/reporting/pci-request';
import * as GDPRRequest from '../lib/reporting/gdpr-request';
import * as TSCRequest from '../lib/reporting/tsc-request';
import * as AuditRequest from '../lib/reporting/audit-request';
import * as SyscheckRequest from '../lib/reporting/syscheck-request';
import PCI from '../integration-files/pci-requirements-pdfmake';
import GDPR from '../integration-files/gdpr-requirements-pdfmake';
import TSC from '../integration-files/tsc-requirements-pdfmake';
import ProcessEquivalence from '../lib/process-state-equivalence';
import { KeyEquivalence } from '../../common/csv-key-equivalence';
import { AgentConfiguration } from '../lib/reporting/agent-configuration';
import { KibanaRequest, RequestHandlerContext, KibanaResponseFactory } from 'src/core/server';
import { ReportPrinter } from '../lib/reporting/printer';
import { log } from '../lib/logger';
import {
  WAZUH_ALERTS_PATTERN,
  WAZUH_DATA_DOWNLOADS_DIRECTORY_PATH,
  WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH,
  AUTHORIZED_AGENTS,
  API_NAME_AGENT_STATUS,
} from '../../common/constants';
import { createDirectoryIfNotExists, createDataDirectoryIfNotExists } from '../lib/filesystem';
import moment from 'moment';
import { agentStatusLabelByAgentStatus } from '../../common/services/wz_agent_status';

export class WazuhReportingCtrl {
  constructor() {}

  /**
   * This do format to filters
   * @param {String} filters E.g: cluster.name: wazuh AND rule.groups: vulnerability
   * @param {String} searchBar search term
   */
  private sanitizeKibanaFilters(filters: any, searchBar?: string): [string, string] {
    log('reporting:sanitizeKibanaFilters', `Started to sanitize filters`, 'info');
    log(
      'reporting:sanitizeKibanaFilters',
      `filters: ${filters.length}, searchBar: ${searchBar}`,
      'debug'
    );
    let str = '';

    const agentsFilter: any = [];

    //separate agents filter
    filters = filters.filter((filter) => {
      if (filter.meta.controlledBy === AUTHORIZED_AGENTS) {
        agentsFilter.push(filter);
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

    const agentsFilterStr = agentsFilter.map((filter) => filter.meta.value).join(',');

    log(
      'reporting:sanitizeKibanaFilters',
      `str: ${str}, agentsFilterStr: ${agentsFilterStr}`,
      'debug'
    );

    return [str, agentsFilterStr];
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
        await this.buildAgentsTable(
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
        await this.buildAgentsTable(context, printer, [isAgents], apiId);

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

  /**
   * This build the agents table
   * @param {Array<Strings>} ids ids of agents
   * @param {String} apiId API id
   */
  private async buildAgentsTable(context, printer: ReportPrinter, agentIDs: string[], apiId: string, groupID: string = '') {
    const dateFormat = await context.core.uiSettings.client.get('dateFormat');
    if ((!agentIDs || !agentIDs.length) && !groupID) return;
    log('reporting:buildAgentsTable', `${agentIDs.length} agents for API ${apiId}`, 'info');
    try {
      let agentsData = [];
      if (groupID) {
        let totalAgentsInGroup = null;
        do{
          const { data: { data: { affected_items, total_affected_items } } } = await context.wazuh.api.client.asCurrentUser.request(
            'GET',
            `/groups/${groupID}/agents`,
            {
              params: {
                offset: agentsData.length,
                select: 'dateAdd,id,ip,lastKeepAlive,manager,name,os.name,os.version,version',
              }
            },
            { apiHostID: apiId }
          );
          !totalAgentsInGroup && (totalAgentsInGroup = total_affected_items);
          agentsData = [...agentsData, ...affected_items];
        }while(agentsData.length < totalAgentsInGroup);
      } else {
        for (const agentID of agentIDs) {
          try {
            const { data: { data: { affected_items: [agent] } } } = await context.wazuh.api.client.asCurrentUser.request(
              'GET',
              `/agents`,
              { 
                params: {
                  q: `id=${agentID}`,
                  select: 'dateAdd,id,ip,lastKeepAlive,manager,name,os.name,os.version,version',
                } 
              },
              { apiHostID: apiId }
            );
            agentsData.push(agent);
          } catch (error) {
            log(
              'reporting:buildAgentsTable',
              `Skip agent due to: ${error.message || error}`,
              'debug'
            );
          }
        }
      }

      if(agentsData.length){
        // Print a table with agent/s information
        printer.addSimpleTable({
          columns: [
            { id: 'id', label: 'ID' },
            { id: 'name', label: 'Name' },
            { id: 'ip', label: 'IP' },
            { id: 'version', label: 'Version' },
            { id: 'manager', label: 'Manager' },
            { id: 'os', label: 'OS' },
            { id: 'dateAdd', label: 'Registration date' },
            { id: 'lastKeepAlive', label: 'Last keep alive' },
          ],
          items: agentsData.map((agent) => {
            return {
              ...agent,
              os: (agent.os && agent.os.name && agent.os.version) ? `${agent.os.name} ${agent.os.version}` : '',
              lastKeepAlive: moment(agent.lastKeepAlive).format(dateFormat),
              dateAdd: moment(agent.dateAdd).format(dateFormat)
            }
          }),
        });
      }else if(!agentsData.length && groupID){
        // For group reports when there is no agents in the group
        printer.addContent({
          text: 'There are no agents in this group.',
          style: { fontSize: 12, color: '#000' },
        });
      }
      
    } catch (error) {
      log('reporting:buildAgentsTable', error.message || error);
      return Promise.reject(error);
    }
  }

  /**
   * This load more information
   * @param {*} context Endpoint context
   * @param {*} printer printer instance
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
  private async extendedInformation(
    context,
    printer,
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
        throw new Error('Reporting for specific agent needs an agent ID in order to work properly');
      }

      const agents = await context.wazuh.api.client.asCurrentUser.request(
        'GET',
        '/agents',
        { params: { limit: 1 } },
        { apiHostID: apiId }
      );

      const totalAgents = agents.data.data.total_affected_items;

      if (section === 'overview' && tab === 'vuls') {
        log(
          'reporting:extendedInformation',
          'Fetching overview vulnerability detector metrics',
          'debug'
        );
        const vulnerabilitiesLevels = ['Low', 'Medium', 'High', 'Critical'];

        const vulnerabilitiesResponsesCount = (
          await Promise.all(
            vulnerabilitiesLevels.map(async (vulnerabilitiesLevel) => {
              try {
                const count = await VulnerabilityRequest.uniqueSeverityCount(
                  context,
                  from,
                  to,
                  vulnerabilitiesLevel,
                  filters,
                  pattern
                );
                return count
                  ? `${count} of ${totalAgents} agents have ${vulnerabilitiesLevel.toLocaleLowerCase()} vulnerabilities.`
                  : undefined;
              } catch (error) {}
            })
          )
        ).filter((vulnerabilitiesResponse) => vulnerabilitiesResponse);

        printer.addList({
          title: { text: 'Summary', style: 'h2' },
          list: vulnerabilitiesResponsesCount,
        });

        log(
          'reporting:extendedInformation',
          'Fetching overview vulnerability detector top 3 agents by category',
          'debug'
        );
        const lowRank = await VulnerabilityRequest.topAgentCount(
          context,
          from,
          to,
          'Low',
          filters,
          pattern
        );
        const mediumRank = await VulnerabilityRequest.topAgentCount(
          context,
          from,
          to,
          'Medium',
          filters,
          pattern
        );
        const highRank = await VulnerabilityRequest.topAgentCount(
          context,
          from,
          to,
          'High',
          filters,
          pattern
        );
        const criticalRank = await VulnerabilityRequest.topAgentCount(
          context,
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
          printer.addContentWithNewLine({
            text: 'Top 3 agents with critical severity vulnerabilities',
            style: 'h3',
          });
          await this.buildAgentsTable(context, printer, criticalRank, apiId);
          printer.addNewLine();
        }

        if (highRank && highRank.length) {
          printer.addContentWithNewLine({
            text: 'Top 3 agents with high severity vulnerabilities',
            style: 'h3',
          });
          await this.buildAgentsTable(context, printer, highRank, apiId);
          printer.addNewLine();
        }

        if (mediumRank && mediumRank.length) {
          printer.addContentWithNewLine({
            text: 'Top 3 agents with medium severity vulnerabilities',
            style: 'h3',
          });
          await this.buildAgentsTable(context, printer, mediumRank, apiId);
          printer.addNewLine();
        }

        if (lowRank && lowRank.length) {
          printer.addContentWithNewLine({
            text: 'Top 3 agents with low severity vulnerabilities',
            style: 'h3',
          });
          await this.buildAgentsTable(context, printer, lowRank, apiId);
          printer.addNewLine();
        }

        log(
          'reporting:extendedInformation',
          'Fetching overview vulnerability detector top 3 CVEs',
          'debug'
        );
        const cveRank = await VulnerabilityRequest.topCVECount(context, from, to, filters, pattern);
        log(
          'reporting:extendedInformation',
          'Adding overview vulnerability detector top 3 CVEs',
          'debug'
        );
        if (cveRank && cveRank.length) {
          printer.addSimpleTable({
            title: { text: 'Top 3 CVE', style: 'h2' },
            columns: [
              { id: 'top', label: 'Top' },
              { id: 'cve', label: 'CVE' },
            ],
            items: cveRank.map((item) => ({ top: cveRank.indexOf(item) + 1, cve: item })),
          });
        }
      }

      if (section === 'overview' && tab === 'general') {
        log('reporting:extendedInformation', 'Fetching top 3 agents with level 15 alerts', 'debug');

        const level15Rank = await OverviewRequest.topLevel15(context, from, to, filters, pattern);

        log('reporting:extendedInformation', 'Adding top 3 agents with level 15 alerts', 'debug');
        if (level15Rank.length) {
          printer.addContent({
            text: 'Top 3 agents with level 15 alerts',
            style: 'h2',
          });
          await this.buildAgentsTable(context, printer, level15Rank, apiId);
        }
      }

      if (section === 'overview' && tab === 'pm') {
        log('reporting:extendedInformation', 'Fetching most common rootkits', 'debug');
        const top5RootkitsRank = await RootcheckRequest.top5RootkitsDetected(
          context,
          from,
          to,
          filters,
          pattern
        );
        log('reporting:extendedInformation', 'Adding most common rootkits', 'debug');
        if (top5RootkitsRank && top5RootkitsRank.length) {
          printer
            .addContentWithNewLine({
              text: 'Most common rootkits found among your agents',
              style: 'h2',
            })
            .addContentWithNewLine({
              text:
                'Rootkits are a set of software tools that enable an unauthorized user to gain control of a computer system without being detected.',
              style: 'standard',
            })
            .addSimpleTable({
              items: top5RootkitsRank.map((item) => {
                return { top: top5RootkitsRank.indexOf(item) + 1, name: item };
              }),
              columns: [
                { id: 'top', label: 'Top' },
                { id: 'name', label: 'Rootkit' },
              ],
            });
        }
        log('reporting:extendedInformation', 'Fetching hidden pids', 'debug');
        const hiddenPids = await RootcheckRequest.agentsWithHiddenPids(
          context,
          from,
          to,
          filters,
          pattern
        );
        hiddenPids &&
          printer.addContent({
            text: `${hiddenPids} of ${totalAgents} agents have hidden processes`,
            style: 'h3',
          });
        !hiddenPids &&
          printer.addContentWithNewLine({
            text: `No agents have hidden processes`,
            style: 'h3',
          });

        const hiddenPorts = await RootcheckRequest.agentsWithHiddenPorts(
          context,
          from,
          to,
          filters,
          pattern
        );
        hiddenPorts &&
          printer.addContent({
            text: `${hiddenPorts} of ${totalAgents} agents have hidden ports`,
            style: 'h3',
          });
        !hiddenPorts &&
          printer.addContent({
            text: `No agents have hidden ports`,
            style: 'h3',
          });
        printer.addNewLine();
      }

      if (['overview', 'agents'].includes(section) && tab === 'pci') {
        log('reporting:extendedInformation', 'Fetching top PCI DSS requirements', 'debug');
        const topPciRequirements = await PCIRequest.topPCIRequirements(
          context,
          from,
          to,
          filters,
          pattern
        );
        printer.addContentWithNewLine({
          text: 'Most common PCI DSS requirements alerts found',
          style: 'h2',
        });
        for (const item of topPciRequirements) {
          const rules = await PCIRequest.getRulesByRequirement(
            context,
            from,
            to,
            filters,
            item,
            pattern
          );
          printer.addContentWithNewLine({ text: `Requirement ${item}`, style: 'h3' });

          if (PCI[item]) {
            const content =
              typeof PCI[item] === 'string' ? { text: PCI[item], style: 'standard' } : PCI[item];
            printer.addContentWithNewLine(content);
          }

          rules &&
            rules.length &&
            printer.addSimpleTable({
              columns: [
                { id: 'ruleID', label: 'Rule ID' },
                { id: 'ruleDescription', label: 'Description' },
              ],
              items: rules,
              title: `Top rules for ${item} requirement`,
            });
        }
      }

      if (['overview', 'agents'].includes(section) && tab === 'tsc') {
        log('reporting:extendedInformation', 'Fetching top TSC requirements', 'debug');
        const topTSCRequirements = await TSCRequest.topTSCRequirements(
          context,
          from,
          to,
          filters,
          pattern
        );
        printer.addContentWithNewLine({
          text: 'Most common TSC requirements alerts found',
          style: 'h2',
        });
        for (const item of topTSCRequirements) {
          const rules = await TSCRequest.getRulesByRequirement(
            context,
            from,
            to,
            filters,
            item,
            pattern
          );
          printer.addContentWithNewLine({ text: `Requirement ${item}`, style: 'h3' });

          if (TSC[item]) {
            const content =
              typeof TSC[item] === 'string' ? { text: TSC[item], style: 'standard' } : TSC[item];
            printer.addContentWithNewLine(content);
          }

          rules &&
            rules.length &&
            printer.addSimpleTable({
              columns: [
                { id: 'ruleID', label: 'Rule ID' },
                { id: 'ruleDescription', label: 'Description' },
              ],
              items: rules,
              title: `Top rules for ${item} requirement`,
            });
        }
      }

      if (['overview', 'agents'].includes(section) && tab === 'gdpr') {
        log('reporting:extendedInformation', 'Fetching top GDPR requirements', 'debug');
        const topGdprRequirements = await GDPRRequest.topGDPRRequirements(
          context,
          from,
          to,
          filters,
          pattern
        );
        printer.addContentWithNewLine({
          text: 'Most common GDPR requirements alerts found',
          style: 'h2',
        });
        for (const item of topGdprRequirements) {
          const rules = await GDPRRequest.getRulesByRequirement(
            context,
            from,
            to,
            filters,
            item,
            pattern
          );
          printer.addContentWithNewLine({ text: `Requirement ${item}`, style: 'h3' });

          if (GDPR && GDPR[item]) {
            const content =
              typeof GDPR[item] === 'string' ? { text: GDPR[item], style: 'standard' } : GDPR[item];
            printer.addContentWithNewLine(content);
          }

          rules &&
            rules.length &&
            printer.addSimpleTable({
              columns: [
                { id: 'ruleID', label: 'Rule ID' },
                { id: 'ruleDescription', label: 'Description' },
              ],
              items: rules,
              title: `Top rules for ${item} requirement`,
            });
        }
        printer.addNewLine();
      }

      if (section === 'overview' && tab === 'audit') {
        log(
          'reporting:extendedInformation',
          'Fetching agents with high number of failed sudo commands',
          'debug'
        );
        const auditAgentsNonSuccess = await AuditRequest.getTop3AgentsSudoNonSuccessful(
          context,
          from,
          to,
          filters,
          pattern
        );
        if (auditAgentsNonSuccess && auditAgentsNonSuccess.length) {
          printer.addContent({
            text: 'Agents with high number of failed sudo commands',
            style: 'h2',
          });
          await this.buildAgentsTable(context, printer, auditAgentsNonSuccess, apiId);
        }
        const auditAgentsFailedSyscall = await AuditRequest.getTop3AgentsFailedSyscalls(
          context,
          from,
          to,
          filters,
          pattern
        );
        if (auditAgentsFailedSyscall && auditAgentsFailedSyscall.length) {
          printer.addSimpleTable({
            columns: [
              { id: 'agent', label: 'Agent ID' },
              { id: 'syscall_id', label: 'Syscall ID' },
              { id: 'syscall_syscall', label: 'Syscall' },
            ],
            items: auditAgentsFailedSyscall.map((item) => ({
              agent: item.agent,
              syscall_id: item.syscall.id,
              syscall_syscall: item.syscall.syscall,
            })),
            title: {
              text: 'Most common failing syscalls',
              style: 'h2',
            },
          });
        }
      }

      if (section === 'overview' && tab === 'fim') {
        log('reporting:extendedInformation', 'Fetching top 3 rules for FIM', 'debug');
        const rules = await SyscheckRequest.top3Rules(context, from, to, filters, pattern);

        if (rules && rules.length) {
          printer.addContentWithNewLine({ text: 'Top 3 FIM rules', style: 'h2' }).addSimpleTable({
            columns: [
              { id: 'ruleID', label: 'Rule ID' },
              { id: 'ruleDescription', label: 'Description' },
            ],
            items: rules,
            title: {
              text: 'Top 3 rules that are generating most alerts.',
              style: 'standard',
            },
          });
        }

        log('reporting:extendedInformation', 'Fetching top 3 agents for FIM', 'debug');
        const agents = await SyscheckRequest.top3agents(context, from, to, filters, pattern);

        if (agents && agents.length) {
          printer.addContentWithNewLine({
            text: 'Agents with suspicious FIM activity',
            style: 'h2',
          });
          printer.addContentWithNewLine({
            text:
              'Top 3 agents that have most FIM alerts from level 7 to level 15. Take care about them.',
            style: 'standard',
          });
          await this.buildAgentsTable(context, printer, agents, apiId);
        }
      }

      if (section === 'agents' && tab === 'audit') {
        log('reporting:extendedInformation', `Fetching most common failed syscalls`, 'debug');
        const auditFailedSyscall = await AuditRequest.getTopFailedSyscalls(
          context,
          from,
          to,
          filters,
          pattern
        );
        auditFailedSyscall &&
          auditFailedSyscall.length &&
          printer.addSimpleTable({
            columns: [
              { id: 'id', label: 'id' },
              { id: 'syscall', label: 'Syscall' },
            ],
            items: auditFailedSyscall,
            title: 'Most common failing syscalls',
          });
      }

      if (section === 'agents' && tab === 'fim') {
        log(
          'reporting:extendedInformation',
          `Fetching syscheck database for agent ${agent}`,
          'debug'
        );

        const lastScanResponse = await context.wazuh.api.client.asCurrentUser.request(
          'GET',
          `/syscheck/${agent}/last_scan`,
          {},
          { apiHostID: apiId }
        );

        if (lastScanResponse && lastScanResponse.data) {
          const lastScanData = lastScanResponse.data.data.affected_items[0];
          if (lastScanData.start && lastScanData.end) {
            printer.addContent({
              text: `Last file integrity monitoring scan was executed from ${lastScanData.start} to ${lastScanData.end}.`,
            });
          } else if (lastScanData.start) {
            printer.addContent({
              text: `File integrity monitoring scan is currently in progress for this agent (started on ${lastScanData.start}).`,
            });
          } else {
            printer.addContent({
              text: `File integrity monitoring scan is currently in progress for this agent.`,
            });
          }
          printer.addNewLine();
        }

        log('reporting:extendedInformation', `Fetching last 10 deleted files for FIM`, 'debug');
        const lastTenDeleted = await SyscheckRequest.lastTenDeletedFiles(
          context,
          from,
          to,
          filters,
          pattern
        );

        lastTenDeleted &&
          lastTenDeleted.length &&
          printer.addSimpleTable({
            columns: [
              { id: 'path', label: 'Path' },
              { id: 'date', label: 'Date' },
            ],
            items: lastTenDeleted,
            title: 'Last 10 deleted files',
          });

        log('reporting:extendedInformation', `Fetching last 10 modified files`, 'debug');
        const lastTenModified = await SyscheckRequest.lastTenModifiedFiles(
          context,
          from,
          to,
          filters,
          pattern
        );

        lastTenModified &&
          lastTenModified.length &&
          printer.addSimpleTable({
            columns: [
              { id: 'path', label: 'Path' },
              { id: 'date', label: 'Date' },
            ],
            items: lastTenModified,
            title: 'Last 10 modified files',
          });
      }

      if (section === 'agents' && tab === 'syscollector') {
        log(
          'reporting:extendedInformation',
          `Fetching hardware information for agent ${agent}`,
          'debug'
        );
        const requestsSyscollectorLists = [
          {
            endpoint: `/syscollector/${agent}/hardware`,
            loggerMessage: `Fetching Hardware information for agent ${agent}`,
            list: {
              title: { text: 'Hardware information', style: 'h2' },
            },
            mapResponse: (hardware) => [
              hardware.cpu && hardware.cpu.cores && `${hardware.cpu.cores} cores`,
              hardware.cpu && hardware.cpu.name,
              hardware.ram &&
                hardware.ram.total &&
                `${Number(hardware.ram.total / 1024 / 1024).toFixed(2)}GB RAM`,
            ],
          },
          {
            endpoint: `/syscollector/${agent}/os`,
            loggerMessage: `Fetching OS information for agent ${agent}`,
            list: {
              title: { text: 'OS information', style: 'h2' },
            },
            mapResponse: (osData) => [
              osData.sysname,
              osData.version,
              osData.architecture,
              osData.release,
              osData.os &&
                osData.os.name &&
                osData.os.version &&
                `${osData.os.name} ${osData.os.version}`,
            ],
          },
        ];

        const syscollectorLists = await Promise.all(
          requestsSyscollectorLists.map(async (requestSyscollector) => {
            try {
              log('reporting:extendedInformation', requestSyscollector.loggerMessage, 'debug');
              const responseSyscollector = await context.wazuh.api.client.asCurrentUser.request(
                'GET',
                requestSyscollector.endpoint,
                {},
                { apiHostID: apiId }
              );
              const [data] =
                (responseSyscollector &&
                  responseSyscollector.data &&
                  responseSyscollector.data.data &&
                  responseSyscollector.data.data.affected_items) ||
                [];
              if (data) {
                return {
                  ...requestSyscollector.list,
                  list: requestSyscollector.mapResponse(data),
                };
              }
            } catch (error) {
              log('reporting:extendedInformation', error.message || error);
            }
          })
        );

        if (syscollectorLists) {
          syscollectorLists
            .filter((syscollectorList) => syscollectorList)
            .forEach((syscollectorList) => printer.addList(syscollectorList));
        }

        const vulnerabilitiesRequests = ['Critical', 'High'];

        const vulnerabilitiesResponsesItems = (
          await Promise.all(
            vulnerabilitiesRequests.map(async (vulnerabilitiesLevel) => {
              try {
                log(
                  'reporting:extendedInformation',
                  `Fetching top ${vulnerabilitiesLevel} packages`,
                  'debug'
                );

                return await VulnerabilityRequest.topPackages(
                  context,
                  from,
                  to,
                  vulnerabilitiesLevel,
                  filters,
                  pattern
                );
              } catch (error) {
                log('reporting:extendedInformation', error.message || error);
              }
            })
          )
        )
          .filter((vulnerabilitiesResponse) => vulnerabilitiesResponse)
          .flat();

        if (vulnerabilitiesResponsesItems && vulnerabilitiesResponsesItems.length) {
          printer.addSimpleTable({
            title: { text: 'Vulnerable packages found (last 24 hours)', style: 'h2' },
            columns: [
              { id: 'package', label: 'Package' },
              { id: 'severity', label: 'Severity' },
            ],
            items: vulnerabilitiesResponsesItems,
          });
        }
      }

      if (section === 'agents' && tab === 'vuls') {
        const topCriticalPackages = await VulnerabilityRequest.topPackagesWithCVE(
          context,
          from,
          to,
          'Critical',
          filters,
          pattern
        );
        if (topCriticalPackages && topCriticalPackages.length) {
          printer.addContentWithNewLine({ text: 'Critical severity', style: 'h2' });
          printer.addContentWithNewLine({
            text:
              'These vulnerabilties are critical, please review your agent. Click on each link to read more about each found vulnerability.',
            style: 'standard',
          });
          const customul = [];
          for (const critical of topCriticalPackages) {
            customul.push({ text: critical.package, style: 'standard' });
            customul.push({
              ul: critical.references.map((item) => ({
                text: item.substring(0, 80) + '...',
                link: item,
                color: '#1EA5C8',
              })),
            });
          }
          printer.addContentWithNewLine({ ul: customul });
        }

        const topHighPackages = await VulnerabilityRequest.topPackagesWithCVE(
          context,
          from,
          to,
          'High',
          filters,
          pattern
        );
        if (topHighPackages && topHighPackages.length) {
          printer.addContentWithNewLine({ text: 'High severity', style: 'h2' });
          printer.addContentWithNewLine({
            text: 'Click on each link to read more about each found vulnerability.',
            style: 'standard',
          });
          const customul = [];
          for (const critical of topHighPackages) {
            customul.push({ text: critical.package, style: 'standard' });
            customul.push({
              ul: critical.references.map((item) => ({
                text: item,
                color: '#1EA5C8',
              })),
            });
          }
          customul && customul.length && printer.addContent({ ul: customul });
          printer.addNewLine();
        }
      }

      return false;
    } catch (error) {
      log('reporting:extendedInformation', error.message || error);
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
        time,
        tables,
        section,
        indexPatternTitle,
        apiId
      } = request.body;
      const { moduleID } = request.params;
      const { from, to } = time || {};
      // Init
      const printer = new ReportPrinter();

      createDataDirectoryIfNotExists();
      createDirectoryIfNotExists(WAZUH_DATA_DOWNLOADS_DIRECTORY_PATH);
      createDirectoryIfNotExists(WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH);
      createDirectoryIfNotExists(path.join(WAZUH_DATA_DOWNLOADS_REPORTS_DIRECTORY_PATH, context.wazuhEndpointParams.hashUsername));

      await this.renderHeader(context, printer, section, moduleID, agents, apiId);

      const [sanitizedFilters, agentsFilter] = filters
        ? this.sanitizeKibanaFilters(filters, searchBar)
        : [false, false];

      if (time && sanitizedFilters) {
        printer.addTimeRangeAndFilters(from, to, sanitizedFilters, browserTimezone);
      }

      if (time) {
        await this.extendedInformation(
          context,
          printer,
          section,
          moduleID,
          apiId,
          new Date(from).getTime(),
          new Date(to).getTime(),
          sanitizedFilters,
          indexPatternTitle,
          agents
        );
      }

      printer.addVisualizations(array, agents, moduleID);

      if (tables) {
        printer.addTables(tables);
      }

      //add authorized agents
      if (agentsFilter) {
        printer.addAgentsFilters(agentsFilter);
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
      const { searchBar, filters, time, indexPatternTitle, apiId } = request.body;
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
      const sanitizedFilters = filters ? this.sanitizeKibanaFilters(filters, searchBar) : false;

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
      await this.buildAgentsTable(context, printer, [agentID], apiId);

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
                    { id: 'local_ip', label: 'Local IP' },
                    { id: 'local_port', label: 'Local port' },
                    { id: 'process', label: 'Process' },
                    { id: 'state', label: 'State' },
                    { id: 'protocol', label: 'Protocol' },
                  ]
                : [
                    { id: 'local_ip', label: 'Local IP' },
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
              { id: 'address', label: 'address' },
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
        await this.extendedInformation(
          context,
          printer,
          'agents',
          'syscollector',
          apiId,
          from,
          to,
          sanitizedFilters + ' AND rule.groups: "vulnerability-detector"',
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
