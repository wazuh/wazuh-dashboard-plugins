import SummaryTable from './summary-table';
import summaryTablesDefinitions from './summary-tables-definitions';
import * as VulnerabilityRequest from './vulnerability-request';
import * as OverviewRequest from './overview-request';
import * as RootcheckRequest from './rootcheck-request';
import * as PCIRequest from './pci-request';
import * as GDPRRequest from './gdpr-request';
import * as TSCRequest from './tsc-request';
import * as AuditRequest from './audit-request';
import * as SyscheckRequest from './syscheck-request';
import PCI from '../../integration-files/pci-requirements-pdfmake';
import GDPR from '../../integration-files/gdpr-requirements-pdfmake';
import TSC from '../../integration-files/tsc-requirements-pdfmake';
import { ReportPrinter } from './printer';
import moment from 'moment';

/**
 * This build the agents table
 * @param {Array<Strings>} ids ids of agents
 * @param {String} apiId API id
 */
export async function buildAgentsTable(
  context,
  printer: ReportPrinter,
  agentIDs: string[],
  apiId: string,
  groupID: string = '',
) {
  const dateFormat = await context.core.uiSettings.client.get('dateFormat');
  if ((!agentIDs || !agentIDs.length) && !groupID) return;
  printer.logger.debug(`${agentIDs.length} agents for API ${apiId}`);
  try {
    let agentsData = [];
    if (groupID) {
      let totalAgentsInGroup = null;
      do {
        const {
          data: {
            data: { affected_items, total_affected_items },
          },
        } = await context.wazuh.api.client.asCurrentUser.request(
          'GET',
          `/groups/${groupID}/agents`,
          {
            params: {
              offset: agentsData.length,
              select:
                'dateAdd,id,ip,lastKeepAlive,manager,name,os.name,os.version,version',
            },
          },
          { apiHostID: apiId },
        );
        !totalAgentsInGroup && (totalAgentsInGroup = total_affected_items);
        agentsData = [...agentsData, ...affected_items];
      } while (agentsData.length < totalAgentsInGroup);
    } else {
      for (const agentID of agentIDs) {
        try {
          const {
            data: {
              data: {
                affected_items: [agent],
              },
            },
          } = await context.wazuh.api.client.asCurrentUser.request(
            'GET',
            `/agents`,
            {
              params: {
                q: `id=${agentID}`,
                select:
                  'dateAdd,id,ip,lastKeepAlive,manager,name,os.name,os.version,version',
              },
            },
            { apiHostID: apiId },
          );
          agentsData.push(agent);
        } catch (error) {
          printer.logger.debug(`Skip agent due to: ${error.message || error}`);
        }
      }
    }

    if (agentsData.length) {
      // Print a table with agent/s information
      printer.addSimpleTable({
        columns: [
          { id: 'id', label: 'ID' },
          { id: 'name', label: 'Name' },
          { id: 'ip', label: 'IP address' },
          { id: 'version', label: 'Version' },
          { id: 'manager', label: 'Manager' },
          { id: 'os', label: 'Operating system' },
          { id: 'dateAdd', label: 'Registration date' },
          { id: 'lastKeepAlive', label: 'Last keep alive' },
        ],
        items: agentsData
          .filter(agent => agent) // Remove undefined agents when Wazuh API no longer finds and agentID
          .map(agent => {
            return {
              ...agent,
              os:
                agent.os && agent.os.name && agent.os.version
                  ? `${agent.os.name} ${agent.os.version}`
                  : '',
              lastKeepAlive: moment(agent.lastKeepAlive).format(dateFormat),
              dateAdd: moment(agent.dateAdd).format(dateFormat),
            };
          }),
      });
    } else if (!agentsData.length && groupID) {
      // For group reports when there is no agents in the group
      printer.addContent({
        text: 'There are no agents in this group.',
        style: { fontSize: 12, color: '#000' },
      });
    }
  } catch (error) {
    printer.logger.error(error.message || error);
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
export async function extendedInformation(
  context,
  printer,
  section,
  tab,
  apiId,
  from,
  to,
  filters,
  pattern,
  agent = null,
) {
  try {
    printer.logger.debug(
      `Section ${section} and tab ${tab}, API is ${apiId}. From ${from} to ${to}. Filters ${JSON.stringify(
        filters,
      )}. Index pattern ${pattern}`,
    );
    if (section === 'agents' && !agent) {
      throw new Error(
        'Reporting for specific agent needs an agent ID in order to work properly',
      );
    }

    const agents = await context.wazuh.api.client.asCurrentUser.request(
      'GET',
      '/agents',
      { params: { limit: 1 } },
      { apiHostID: apiId },
    );

    const totalAgents = agents.data.data.total_affected_items;

    //--- OVERVIEW - VULS
    if (section === 'overview' && tab === 'vuls') {
      printer.logger.debug('Fetching overview vulnerability detector metrics');
      const vulnerabilitiesLevels = ['Low', 'Medium', 'High', 'Critical'];

      const vulnerabilitiesResponsesCount = (
        await Promise.all(
          vulnerabilitiesLevels.map(async vulnerabilitiesLevel => {
            try {
              const count = await VulnerabilityRequest.uniqueSeverityCount(
                context,
                from,
                to,
                vulnerabilitiesLevel,
                filters,
                pattern,
              );
              return count
                ? `${count} of ${totalAgents} agents have ${vulnerabilitiesLevel.toLocaleLowerCase()} vulnerabilities.`
                : undefined;
            } catch (error) {}
          }),
        )
      ).filter(vulnerabilitiesResponse => vulnerabilitiesResponse);

      printer.addList({
        title: { text: 'Summary', style: 'h2' },
        list: vulnerabilitiesResponsesCount,
      });

      printer.logger.debug(
        'Fetching overview vulnerability detector top 3 agents by category',
      );
      const lowRank = await VulnerabilityRequest.topAgentCount(
        context,
        from,
        to,
        'Low',
        filters,
        pattern,
      );
      const mediumRank = await VulnerabilityRequest.topAgentCount(
        context,
        from,
        to,
        'Medium',
        filters,
        pattern,
      );
      const highRank = await VulnerabilityRequest.topAgentCount(
        context,
        from,
        to,
        'High',
        filters,
        pattern,
      );
      const criticalRank = await VulnerabilityRequest.topAgentCount(
        context,
        from,
        to,
        'Critical',
        filters,
        pattern,
      );
      printer.logger.debug(
        'Adding overview vulnerability detector top 3 agents by category',
      );
      if (criticalRank && criticalRank.length) {
        printer.addContentWithNewLine({
          text: 'Top 3 agents with critical severity vulnerabilities',
          style: 'h3',
        });
        await buildAgentsTable(context, printer, criticalRank, apiId);
        printer.addNewLine();
      }

      if (highRank && highRank.length) {
        printer.addContentWithNewLine({
          text: 'Top 3 agents with high severity vulnerabilities',
          style: 'h3',
        });
        await buildAgentsTable(context, printer, highRank, apiId);
        printer.addNewLine();
      }

      if (mediumRank && mediumRank.length) {
        printer.addContentWithNewLine({
          text: 'Top 3 agents with medium severity vulnerabilities',
          style: 'h3',
        });
        await buildAgentsTable(context, printer, mediumRank, apiId);
        printer.addNewLine();
      }

      if (lowRank && lowRank.length) {
        printer.addContentWithNewLine({
          text: 'Top 3 agents with low severity vulnerabilities',
          style: 'h3',
        });
        await buildAgentsTable(context, printer, lowRank, apiId);
        printer.addNewLine();
      }

      printer.logger.debug(
        'Fetching overview vulnerability detector top 3 CVEs',
      );
      const cveRank = await VulnerabilityRequest.topCVECount(
        context,
        from,
        to,
        filters,
        pattern,
      );
      printer.logger.debug('Adding overview vulnerability detector top 3 CVEs');
      if (cveRank && cveRank.length) {
        printer.addSimpleTable({
          title: { text: 'Top 3 CVE', style: 'h2' },
          columns: [
            { id: 'top', label: 'Top' },
            { id: 'cve', label: 'CVE' },
          ],
          items: cveRank.map(item => ({
            top: cveRank.indexOf(item) + 1,
            cve: item,
          })),
        });
      }
    }

    //--- OVERVIEW - GENERAL
    if (section === 'overview' && tab === 'general') {
      printer.logger.debug('Fetching top 3 agents with level 15 alerts');

      const level15Rank = await OverviewRequest.topLevel15(
        context,
        from,
        to,
        filters,
        pattern,
      );

      printer.logger.debug('Adding top 3 agents with level 15 alerts');
      if (level15Rank.length) {
        printer.addContent({
          text: 'Top 3 agents with level 15 alerts',
          style: 'h2',
        });
        await buildAgentsTable(context, printer, level15Rank, apiId);
      }
    }

    //--- OVERVIEW - PM
    if (section === 'overview' && tab === 'pm') {
      printer.logger.debug('Fetching most common rootkits');
      const top5RootkitsRank = await RootcheckRequest.top5RootkitsDetected(
        context,
        from,
        to,
        filters,
        pattern,
      );
      printer.logger.debug('Adding most common rootkits');
      if (top5RootkitsRank && top5RootkitsRank.length) {
        printer
          .addContentWithNewLine({
            text: 'Most common rootkits found among your agents',
            style: 'h2',
          })
          .addContentWithNewLine({
            text: 'Rootkits are a set of software tools that enable an unauthorized user to gain control of a computer system without being detected.',
            style: 'standard',
          })
          .addSimpleTable({
            items: top5RootkitsRank.map(item => {
              return { top: top5RootkitsRank.indexOf(item) + 1, name: item };
            }),
            columns: [
              { id: 'top', label: 'Top' },
              { id: 'name', label: 'Rootkit' },
            ],
          });
      }
      printer.logger.debug('Fetching hidden pids');
      const hiddenPids = await RootcheckRequest.agentsWithHiddenPids(
        context,
        from,
        to,
        filters,
        pattern,
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
        pattern,
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

    //--- OVERVIEW/AGENTS - PCI
    if (['overview', 'agents'].includes(section) && tab === 'pci') {
      printer.logger.debug('Fetching top PCI DSS requirements');
      const topPciRequirements = await PCIRequest.topPCIRequirements(
        context,
        from,
        to,
        filters,
        pattern,
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
          pattern,
        );
        printer.addContentWithNewLine({
          text: `Requirement ${item}`,
          style: 'h3',
        });

        if (PCI[item]) {
          const content =
            typeof PCI[item] === 'string'
              ? { text: PCI[item], style: 'standard' }
              : PCI[item];
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

    //--- OVERVIEW/AGENTS - TSC
    if (['overview', 'agents'].includes(section) && tab === 'tsc') {
      printer.logger.debug('Fetching top TSC requirements');
      const topTSCRequirements = await TSCRequest.topTSCRequirements(
        context,
        from,
        to,
        filters,
        pattern,
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
          pattern,
        );
        printer.addContentWithNewLine({
          text: `Requirement ${item}`,
          style: 'h3',
        });

        if (TSC[item]) {
          const content =
            typeof TSC[item] === 'string'
              ? { text: TSC[item], style: 'standard' }
              : TSC[item];
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

    //--- OVERVIEW/AGENTS - GDPR
    if (['overview', 'agents'].includes(section) && tab === 'gdpr') {
      printer.logger.debug('Fetching top GDPR requirements');
      const topGdprRequirements = await GDPRRequest.topGDPRRequirements(
        context,
        from,
        to,
        filters,
        pattern,
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
          pattern,
        );
        printer.addContentWithNewLine({
          text: `Requirement ${item}`,
          style: 'h3',
        });

        if (GDPR && GDPR[item]) {
          const content =
            typeof GDPR[item] === 'string'
              ? { text: GDPR[item], style: 'standard' }
              : GDPR[item];
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

    //--- OVERVIEW - AUDIT
    if (section === 'overview' && tab === 'audit') {
      printer.logger.debug(
        'Fetching agents with high number of failed sudo commands',
      );
      const auditAgentsNonSuccess =
        await AuditRequest.getTop3AgentsSudoNonSuccessful(
          context,
          from,
          to,
          filters,
          pattern,
        );
      if (auditAgentsNonSuccess && auditAgentsNonSuccess.length) {
        printer.addContent({
          text: 'Agents with high number of failed sudo commands',
          style: 'h2',
        });
        await buildAgentsTable(context, printer, auditAgentsNonSuccess, apiId);
      }
      const auditAgentsFailedSyscall =
        await AuditRequest.getTop3AgentsFailedSyscalls(
          context,
          from,
          to,
          filters,
          pattern,
        );
      if (auditAgentsFailedSyscall && auditAgentsFailedSyscall.length) {
        printer.addSimpleTable({
          columns: [
            { id: 'agent', label: 'Agent ID' },
            { id: 'syscall_id', label: 'Syscall ID' },
            { id: 'syscall_syscall', label: 'Syscall' },
          ],
          items: auditAgentsFailedSyscall.map(item => ({
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

    //--- OVERVIEW - FIM
    if (section === 'overview' && tab === 'fim') {
      printer.logger.debug('Fetching top 3 rules for FIM');
      const rules = await SyscheckRequest.top3Rules(
        context,
        from,
        to,
        filters,
        pattern,
      );

      if (rules && rules.length) {
        printer
          .addContentWithNewLine({ text: 'Top 3 FIM rules', style: 'h2' })
          .addSimpleTable({
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

      printer.logger.debug('Fetching top 3 agents for FIM');
      const agents = await SyscheckRequest.top3agents(
        context,
        from,
        to,
        filters,
        pattern,
      );

      if (agents && agents.length) {
        printer.addContentWithNewLine({
          text: 'Agents with suspicious FIM activity',
          style: 'h2',
        });
        printer.addContentWithNewLine({
          text: 'Top 3 agents that have most FIM alerts from level 7 to level 15. Take care about them.',
          style: 'standard',
        });
        await buildAgentsTable(context, printer, agents, apiId);
      }
    }

    //--- AGENTS - AUDIT
    if (section === 'agents' && tab === 'audit') {
      printer.logger.debug('Fetching most common failed syscalls');
      const auditFailedSyscall = await AuditRequest.getTopFailedSyscalls(
        context,
        from,
        to,
        filters,
        pattern,
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

    //--- AGENTS - FIM
    if (section === 'agents' && tab === 'fim') {
      printer.logger.debug(`Fetching syscheck database for agent ${agent}`);

      const lastScanResponse =
        await context.wazuh.api.client.asCurrentUser.request(
          'GET',
          `/syscheck/${agent}/last_scan`,
          {},
          { apiHostID: apiId },
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

      printer.logger.debug('Fetching last 10 deleted files for FIM');
      const lastTenDeleted = await SyscheckRequest.lastTenDeletedFiles(
        context,
        from,
        to,
        filters,
        pattern,
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

      printer.logger.debug('Fetching last 10 modified files');
      const lastTenModified = await SyscheckRequest.lastTenModifiedFiles(
        context,
        from,
        to,
        filters,
        pattern,
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

    //--- AGENTS - VULNERABILITIES
    if (section === 'agents' && tab === 'vuls') {
      const topCriticalPackages = await VulnerabilityRequest.topPackagesWithCVE(
        context,
        from,
        to,
        'Critical',
        filters,
        pattern,
      );
      if (topCriticalPackages && topCriticalPackages.length) {
        printer.addContentWithNewLine({
          text: 'Critical severity',
          style: 'h2',
        });
        printer.addContentWithNewLine({
          text: 'These vulnerabilties are critical, please review your agent. Click on each link to read more about each found vulnerability.',
          style: 'standard',
        });
        const customul = [];
        for (const critical of topCriticalPackages) {
          customul.push({ text: critical.package, style: 'standard' });
          customul.push({
            ul: critical.references.map(item => ({
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
        pattern,
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
            ul: critical.references.map(item => ({
              text: item,
              color: '#1EA5C8',
            })),
          });
        }
        customul && customul.length && printer.addContent({ ul: customul });
        printer.addNewLine();
      }
    }

    //--- SUMMARY TABLES
    let extraSummaryTables = [];
    if (Array.isArray(summaryTablesDefinitions[section][tab])) {
      const tablesPromises = summaryTablesDefinitions[section][tab].map(
        summaryTable => {
          printer.logger.debug(`Fetching ${summaryTable.title} Table`);
          const alertsSummaryTable = new SummaryTable(
            context,
            from,
            to,
            filters,
            summaryTable,
            pattern,
          );
          return alertsSummaryTable.fetch();
        },
      );
      extraSummaryTables = await Promise.all(tablesPromises);
    }

    return extraSummaryTables;
  } catch (error) {
    printer.logger.error(error.message || error);
    return Promise.reject(error);
  }
}
